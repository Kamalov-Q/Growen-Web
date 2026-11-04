import Link from "next/link";
import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { Avatar } from "@/src/components/ui/Avatar";
import { ContactButton } from "@/src/features/listings/ContactButton";
import { Gallery } from "@/src/features/listings/Gallery";
import { ListingJsonLd } from "@/src/features/listings/ListingJsonLd";
import { LocationMapLoader } from "@/src/features/listings/LocationMapLoader";
import { ListingCard } from "@/src/features/listings/ListingCard";
import { fetchListing, fetchSimilar } from "@/src/features/listings/api";
import {
  formatPrice,
  formatSpecs,
  primaryOffer,
} from "@/src/features/listings/format";
import { isLang } from "@/src/i18n/config";
import { enumLabel, t } from "@/src/i18n/dictionary";
import { num } from "@/src/lib/listing-types";
import { pageMetadata } from "@/src/lib/metadata";

/**
 * Revalidated, not cached forever: a price change or a listing going SOLD
 * should reach the page within minutes.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};

  const listing = await fetchListing(id);
  if (!listing) return { title: "404" };

  const offer = primaryOffer(listing);
  const price = offer ? formatPrice(offer, lang) : null;
  const specs = formatSpecs(listing, lang);

  // The title is what appears in the search result, so it carries the facts
  // somebody searched for: price, size, district — not just the seller's
  // headline, which is often "Срочно!!!".
  const title = [listing.title, price, specs].filter(Boolean).join(" · ");

  const description =
    listing.descriptionText?.trim().slice(0, 155) ??
    [price, specs, listing.address].filter(Boolean).join(" · ");

  const cover =
    listing.images.find((i) => i.isPrimary) ?? listing.images[0] ?? null;

  const meta = pageMetadata({
    lang,
    path: `/listing/${id}`,
    title,
    description,
  });

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      images: cover ? [{ url: cover.url }] : undefined,
    },
    // A listing that is not live should not compete in search. It stays
    // reachable — an inbound link must not 404 — but it is marked noindex so
    // Google drops it rather than sending people to something they cannot
    // buy. `follow` stays on so the links out of it still carry weight.
    ...(listing.status === "ACTIVE"
      ? {}
      : { robots: { index: false, follow: true } }),
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();

  const listing = await fetchListing(id);
  // A missing listing must be a real 404, not a 500 and not an empty shell:
  // a 404 drops the URL from the index, a 500 keeps it and retries.
  if (!listing) notFound();

  // Fetched after the listing because it needs its id, and allowed to fail
  // quietly — "more like this" missing is a worse page, not a broken one.
  const similar = (await fetchSimilar(id, 6).catch(() => [])).filter(
    (l) => l.id !== id,
  );

  // A draft was never published. Showing it would leak an unfinished advert
  // to anybody who guessed the id.
  if (listing.status === "DRAFT") notFound();

  const offer = primaryOffer(listing);
  const price = offer ? formatPrice(offer, lang) : null;
  const specs = formatSpecs(listing, lang);
  const area = num(listing.areaM2);
  const ring = listing.geom?.coordinates[0] ?? null;

  // Readable labels, not the database's own words.
  const building = enumLabel(lang, "building", listing.buildingType);
  const repair = enumLabel(lang, "repair", listing.repairType);
  const sellerKind = enumLabel(lang, "seller", listing.sellerType);

  const rows: { label: string; value: string }[] = [
    ...(listing.rooms
      ? [{ label: t(lang, "detail.rooms"), value: String(listing.rooms) }]
      : []),
    ...(area !== null
      ? [{ label: t(lang, "detail.area"), value: `${area} m²` }]
      : []),
    ...(listing.floor && listing.totalFloors
      ? [
          {
            label: t(lang, "detail.floor"),
            value: `${listing.floor} / ${listing.totalFloors}`,
          },
        ]
      : []),
    ...(building
      ? [{ label: t(lang, "detail.building"), value: building }]
      : []),
    ...(repair ? [{ label: t(lang, "detail.repair"), value: repair }] : []),
    ...(sellerKind
      ? [{ label: t(lang, "detail.sellerType"), value: sellerKind }]
      : []),
  ];

  const seller = listing.owner;
  const sellerName =
    [seller?.name, seller?.surname].filter(Boolean).join(" ") || null;

  return (
    <Page lang={lang} path={`/listing/${id}`} title="" width="wide">
      <ListingJsonLd listing={listing} lang={lang} />

      <div className="flex flex-col gap-7">
        <Link
          href={`/${lang}`}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t(lang, "detail.back")}
        </Link>

        {listing.status !== "ACTIVE" ? (
          <p
            role="status"
            className="rounded-control bg-sold-soft px-4 py-3 text-[15px] text-ink ring-1 ring-sold/25"
          >
            {t(
              lang,
              listing.status === "SOLD"
                ? "detail.soldNotice"
                : "detail.archivedNotice",
            )}
          </p>
        ) : null}

        {/* ── the two-column measure ───────────────────────────────────
            One column was right when the page was only ever read on a
            phone. On a 1400px desktop it stretched the description to the
            full width of the screen, which is unreadable past about 70
            characters a line, and left the price and the seller a full
            scroll apart from the photographs.

            So: photographs and prose on the left at a readable measure, and
            the things a buyer keeps glancing back at — price, address,
            who is selling, how to reach them — in a column that follows
            them down the page.

            The DOM order is the phone order, and `lg:col/row-start` moves
            the pieces without reordering them, so the reading order a
            screen reader gets is the one the markup has. */}
        <div className="grid items-start gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Gallery
            images={listing.images}
            alt={listing.title ?? ""}
            lang={lang}
          />
          </div>

          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {/* `top-20` clears the 4rem sticky header. The sticky lives on
                this inner box rather than the grid item, because a grid
                item is stretched to its row and has nothing to slide
                within. */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-20">
            <header className="flex flex-col gap-3">
              {price ? (
                <p className="nums text-[2.25rem] font-bold leading-none tracking-tight text-ink sm:text-[2.75rem]">
                  {price}
                </p>
              ) : null}
              <h1 className="text-[1.25rem] font-semibold leading-snug text-ink-soft sm:text-[1.4rem]">
                {listing.title ?? t(lang, "listing.untitled")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
                {specs ? <span className="nums">{specs}</span> : null}
                {listing.address ? (
                  <>
                    <span aria-hidden className="text-faint">·</span>
                    <span>{listing.address}</span>
                  </>
                ) : null}
              </div>
              <p className="nums text-[13px] text-faint">
                {t(lang, "detail.views", { n: listing.viewCount })}
              </p>
            </header>

            {seller ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">
                  {t(lang, "detail.seller")}
                </h2>
                <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card ring-1 ring-line">
                  {/* The seller's actual photo, which this block had but
                      never drew — it showed a "?" to anyone without a name
                      and nothing at all to everyone else. */}
                  <Avatar
                    uri={seller.avatarThumbUrl ?? seller.avatarUrl}
                    name={sellerName}
                    size={48}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {sellerName ?? "—"}
                    </span>
                    {seller.isVerifiedRealtor ? (
                      <span className="flex items-center gap-1 text-[13px] font-medium text-brand">
                        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />
                        </svg>
                        {t(lang, "detail.verified")}
                      </span>
                    ) : null}
                  </div>

                  {/* Only when the listing is live. Putting a phone number on a
                      sold advert invites calls the seller does not want.

                      The NUMBER is deliberately not passed down — see
                      ContactButton. This page is statically rendered, so a
                      number handed to a client component would still ship in
                      the HTML and the RSC payload for every crawler to read. */}
                  {listing.contactPhone && listing.status === "ACTIVE" ? (
                    <ContactButton lang={lang} listingId={listing.id} />
                  ) : null}
                </div>
              </section>
            ) : null}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-7 lg:col-start-1 lg:row-start-2">
          {listing.descriptionText?.trim() ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">
                {t(lang, "detail.about")}
              </h2>
              {/* The plain-text copy, NOT descriptionHtml. The HTML is pasted
                  by sellers out of Telegram and rendering it would be an
                  injection hole on a page anybody can publish to. The server
                  keeps a stripped version for exactly this. */}
              <p className="whitespace-pre-line rounded-card bg-surface p-5 text-[15px] leading-7 text-ink-soft shadow-card ring-1 ring-line">
                {listing.descriptionText}
              </p>
            </section>
          ) : null}

          {rows.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">
                {t(lang, "detail.specs")}
              </h2>
              {/* A grid of small facts rather than a long two-column table:
                  six rows of label/value is a form, and nobody reads a form.
                  As tiles they are scannable at a glance. */}
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 rounded-control bg-surface px-4 py-3 shadow-card ring-1 ring-line"
                  >
                    <dt className="text-[12px] uppercase tracking-wide text-faint">
                      {row.label}
                    </dt>
                    <dd className="nums text-[15px] font-medium text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {listing.centroid || ring ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">
                {t(lang, "detail.location")}
              </h2>
              <LocationMapLoader
                centroid={listing.centroid?.coordinates ?? null}
                ring={ring}
                lang={lang}
              />
            </section>
          ) : null}
          </div>
        </div>

        {similar.length ? (
          <section className="flex flex-col gap-3 border-t border-line pt-8">
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">
              {t(lang, "detail.similar")}
            </h2>
            {/* Plain links to other listings. This is how a crawler reaches
                inventory that no feed page happens to link to — without it a
                marketplace with ten thousand listings has ten thousand
                orphan URLs that only the sitemap knows about. */}
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((other) => (
                <li key={other.id}>
                  <ListingCard listing={other} lang={lang} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Page>
  );
}
