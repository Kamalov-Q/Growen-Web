import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { enumLabel, t } from "@/src/i18n/dictionary";
import { num, type Listing } from "@/src/lib/listing-types";
import { formatSpecs, primaryOffer } from "./format";
import { Price } from "./Price";
import { SaveButton } from "@/src/features/account/SaveButton";
import { isTop } from "./promo";

/**
 * The list view's card: photo left, everything else readable beside it.
 *
 * The grid card overlays its text on the photo, which is right when cards
 * are scanned in a wall of five across. In a single column that same card
 * becomes enormous and shows four listings a screen — the density goes the
 * wrong way. A row puts the photo at a fixed width and gives the text real
 * estate it does not have to share with an image, so the list view earns
 * its place instead of being the grid at a different size.
 *
 * A SERVER component, like the grid card. Both renderings of the feed are
 * in the HTML; the switch only decides which one is visible.
 */
export function ListingRow({
  listing,
  lang,
  priority = false,
}: {
  listing: Listing;
  lang: Lang;
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
      className="group flex gap-4 overflow-hidden rounded-card bg-surface p-3 shadow-card ring-1 ring-line transition hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-[0.7rem] bg-muted-bg sm:w-52">
        {cover ? (
          <Image
            src={cover.thumbUrl}
            alt={listing.title ?? ""}
            fill
            sizes="(max-width: 640px) 128px, 208px"
            priority={priority}
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-faint">
            —
          </div>
        )}

        <div className="absolute end-2 top-2 z-10">
          <SaveButton lang={lang} listingId={listing.id} />
        </div>

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2">
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
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
        {offer ? (
          <Price
            offer={offer}
            lang={lang}
            className="nums text-[1.3rem] font-bold leading-none tracking-tight text-ink"
          />
        ) : null}

        {/* `line-clamp-2` so a long title cannot push the row taller than
            its photo and break the rhythm of the column. */}
        <p className="line-clamp-2 text-[15px] font-medium leading-snug text-ink-soft">
          {listing.title}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          {specs ? <span className="nums">{specs}</span> : null}
          {area !== null ? <span className="nums">{area} m²</span> : null}
          {seller ? (
            <span className="rounded-md bg-muted-bg px-1.5 py-0.5 text-[12px] font-medium">
              {seller}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
