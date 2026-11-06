"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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
 * The feed itself is produced by the SERVER component above this one and
 * passed in as a prop, so the listings are in the HTML a crawler reads.
 *
 * Grid and list are LINKS, not local state: each is its own URL, only the
 * one asked for is rendered, and the server has the feed cached so the
 * switch costs no API call. Rendering both and hiding one was four copies
 * of every listing on the wire — see the page component.
 *
 * The map stays local state. It is the one view that renders nothing on the
 * server, so there is nothing to fetch for it, and routing to it would
 * remount MapLibre on every toggle.
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
/** The two the server can render. The map is not one of them. */
type FeedView = "grid" | "list";

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
  feed,
}: {
  lang: Lang;
  query: FeedQuery;
  count: number;
  /** Purpose tabs and category chips — server-rendered. */
  filters: React.ReactNode;
  /** For the modal's category chips. */
  categories: Category[];
  shelf: React.ReactNode;
  /** The grid or the rows — whichever `query.view` asked for. */
  feed: React.ReactNode;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const router = useRouter();

  const priced = query.priceMin !== undefined || query.priceMax !== undefined;

  /** What the URL says, with the map laid over it while it is open. */
  const feedView: FeedView = query.view === "list" ? "list" : "grid";
  const view: View = mapOpen ? "map" : feedView;

  /**
   * The same URL with a different view.
   *
   * Everything else is carried through — including the price bounds, which
   * the sort and chip links drop. Changing how a list is drawn must not
   * silently widen what is in it.
   */
  const viewHref = (next: FeedView) => {
    const params = new URLSearchParams({ purpose: query.purpose });
    if (query.q?.trim()) params.set("q", query.q.trim());
    if (query.category) params.set("category", query.category);
    if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
    if (query.priceMin !== undefined)
      params.set("priceMin", String(query.priceMin));
    if (query.priceMax !== undefined)
      params.set("priceMax", String(query.priceMax));
    if (next === "list") params.set("view", "list");
    return `/${lang}?${params}`;
  };

  /**
   * `scroll={false}`: the switch is a navigation, and Next scrolls to the
   * top of a new page by default. Somebody eight rows down who wants the
   * same results drawn differently has not asked to be sent back to the
   * header.
   *
   * `prefetch={false}`: these two links sit at the top of the page, so they
   * are in the viewport from the first paint and Next would fetch the other
   * view in the background — which is the payload this change exists to
   * stop sending. The feed is cached server-side, so the click is cheap
   * without it.
   *
   * Links, not `role="tab"`: a tab controls a panel on the same page, and
   * these go somewhere. `aria-current` is what the sort links use.
   */
  const tab = (id: FeedView) => (
    <Link
      key={id}
      href={viewHref(id)}
      scroll={false}
      prefetch={false}
      /* Pressing grid or list while the map is open leaves the map, the
         way it did when all three were one piece of state. Without this
         the URL would change under a map that stayed open and the press
         would look ignored. */
      onClick={() => setMapOpen(false)}
      aria-current={feedView === id ? "page" : undefined}
      aria-label={t(lang, `view.${id}` as "view.grid")}
      title={t(lang, `view.${id}` as "view.grid")}
      className={`grid size-9 place-items-center rounded-[0.55rem] transition ${
        feedView === id
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
    </Link>
  );

  /* ── the bar ───────────────────────────────────────────────────────
     Views on the left, filters on the right, above everything else. Sort
     is NOT here: it lives down by the result count, because it changes the
     order of what you are looking at rather than what you are looking for.

     Held in a variable because in map view it moves: the same markup is
     rendered inside the panel that floats over the map. */
  const bar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-control bg-muted-bg p-1">
            {tab("grid")}
            {tab("list")}
          </div>

          {/* The map is its own button, not a third tab: it replaces the
              whole page rather than restyling the same rows, and grouping
              it with them implies it is the same kind of choice. */}
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            aria-pressed={mapOpen}
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
  );

  return (
    <div className="flex flex-col gap-5">
      {view === "map" ? null : bar}

      <FilterModal
        lang={lang}
        query={query}
        categories={categories}
        open={panel}
        onClose={() => setPanel(false)}
      />

      {view === "map" ? null : filters}

      {view === "map" ? (
        /* Out of the 1400px measure and across the window.
           A grid of cards wants a measure; a map wants the screen. On a
           1920px monitor the container left 260px of page background down
           each side of the one view where every pixel is content — which is
           what every mapping site figured out years ago.

           left-1/2 + -translate-x-1/2 is the standard break-out: the
           element is still in flow, so nothing below it moves. body has
           `overflow-x: clip` so the 100vw does not add a scrollbar. */
        /* Flush on every side.
           `-mt-6` cancels main's top padding so the map starts under the
           header, and `-mb-26` cancels the rest of the page's furniture
           below it: main's own 1.5rem bottom padding plus the footer's
           5rem top margin (Page.tsx and Chrome.tsx). Without the second
           one, scrolling past the map showed a band of empty page
           background between it and the footer — 104px of nothing under a
           view that is meant to run to the edge. */
        <div className="relative left-1/2 -mb-26 -mt-6 w-screen -translate-x-1/2">
          <BrowseMap
            fill
            lang={lang}
            query={query}
            onOpen={(id) => router.push(`/${lang}/listing/${id}`)}
            /* The same two rows, now floating over the map — the map is
               the page here, and a strip of controls above it only
               shortens the one view where every pixel is content. The map
               puts them in its glass panel, above its own search row. */
            overlay={
              <>
                {bar}
                {filters}
              </>
            }
          />
        </div>
      ) : (
        <>
          {shelf}
          <Toolbar lang={lang} query={query} count={count} />
          {feed}
        </>
      )}
    </div>
  );
}
