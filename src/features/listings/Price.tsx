"use client";

import type { Lang } from "@/src/i18n/config";
import { usePrefs } from "@/src/features/settings/prefs";
import type { ListingOffer } from "@/src/lib/listing-types";
import { formatPrice } from "./format";

/**
 * A price that follows the reader's currency setting.
 *
 * A tiny CLIENT island inside otherwise server-rendered cards. The card
 * stays a server component — the listings must be in the HTML a crawler
 * reads — and only this span hydrates.
 *
 * The server renders the seller's own currency, which is also what
 * `getServerSnapshot` reports, so the first client paint matches the HTML
 * exactly and there is no hydration mismatch. If a preference is stored, the
 * converted figure replaces it in the same commit.
 *
 * Search engines therefore index the real, seller-stated price, which is the
 * one that should appear in a result — not whatever currency the last
 * visitor happened to pick.
 */
export function Price({
  offer,
  lang,
  className,
}: {
  offer: ListingOffer;
  lang: Lang;
  className?: string;
}) {
  const { currency, rate } = usePrefs();
  const target = currency === "AUTO" ? null : currency;
  return (
    <span className={className}>{formatPrice(offer, lang, target, rate)}</span>
  );
}
