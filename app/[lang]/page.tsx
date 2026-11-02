import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { HomeViews } from "@/src/features/listings/HomeViews";
import { ListingCard } from "@/src/features/listings/ListingCard";
import { ListingRow } from "@/src/features/listings/ListingRow";
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
import { LANGS, isLang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { SITE_NAME } from "@/src/lib/site";
import { pageMetadata } from "@/src/lib/metadata";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const PURPOSES: OfferPurpose[] = ["SALE", "RENT_MONTHLY", "RENT_DAILY"];

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
 * The view switcher and the map are the only client parts, layered on top.
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

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    purpose?: string;
    q?: string;
    category?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
  }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const sp = await searchParams;
  const query: FeedQuery = {
    purpose: readPurpose(sp.purpose),
    q: sp.q,
    category: sp.category,
    priceMin: readPrice(sp.priceMin),
    priceMax: readPrice(sp.priceMax),
    sort:
      sp.sort === "priceAsc" || sp.sort === "priceDesc" ? sp.sort : "newest",
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

  // Rendered once each and handed to the client switcher. Both are in the
  // HTML, so whichever view a visitor lands in, a crawler reads the
  // listings — and switching costs no round trip.
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
    <Page lang={lang} path="" title="" width="wide">
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
        grid={
          blank ? (
            empty
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
        rows={
          blank ? (
            empty
          ) : (
            <ul className="flex flex-col gap-3">
              {listings.map((listing) => (
                <li key={listing.id}>
                  {/* No `priority` here: the grid is the default view, so
                      the LCP image is one of ITS cards. Marking both sets
                      would preload two images for one visible element. */}
                  <ListingRow listing={listing} lang={lang} />
                </li>
              ))}
            </ul>
          )
        }
      />
    </Page>
  );
}
