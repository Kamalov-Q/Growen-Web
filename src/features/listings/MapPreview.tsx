"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { num, type ListingDetail, type MapPointFeature } from "@/src/lib/listing-types";
import { fetchListing } from "./api";
import { formatSpecs, primaryOffer } from "./format";
import { Price } from "./Price";
import { SaveButton } from "@/src/features/account/SaveButton";
import { ContactButton } from "./ContactButton";
import { Avatar } from "@/src/components/ui/Avatar";
import { VerifiedSeal } from "@/src/components/ui/Seal";

/**
 * The card that appears when a map pin is clicked — the web counterpart of
 * the app's `ListingPreviewSheet`.
 *
 * ── Why it shows something immediately ────────────────────────────────────
 *
 * The pin already carries the price, the thumbnail and the specs from the
 * viewport query, so the card renders from THAT the instant it opens and
 * fills in the title, address and gallery when the full listing arrives.
 * Waiting for the fetch would mean a click that appears to do nothing for
 * a few hundred milliseconds, which reads as a dead pin.
 */
export function MapPreview({
  lang,
  feature,
  onClose,
}: {
  lang: Lang;
  feature: MapPointFeature;
  onClose: () => void;
}) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const card = useRef<HTMLDivElement>(null);

  /**
   * No reset of `listing` here.
   *
   * The parent gives this component a `key` of the listing id, so clicking a
   * different pin REMOUNTS it and the state starts empty on its own.
   * Clearing it inside the effect instead would be a synchronous setState
   * during an effect — a second render pass the compiler lint rejects — and
   * it would also leave the previous listing's title on screen for one
   * frame before the reset landed.
   */
  useEffect(() => {
    let alive = true;
    fetchListing(feature.listingId)
      .then((l) => alive && setListing(l))
      .catch(() => {
        // The card keeps the feature's own data; nothing to announce.
      });
    return () => {
      alive = false;
    };
  }, [feature.listingId]);

  /**
   * Bring the card into view when it opens.
   *
   * The map is taller than what is left of the window below the toolbar, so
   * its bottom — where this card sits — can be under the fold. A click on a
   * pin then appeared to do nothing at all. `nearest` scrolls the minimum
   * needed and does nothing when the card is already visible.
   */
  useEffect(() => {
    card.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const offer = listing ? primaryOffer(listing) : null;
  const specs = listing ? formatSpecs(listing, lang) : null;
  const area = listing ? num(listing.areaM2) : null;
  const cover =
    listing?.images.find((i) => i.isPrimary)?.thumbUrl ??
    listing?.images[0]?.thumbUrl ??
    feature.thumbUrl ??
    null;

  const ownerName =
    [listing?.owner?.name, listing?.owner?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  return (
    <div
      ref={card}
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:start-3 sm:w-[22rem]"
    >
      <div className="relative overflow-hidden rounded-card bg-surface shadow-lift ring-1 ring-line">
        {/* Seller and the way out, on one line above the photo — the two
            things that are about the card rather than about the listing.
            The app's sheet puts them here for the same reason, and it is
            better than a close button floating over the photograph. */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar
            uri={listing?.owner?.avatarThumbUrl ?? listing?.owner?.avatarUrl}
            name={ownerName}
            size={28}
          />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
            {ownerName ?? t(lang, "detail.seller")}
          </span>
          {listing?.owner?.isVerifiedRealtor ? (
            <VerifiedSeal className="size-4" />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, "filters.close")}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-muted-bg hover:text-ink"
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
        </div>

        <Link href={`/${lang}/listing/${feature.listingId}`} className="block">
          <div className="relative aspect-[16/10] w-full bg-muted-bg">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                sizes="352px"
                unoptimized
                className="object-cover"
              />
            ) : null}

            <div className="absolute start-2 top-2">
              <SaveButton lang={lang} listingId={feature.listingId} />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-3.5">
            {offer ? (
              <Price
                offer={offer}
                lang={lang}
                className="nums text-[1.25rem] font-bold leading-none tracking-tight text-ink"
              />
            ) : (
              <span className="nums text-[1.25rem] font-bold leading-none tracking-tight text-ink">
                {feature.price
                  ? `${Math.round(Number(feature.price)).toLocaleString(
                      lang === "ru" ? "ru-RU" : "uz-UZ",
                    )} ${feature.currency === "UZS" ? "so'm" : "$"}`
                  : ""}
              </span>
            )}

            {listing ? (
              <p className="line-clamp-2 text-[14px] leading-snug text-ink-soft">
                {listing.title}
              </p>
            ) : (
              <span className="h-4 w-3/4 animate-pulse rounded bg-muted-bg" />
            )}

            <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
              {specs ? <span className="nums">{specs}</span> : null}
              {area !== null ? <span className="nums">{area} m²</span> : null}
            </div>

            {listing?.address ? (
              <p className="truncate text-[13px] text-faint">
                {listing.address}
              </p>
            ) : null}

            {listing ? (
              <p className="nums text-[12px] text-faint">
                {t(lang, "detail.views", { n: listing.viewCount })}
              </p>
            ) : null}
          </div>
        </Link>

        {/* The pair at the foot, as in the app: the number, and the way in.
            `ContactButton` rather than a bare `tel:` — on the web the
            seller's number must not be in the markup, so it is fetched on
            click by somebody signed in. See the note in that file. */}
        <div className="flex items-stretch gap-2 px-3.5 pb-3.5">
          <ContactButton lang={lang} listingId={feature.listingId} compact />
          <Link
            href={`/${lang}/listing/${feature.listingId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-brand px-3 py-2.5 text-[14px] font-bold text-brand-ink transition hover:bg-brand-hover"
          >
            {t(lang, "map.details")}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
