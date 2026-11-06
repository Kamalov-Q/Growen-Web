import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page } from "@/src/components/Page";
import { HomeViews } from "@/src/features/listings/HomeViews";
import { ListingCard } from "@/src/features/listings/ListingCard";
import { ListingRow } from "@/src/features/listings/ListingRow";
import { FeedSkeleton } from "@/src/features/listings/FeedSkeleton";
import { Filters } from "@/src/features/listings/Filters";
import { PurposeBar } from "@/src/features/listings/PurposeBar";
import { TopShelf } from "@/src/features/listings/TopShelf";
import { isTop } from "@/src/features/listings/promo";
import {
  fetchCategories,
  fetchFeed,
  type FeedQuery,
  type OfferPurpose,
} from "@/src/features/listings/api";
import type { Listing } from "@/src/lib/listing-types";
import { LANGS, isLang, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { SITE_NAME } from "@/src/lib/site";
import { pageMetadata } from "@/src/lib/metadata";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const PURPOSES: OfferPurpose[] = ["SALE", "RENT_MONTHLY", "RENT_DAILY"];

/** Everything this page reads out of the query string. */
interface HomeSearchParams {
  purpose?: string;
  q?: string;
  category?: string;
  sort?: string;
  priceMin?: string;
  priceMax?: string;
  view?: string;
}

const readPurpose = (v: string | undefined): OfferPurpose =>
  PURPOSES.includes(v as OfferPurpose) ? (v as OfferPurpose) : "SALE";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ purpose?: string; q?: string; category?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const { purpose, q, category } = await searchParams;
  const p = readPurpose(purpose);

  // The title changes with the purpose, so "sale" and "rent" compete for
  // their own queries instead of one page competing for both.
  const label = t(
    lang,
    p === "SALE"
      ? "home.purposeSale"
      : p === "RENT_MONTHLY"
        ? "home.purposeRent"
        : "home.purposeDaily",
  );

  // Only what changes the content. `sort` is the same listings reordered —
  // a genuine duplicate — and `q` is a search result, marked noindex below.
  const canonical = new URLSearchParams({ purpose: p });
  if (category) canonical.set("category", category);

  return {
    ...pageMetadata({
      lang,
      path: "",
      query: canonical.toString(),
      title: `${label} — ${SITE_NAME}`,
      description: t(lang, "home.tagline"),
    }),
    // A search-results page is not a page to index: thin, infinite and
    // duplicated across every query somebody types.
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * The home screen.
 *
 * A SERVER component that fetches the feed and renders the cards, so the
 * listings are in the HTML — which is the entire reason this site exists.
 *
 * ── One view per render ───────────────────────────────────────────────────
 *
 * Grid or list comes from `?view=`, and only the one being looked at is
 * rendered. It used to render BOTH and let the client hide one with CSS,
 * which put every listing on the wire twice over — once in the HTML and
 * again in the RSC payload beside it, so four copies of every card for a
 * page that shows one. The switch is a link now; the feed is cached for
 * five minutes (see `fetchFeed`), so flipping it costs no API call, and
 * the chosen view is in the URL where it can be shared and crawled like
 * every other choice this page makes.
 *
 * The map is the exception and stays client state: it renders nothing on
 * the server, and a navigation would tear down and rebuild the map.
 */
/**
 * A price bound from the URL, or undefined.
 *
 * Anything that is not a finite, non-negative number is dropped rather than
 * passed through: a URL is public and hand-editable, and `priceMin=abc`
 * reaching the API as NaN turns a typo into a 400 on a page that should
 * simply ignore it.
 */
function readPrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * The shell, and nothing that has to wait for it.
 *
 * ── Why this half is synchronous ──────────────────────────────────────────
 *
 * It awaits `params` — known at build time, free — and NOT `searchParams`,
 * which is what forces a request to be looked at before anything can be
 * rendered. So the header, the search field, the language switcher, the
 * footer and the tab bar are written to the response immediately and the
 * browser can start fetching the CSS and the fonts while the API is still
 * thinking about the feed. Before this, an API that took 400ms meant 400ms
 * of white screen: the page is one `async` function and nothing leaves the
 * server until the slowest thing in it has finished.
 *
 * The feed arrives later in the SAME response — this is streaming, not a
 * second request, so there is no extra round trip and no client-side fetch.
 *
 * ── Why a Suspense boundary and not `loading.tsx` ─────────────────────────
 *
 * A route-level `loading.tsx` replaces the whole page, chrome included, and
 * it would do it on every filter press. This boundary sits below the
 * chrome, and because the router navigates inside a transition React keeps
 * the listings you are already looking at on screen until the new ones are
 * ready, instead of blinking the skeleton at you for 50ms. The skeleton is
 * for the first load, where there is nothing to keep.
 */
export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<HomeSearchParams>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path="" title="" width="wide">
      <Suspense fallback={<FeedSkeleton lang={lang} />}>
        <Feed lang={lang} searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

/**
 * The half that waits: the query string, the API, the listings.
 *
 * A SERVER component still — the listings are in the HTML, which is the
 * entire reason this site exists. It is only separated so that what it
 * waits for does not hold up what does not.
 */
async function Feed({
  lang,
  searchParams,
}: {
  lang: Lang;
  searchParams: Promise<HomeSearchParams>;
}) {
  const sp = await searchParams;
  const query: FeedQuery = {
    purpose: readPurpose(sp.purpose),
    q: sp.q,
    category: sp.category,
    priceMin: readPrice(sp.priceMin),
    priceMax: readPrice(sp.priceMax),
    sort:
      sp.sort === "priceAsc" || sp.sort === "priceDesc" ? sp.sort : "newest",
    // Grid unless the URL says list. Anything else — a stale link, a typo,
    // somebody's experiment — reads as the default rather than as an error:
    // there is nothing here worth failing a page load over.
    view: sp.view === "list" ? "list" : "grid",
    limit: 24,
  };

  // In parallel: the feed is the page, the categories are the filter bar,
  // and waiting for one before asking for the other adds a round trip to
  // every render for no reason.
  const [feed, categories] = await Promise.all([
    // `.catch(() => null)` rather than a try/catch around both: the API
    // being down must not take the page down with it. The chrome, the
    // language switcher and the legal links all still work, and the feed
    // area says so.
    fetchFeed(query).catch(() => null),
    fetchCategories(),
  ]);

  const all: Listing[] = feed ?? [];
  const failed = feed === null;

  // The server already ranks promoted listings first on the default sort,
  // so they arrive at the head of the feed. Pulled out into their own shelf
  // rather than left inline, where a paid placement looked like every other
  // card. Only on the unfiltered default view: a shelf of promoted flats
  // above a search for land is an advert, not a result.
  const showShelf = !query.q && !query.category && query.sort === "newest";
  const promoted = showShelf ? all.filter((l) => isTop(l.promotedUntil)) : [];
  const listings = promoted.length
    ? all.filter((l) => !promoted.includes(l))
    : all;

  const empty = (
    <div className="flex flex-col items-center gap-2 rounded-card bg-surface px-6 py-20 text-center shadow-card ring-1 ring-line">
      <p className="text-[17px] font-semibold text-ink">
        {t(lang, failed ? "home.loadError" : "home.empty")}
      </p>
      <p className="text-sm text-muted">{t(lang, "home.emptyHint")}</p>
    </div>
  );

  const blank = failed || listings.length === 0;

  return (
    <HomeViews
      lang={lang}
      query={query}
      count={all.length}
      categories={categories}
      filters={
        <div className="flex flex-col gap-4">
          <PurposeBar lang={lang} query={query} />
          <Filters lang={lang} query={query} categories={categories} />
        </div>
      }
      shelf={<TopShelf listings={promoted} lang={lang} />}
      feed={
        blank ? (
          empty
        ) : query.view === "list" ? (
          <ul className="flex flex-col gap-3">
            {listings.map((listing, i) => (
              <li key={listing.id}>
                <ListingRow
                  listing={listing}
                  lang={lang}
                  priority={!promoted.length && i < 3}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((listing, i) => (
              <li key={listing.id}>
                {/* The first row is above the fold at every breakpoint. */}
                <ListingCard
                  listing={listing}
                  lang={lang}
                  priority={!promoted.length && i < 5}
                />
              </li>
            ))}
          </ul>
        )
      }
    />
  );
}
