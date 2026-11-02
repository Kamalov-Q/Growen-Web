"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

const LABEL: Record<Lang, string> = { uz: "O'zbekcha", ru: "Русский" };

/**
 * Globe, current language, chevron — opening a small menu.
 *
 * Replaces a UZ|RU segmented control. Two languages fit in a toggle, but a
 * toggle shows every option at once, which stops working the moment a third
 * language is added and gives no room for the language's own name. A menu
 * shows "O'zbekcha" and "Русский" rather than two ambiguous letter pairs.
 *
 * The options are real anchors to `/uz…` and `/ru…`, so switching language
 * is a navigation a crawler can follow and a person can open in a new tab —
 * the hreflang pairs on each page depend on those URLs existing.
 *
 * Deliberately NOT next/link; see the note on the anchor below.
 */
export function LangMenu({ lang, path }: { lang: Lang; path: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    // Escape closes without moving focus elsewhere, which is what a menu
    // is expected to do and what a plain click-outside handler misses.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(lang, "nav.language")}
        className="flex h-10 items-center gap-1.5 rounded-control px-2.5 text-muted transition hover:bg-muted-bg hover:text-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          className="size-[1.15rem]"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
        </svg>
        <span className="text-[13px] font-bold tracking-wide text-ink">
          {lang.toUpperCase()}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-3.5 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-control bg-raised py-1 shadow-lift ring-1 ring-line"
        >
          {LANGS.map((code) => {
            const active = code === lang;
            return (
              /* A plain anchor, NOT next/link.
                 `[lang]` is a segment of the ROOT layout — the only layout
                 that renders <html>. A client navigation across it tears the
                 whole tree down and rebuilds it, and in that gap the
                 `data-theme` attribute, which React never knew about and so
                 cannot restore, disappeared: the page flashed the system
                 theme and then corrected itself.

                 A document load has none of that. theme-init.js runs in
                 <head> before the first paint, so the theme is right in the
                 first frame rather than fixed in the second.

                 Nothing the links were for is lost — still real anchors with
                 real hrefs, crawlable, openable in a new tab, hreflang pairs
                 intact. The only thing given up is a client transition, on
                 an action somebody performs about once. */
              <a
                key={code}
                href={`/${code}${path}`}
                hrefLang={code}
                role="menuitem"
                aria-current={active ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px] transition ${
                  active
                    ? "font-semibold text-brand"
                    : "text-ink hover:bg-muted-bg"
                }`}
              >
                {LABEL[code]}
                {active ? (
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : null}
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
