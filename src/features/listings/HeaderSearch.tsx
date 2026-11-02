"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

/** Long enough to finish a word, short enough to feel immediate. */
const DEBOUNCE_MS = 350;

/**
 * The search box, in the header.
 *
 * ── Searches as you type ──────────────────────────────────────────────────
 *
 * No submit button and no Enter required. The typing is debounced, so a
 * request goes out once the person pauses rather than once per keystroke —
 * the endpoint behind this is a database query, and one per keystroke is how
 * a search box takes a server down.
 *
 * Clearing the box clears the SEARCH, not the page: `q` is removed and
 * everything comes back, rather than leaving a stale result set behind with
 * an empty box above it, which reads as broken.
 *
 * ── Why the URL, not local state ──────────────────────────────────────────
 *
 * Each search is still a real navigation, so the result is shareable,
 * bookmarkable and server-rendered, and the back button walks the searches.
 * It uses `replace`, not `push`: typing six letters would otherwise leave
 * six entries in the history and the back button would crawl through them
 * one character at a time.
 *
 * It keeps whatever purpose and category are already active, so searching
 * from inside "Apartments for rent" narrows that rather than throwing it
 * away and starting from everything.
 */
export function HeaderSearch({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const router = useRouter();
  const fromUrl = params.get("q") ?? "";
  const [value, setValue] = useState(fromUrl);

  /**
   * The last value this component navigated to.
   *
   * Without it, the effect below cannot tell "the person typed" from "the
   * URL changed because we navigated", and re-firing on its own navigation
   * is an endless loop.
   */
  const sent = useRef(fromUrl);

  // Keep the box in step when the URL changes from somewhere else — the
  // filter modal also writes `q`, and the back button rewinds it.
  useEffect(() => {
    if (fromUrl === sent.current) return;
    sent.current = fromUrl;
    setValue(fromUrl);
  }, [fromUrl]);

  useEffect(() => {
    const next = value.trim();
    if (next === sent.current) return;

    const id = setTimeout(() => {
      sent.current = next;
      const qs = new URLSearchParams(params.toString());
      if (next) qs.set("q", next);
      else qs.delete("q");
      router.replace(`/${lang}?${qs}`, { scroll: false });
    }, DEBOUNCE_MS);

    // Every keystroke cancels the pending navigation, which is what makes
    // this a debounce rather than one request per character.
    return () => clearTimeout(id);
  }, [value, params, router, lang]);

  return (
    <div className="flex h-11 items-center gap-2 rounded-control bg-muted-bg px-3 ring-1 ring-transparent transition focus-within:bg-surface focus-within:ring-brand">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-[18px] shrink-0 text-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        // `type="search"` would add the browser's own clear button beside
        // ours, which is two X's doing the same job.
        type="text"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(lang, "home.searchPlaceholder")}
        aria-label={t(lang, "home.search")}
        className="h-full w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label={t(lang, "filters.reset")}
          className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-muted-bg hover:text-ink"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
