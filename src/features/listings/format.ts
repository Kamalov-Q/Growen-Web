import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { num, type Listing, type ListingOffer } from "@/src/lib/listing-types";

/** The offer a page should lead with: the live one, preferring the asked-for purpose. */
export function primaryOffer(
  listing: Pick<Listing, "offers">,
  prefer?: ListingOffer["purpose"],
): ListingOffer | null {
  const live = listing.offers.filter((o) => o.isActive);
  if (prefer) {
    const match = live.find((o) => o.purpose === prefer);
    if (match) return match;
  }
  return live[0] ?? listing.offers[0] ?? null;
}

const unitFor = (currency: string) => (currency === "UZS" ? "so'm" : "$");

/**
 * A price, optionally converted to the reader's chosen currency.
 *
 * `target` and `rate` are both optional and BOTH are required for a
 * conversion to happen. Without a rate the price is shown in the currency
 * the seller entered rather than converted through a guess — a wrong number
 * on a property listing is worse than an unconverted one.
 *
 * Pure, so the server can call it for the HTML a crawler reads and the
 * client can call it again with a preference. See `Price`.
 */
export function formatPrice(
  offer: ListingOffer,
  lang: Lang,
  target?: "USD" | "UZS" | null,
  rate?: number | null,
): string {
  const n = num(offer.price);
  if (n === null) return "";

  let value = n;
  let currency = offer.currency;
  if (target && rate && target !== currency) {
    value = currency === "USD" ? n * rate : n / rate;
    currency = target;
  }

  // Converted so'm figures run to nine digits, where the last three are
  // noise from the exchange rate rather than anything the seller said.
  const rounded =
    currency === "UZS" && value >= 1_000_000
      ? Math.round(value / 1_000_000) * 1_000_000
      : Math.round(value);

  const grouped = rounded.toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ");
  const per = offer.purpose === "SALE" ? "" : t(lang, "listing.perMonth");
  return `${grouped} ${unitFor(currency)}${per}`;
}

/** "3 xona · 80 m² · 3/5" — the line under the title. */
export function formatSpecs(listing: Listing, lang: Lang): string {
  const bits: string[] = [];
  if (listing.rooms) bits.push(t(lang, "listing.rooms", { n: listing.rooms }));
  const area = num(listing.areaM2);
  if (area !== null) bits.push(`${area} m²`);
  if (listing.floor && listing.totalFloors) {
    bits.push(`${listing.floor}/${listing.totalFloors}`);
  }
  return bits.join(" · ");
}
