"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";

export type ThemeChoice = "system" | "light" | "dark";

const KEY = "growencity.theme";

/**
 * The pre-paint script lives in `public/theme-init.js`, GENERATED from the
 * `KEY` above by `scripts/gen-theme-init.mjs` and loaded as a plain `<script
 * src>` in the layout.
 *
 * It is not exported from here as a string any more. It used to be, rendered
 * inline with `dangerouslySetInnerHTML` — React 19 never executes an inline
 * script it renders on the client and logs an error about it, so the tag
 * worked on the first server render and was dead weight after.
 */

type Ctx = {
  choice: ThemeChoice;
  resolved: "light" | "dark";
  setChoice: (c: ThemeChoice) => void;
};
const ThemeCtx = createContext<Ctx | null>(null);

/**
 * Both pieces of theme state are EXTERNAL STORES, and that is the whole fix
 * for a hydration mismatch that showed up on the settings page.
 *
 * `choice` used to be `useState` with a lazy initialiser that read
 * `document.documentElement`. On the server there is no document, so it
 * returned "system"; on the client the pre-paint script had already written
 * `data-theme="light"`, so the initialiser returned "light". The settings
 * page renders the active choice as a pressed button, so the server marked
 * "Система" and the client marked "Светлая", and React threw the tree away.
 *
 * `useSyncExternalStore` uses `getServerSnapshot` for the server render AND
 * for the hydration render, then switches to `getSnapshot` once mounted.
 * That is exactly the shape this needs: both sides agree on "system" while
 * hydrating, and the real value lands a tick later without a mismatch.
 *
 * Same store shape as `prefs.tsx`, for the same reason.
 */
const listeners = new Set<() => void>();
const emit = () => {
  for (const notify of listeners) notify();
};

function subscribeChoice(notify: () => void): () => void {
  listeners.add(notify);
  // Cross-tab, as prefs.tsx does for currency: two tabs open and a theme
  // changed in one of them should not leave the other disagreeing until it
  // is reloaded.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * STORAGE is the truth, the attribute only a projection of it.
 *
 * This read the `data-theme` attribute and nothing else, with a comment
 * saying the attribute was the truth. It is not: the attribute belongs to
 * <html>, and <html> is the one element the app does not own. Switching
 * language re-renders the root layout — the only layout that renders <html>
 * — and the attribute, which React never knew about and therefore cannot
 * restore, went with it. The theme silently fell back to "system", so a
 * reader who had chosen light and whose machine is set to dark watched the
 * site go dark for changing language.
 *
 * localStorage survives all of that. The attribute is read only as a
 * fallback, for the case where storage is unavailable (a private window)
 * and the pre-paint script put something there for this page's lifetime.
 */
function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (stored === null) {
      const attr = document.documentElement.getAttribute("data-theme");
      return attr === "light" || attr === "dark" ? attr : "system";
    }
  } catch {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" || attr === "dark" ? attr : "system";
  }
  return "system";
}

/** The server cannot read a browser's storage, and "system" is the default. */
const serverChoice = (): ThemeChoice => "system";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * Restoring the theme attribute has to happen BEFORE the browser paints,
 * and a passive effect runs after. That one frame is visible: the page
 * flashed the system theme on every language change and then corrected
 * itself, which is the bug this is half of.
 *
 * React warns about useLayoutEffect during server rendering, correctly —
 * there is no layout to measure. It never runs there, so the hook is chosen
 * per environment. Assigned once at module scope, so the hook call itself is
 * unconditional and the rules of hooks are satisfied.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystem(notify: () => void): () => void {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

const readSystemDark = () => window.matchMedia(DARK_QUERY).matches;
const serverSystemDark = () => false;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const choice = useSyncExternalStore(
    subscribeChoice,
    readChoice,
    serverChoice,
  );

  // Someone switching their OS to dark while the page is open should see it,
  // but only if they have not made a choice of their own.
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    readSystemDark,
    serverSystemDark,
  );

  const setChoice = useCallback((next: ThemeChoice) => {
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // Private window: the theme still applies for this page's lifetime.
    }
    // Storage is the store, and it fires no event in the tab that wrote it,
    // so nothing re-renders until the subscribers are told.
    emit();
  }, []);

  /**
   * Put the attribute back if anything has taken it off.
   *
   * This is the other half of reading from storage. Whatever happens to
   * <html> — a re-render on a language change, a remount, a stray script —
   * the provider restores what the person actually chose.
   *
   * It only ever WRITES, and only for an explicit choice. Removing it here
   * would be a hazard: during the hydration render `choice` is "system" by
   * design, and an effect that removed the attribute on that value would
   * strip the theme from the page for a frame before putting it back.
   * Clearing is `setChoice`'s job, where it is unambiguous.
   *
   * `pathname` is in the dependency list and that is the point of it, not an
   * oversight. The attribute goes missing on a NAVIGATION, while `choice`
   * stays exactly what it was — so an effect keyed on `choice` alone would
   * never run again and the theme would stay lost. Keyed on the path, it
   * re-asserts after every navigation, and setting an attribute to the value
   * it already holds costs nothing.
   */
  const pathname = usePathname();
  useIsomorphicLayoutEffect(() => {
    if (choice === "system") return;
    document.documentElement.setAttribute("data-theme", choice);
  }, [choice, pathname]);

  const resolved = choice === "system" ? (systemDark ? "dark" : "light") : choice;

  return (
    <ThemeCtx.Provider value={{ choice, resolved, setChoice }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
