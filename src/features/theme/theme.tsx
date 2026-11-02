"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  return () => {
    listeners.delete(notify);
  };
}

function readChoice(): ThemeChoice {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" || attr === "dark" ? attr : "system";
}

/** The server cannot read a browser's storage, and "system" is the default. */
const serverChoice = (): ThemeChoice => "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystem(notify: () => void): () => void {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

const readSystemDark = () => window.matchMedia(DARK_QUERY).matches;
const serverSystemDark = () => false;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read from the DOM, which the pre-paint script has already written. The
  // attribute is the truth; reading storage again could disagree with what
  // is on screen.
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
    // The DOM attribute IS the store, so nothing re-renders until the
    // subscribers are told it changed.
    emit();
  }, []);

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
