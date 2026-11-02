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
 * Digit grouping that does NOT depend on the runtime's locale data.
 *
 * `toLocaleString("uz-UZ")` was the obvious way to write this and it caused
 * a hydration mismatch on every page with a price. The group separator comes
 * from the engine's ICU tables, and the two engines rendering this app do not
 * agree: Node on the server produced `65\u00a0000`, the browser produced
 * `65,000`, React compared the two text nodes and threw away the whole
 * server-rendered subtree (error #418) — on the pages that exist to be
 * crawled.
 *
 * There is no Intl option that pins the separator; it IS the locale data. So
 * the grouping is done here instead, which makes the output a property of
 * this file rather than of whoever's device is running it.
 *
 * U+00A0 rather than a plain space, because both uz-UZ and ru-RU group with
 * one per CLDR — and because a price must not wrap in the middle.
 */
const GROUP = "\u00a0";

export function groupDigits(value: number): string {
  const negative = value < 0;
  const digits = Math.abs(Math.trunc(value)).toString();

  let out = "";
  for (let i = 0; i < digits.length; i++) {
    // A separator before every third digit counted from the right, except
    // at the very start — so 1000 is "1 000", never " 1 000".
    if (i > 0 && (digits.length - i) % 3 === 0) out += GROUP;
    out += digits[i];
  }
  return negative ? `-${out}` : out;
}

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

  const grouped = groupDigits(rounded);
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
