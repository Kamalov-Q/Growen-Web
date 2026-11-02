"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { Category, FeedQuery } from "./api";
import { FilterModal } from "./FilterModal";
import { Toolbar } from "./Toolbar";

/**
 * The view bar, the view state, and the map behind one of the options.
 *
 * MapLibre is loaded through next/dynamic with `ssr: false` for two separate
 * reasons: it touches `window` at import time so it cannot server-render at
 * all, and it is the largest dependency on the site while most visitors
 * arrive on the list from a search result and never open the map.
 *
 * Both list renderings are produced by the SERVER component above this one
 * and passed in as props, so the listings are in the HTML a crawler reads
 * whichever view happens to be showing.
 */

const BrowseMap = dynamic(
  () => import("./BrowseMap").then((m) => m.BrowseMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] w-full animate-pulse rounded-card bg-muted-bg" />
    ),
  },
);

type View = "grid" | "list" | "map";

const ICONS: Record<View, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  list: (
    <>
      <rect x="3" y="4.5" width="18" height="5" rx="1.6" />
      <rect x="3" y="14.5" width="18" height="5" rx="1.6" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" />
      <path d="M9 4v13M15 7v13" />
    </>
  ),
};

export function HomeViews({
  lang,
  query,
  count,
  filters,
  categories,
  shelf,
  grid,
  rows,
}: {
  lang: Lang;
  query: FeedQuery;
  count: number;
  /** Purpose tabs and category chips — server-rendered. */
  filters: React.ReactNode;
  /** For the modal's category chips. */
  categories: Category[];
  shelf: React.ReactNode;
  grid: React.ReactNode;
  rows: React.ReactNode;
}) {
  const [view, setView] = useState<View>("grid");
  const [panel, setPanel] = useState(false);
  const router = useRouter();

  const priced = query.priceMin !== undefined || query.priceMax !== undefined;

  const tab = (id: View) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={view === id}
      aria-label={t(lang, `view.${id}` as "view.grid")}
      title={t(lang, `view.${id}` as "view.grid")}
      onClick={() => setView(id)}
      className={`grid size-9 place-items-center rounded-[0.55rem] transition ${
        view === id
          ? "bg-surface text-ink shadow-card"
          : "text-muted hover:text-ink"
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-[1.05rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        {ICONS[id]}
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── the bar ─────────────────────────────────────────────────────
          Views on the left, filters on the right, above everything else.
          Sort is NOT here: it lives down by the result count, because it
          changes the order of what you are looking at rather than what you
          are looking for. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label={t(lang, "view.grid")}
            className="flex gap-1 rounded-control bg-muted-bg p-1"
          >
            {tab("grid")}
            {tab("list")}
          </div>

          {/* The map is its own button, not a third tab: it replaces the
              whole page rather than restyling the same rows, and grouping
              it with them implies it is the same kind of choice. */}
          <button
            type="button"
            onClick={() => setView(view === "map" ? "grid" : "map")}
            aria-pressed={view === "map"}
            className={`flex h-11 items-center gap-2 rounded-control px-4 text-[14px] font-semibold transition ${
              view === "map"
                ? "bg-brand text-brand-ink"
                : "bg-muted-bg text-ink hover:bg-line"
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-[1.05rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            >
              {ICONS.map}
            </svg>
            {t(lang, "view.map")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          className={`flex h-11 items-center gap-2 rounded-control px-5 text-[14px] font-semibold transition ${
            panel || priced
              ? "bg-brand text-brand-ink"
              : "bg-muted-bg text-ink hover:bg-line"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-[1.05rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {t(lang, "filters.open")}
          {/* A dot, not a count: the point is "something is narrowing this",
              and a number here competes with the result count below. */}
          {priced ? (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-current opacity-80"
            />
          ) : null}
        </button>
      </div>

      <FilterModal
        lang={lang}
        query={query}
        categories={categories}
        open={panel}
        onClose={() => setPanel(false)}
      />

      {filters}

      {view === "map" ? (
        /* Out of the 1400px measure and across the window.
           A grid of cards wants a measure; a map wants the screen. On a
           1920px monitor the container left 260px of page background down
           each side of the one view where every pixel is content — which is
           what every mapping site figured out years ago.

           left-1/2 + -translate-x-1/2 is the standard break-out: the
           element is still in flow, so nothing below it moves. body has
           `overflow-x: clip` so the 100vw does not add a scrollbar. */
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-3 sm:px-4 lg:px-6">
          <BrowseMap
            lang={lang}
            query={query}
            onOpen={(id) => router.push(`/${lang}/listing/${id}`)}
          />
        </div>
      ) : (
        <>
          {shelf}
          <Toolbar lang={lang} query={query} count={count} />
          {/* Both renderings stay MOUNTED and one is hidden, rather than
              unmounted: throwing one away loses the server-rendered markup
              and the scroll position, and brings both back only after a
              re-render. */}
          <div className={view === "grid" ? "" : "hidden"}>{grid}</div>
          <div className={view === "list" ? "" : "hidden"}>{rows}</div>
        </>
      )}
    </div>
  );
}
