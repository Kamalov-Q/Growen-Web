import Image from "next/image";
import { cdnSrc } from "@/src/lib/media";
import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { num, type Listing } from "@/src/lib/listing-types";
import { formatSpecs, primaryOffer } from "./format";
import { Price } from "./Price";
import { SaveButton } from "@/src/features/account/SaveButton";
import { isTop } from "./promo";
import { enumLabel } from "@/src/i18n/dictionary";

/**
 * A listing card: the photo IS the card.
 *
 * The first version put the price and the title in a panel UNDER the image,
 * which meant each card was half photo and half grey text, three fitted
 * across a desktop, and the page showed six listings above the fold. Every
 * marketplace people actually use in this market — Joymee, OLX, Uybor —
 * overlays the price on the photo instead, and they are right: a listing
 * grid is scanned, not read, and the photo plus the price is the entire
 * first pass. Everything else is detail for the second.
 *
 * So the text sits on a gradient over the image. Density roughly doubles,
 * and nothing that mattered was lost.
 *
 * A SERVER component — no interactivity, nothing shipped to the client, and
 * every word is in the HTML a crawler reads.
 */
export function ListingCard({
  listing,
  lang,
  priority = false,
}: {
  listing: Listing;
  lang: Lang;
  /**
   * For cards above the fold. One of these images IS the Largest
   * Contentful Paint, and a lazy-loaded LCP element is measured from
   * whenever the browser got round to it.
   */
  priority?: boolean;
}) {
  const cover =
    listing.images.find((i) => i.isPrimary) ?? listing.images[0] ?? null;
  const offer = primaryOffer(listing);
  const specs = formatSpecs(listing, lang);
  const area = num(listing.areaM2);
  const sold = listing.status === "SOLD";
  const top = isTop(listing.promotedUntil);
  const seller = enumLabel(lang, "seller", listing.sellerType ?? null);

  return (
    <Link
      href={`/${lang}/listing/${listing.id}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-card bg-muted-bg shadow-card ring-1 ring-line transition duration-200 hover:shadow-lift sm:aspect-[3/4]"
    >
      {cover ? (
        <Image
          src={cdnSrc(cover.thumbUrl)}
          alt={listing.title ?? ""}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          priority={priority}
          /**
           * NOT optimized: `thumbUrl` is already a CDN thumbnail. Next would
           * generate variants up to 3840w from a few-hundred-pixel source —
           * an upscale, bigger and blurrier — and on Vercel each variant is
           * a metered optimization. `fill` in a fixed ratio still pins the
           * layout, which is the part that matters for CLS.
           */
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-faint">
          —
        </div>
      )}

      {/* The gradient is what makes white text on an arbitrary photo legible.
          Two stops, weighted to the bottom, so the top of the image stays
          clear. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
      />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {top && !sold ? (
            <span className="rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-gold shadow-card">
              TOP
            </span>
          ) : null}
          {sold ? (
            <span className="rounded-md bg-sold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-sold shadow-card">
              {t(lang, "listing.sold")}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <SaveButton lang={lang} listingId={listing.id} />
          {area !== null ? (
            <span className="nums rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              {area} m²
            </span>
          ) : null}
          {seller ? (
            <span className="rounded-md bg-black/45 px-1.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              {seller}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-col gap-0.5 p-3">
        {offer ? (
          <Price
            offer={offer}
            lang={lang}
            className="nums text-[1.15rem] font-bold leading-none tracking-tight text-white"
          />
        ) : null}
        <p className="clamp-2 text-[13px] font-medium leading-snug text-white/95">
          {listing.title ?? t(lang, "listing.untitled")}
        </p>
        {specs ? (
          <p className="nums clamp-1 text-[12px] text-white/70">{specs}</p>
        ) : null}
        {listing.address ? (
          <p className="clamp-1 text-[12px] text-white/55">{listing.address}</p>
        ) : null}
      </div>
    </Link>
  );
}
