"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

function systemIsDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /**
   * Initialised from the DOM, not from localStorage.
   *
   * The script above has already run by the time this mounts, so the
   * attribute is the truth and reading it avoids a second storage access
   * that could disagree with what is on screen.
   *
   * A lazy initialiser rather than an effect: setting state in an effect to
   * match something already rendered is a second render for no reason, and
   * the React Compiler lint flags it.
   */
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    if (typeof document === "undefined") return "system";
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" || attr === "dark" ? attr : "system";
  });

  const [systemDark, setSystemDark] = useState(systemIsDark);

  // Someone switching their OS to dark while the page is open should see it,
  // but only if they have not made a choice of their own.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // Private window: the theme still applies for this page's lifetime.
    }
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
