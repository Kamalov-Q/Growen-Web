"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { num, type Listing, type MapPointFeature } from "@/src/lib/listing-types";
import { fetchListing } from "./api";
import { formatSpecs, primaryOffer } from "./format";
import { Price } from "./Price";
import { SaveButton } from "@/src/features/account/SaveButton";

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
  const [listing, setListing] = useState<Listing | null>(null);

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

  const offer = listing ? primaryOffer(listing) : null;
  const specs = listing ? formatSpecs(listing, lang) : null;
  const area = listing ? num(listing.areaM2) : null;
  const cover =
    listing?.images.find((i) => i.isPrimary)?.thumbUrl ??
    listing?.images[0]?.thumbUrl ??
    feature.thumbUrl ??
    null;

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:start-3 sm:w-[22rem]">
      <div className="relative overflow-hidden rounded-card bg-surface shadow-lift ring-1 ring-line">
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, "filters.close")}
          className="absolute end-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
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
          </div>
        </Link>
      </div>
    </div>
  );
}
