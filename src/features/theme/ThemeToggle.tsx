"use client";

import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useTheme } from "./theme";

/**
 * One button that flips light and dark.
 *
 * A button rather than a three-way menu: "system" is the state a visitor
 * starts in and almost nobody deliberately returns to, so spending a
 * dropdown on it buys a rarely-used option at the cost of a click on the
 * common one. Picking the opposite of what is currently on screen is the
 * whole interaction.
 *
 * Both icons are rendered and cross-faded rather than swapped, so the
 * button never changes size and the row does not shift as it animates.
 *
 * ── Why nothing here reads the theme during render ─────────────────────────
 *
 * It used to, and it caused a hydration error. On the server there is no
 * `window`, so the resolved theme was always "light"; on a machine set to
 * dark the client resolved "dark" and every theme-dependent attribute — the
 * label, the title, both icons' classes — disagreed with the HTML.
 *
 * So the markup is now theme-INDEPENDENT. The label says what the button
 * does ("switch theme"), which is true in either state, and which icon shows
 * is decided by CSS from the same `color-scheme` the rest of the palette
 * uses. The server and the client emit identical markup, and the icon is
 * still correct on the very first paint — earlier than React could have
 * made it correct anyway.
 */
export function ThemeToggle({ lang }: { lang: Lang }) {
  const { resolved, setChoice } = useTheme();

  return (
    <button
      type="button"
      // `resolved` is read at CLICK time, not render time, so it is never
      // part of the server/client comparison.
      onClick={() => setChoice(resolved === "dark" ? "light" : "dark")}
      aria-label={t(lang, "theme.switch")}
      title={t(lang, "theme.switch")}
      className="relative grid size-10 shrink-0 place-items-center rounded-control text-muted transition hover:bg-muted-bg hover:text-ink"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="theme-icon-light absolute size-[1.15rem] transition duration-200"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="theme-icon-dark absolute size-[1.15rem] transition duration-200"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
