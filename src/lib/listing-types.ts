/**
 * The listing shapes this site reads.
 *
 * A deliberate SUBSET of the mobile app's `listings.api.ts`, not a copy. The
 * phone renders everything a listing has; these pages render a card, a
 * detail page and a map pin, and typing fields nobody draws only creates
 * places for the two to drift apart.
 */

/**
 * A Postgres `numeric` as it arrives over the wire.
 *
 * node-postgres hands numerics back as STRINGS so that values too large for
 * a JS double are not silently mangled, and the API passes them straight
 * through. Typing them as `number` here would compile and then throw the
 * first time anything called `.toFixed()` on a price — so they are typed
 * honestly and coerced at the edge by `num()`.
 */
export type Numeric = string | number;

/** The one place numerics become numbers. Returns null for anything unusable. */
export const num = (v: Numeric | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export interface ListingImage {
  id: string;
  url: string;
  thumbUrl: string;
  isPrimary: boolean;
  position: number;
  /** Intrinsic size, when the uploader recorded it. Null on older rows. */
  width?: number | null;
  height?: number | null;
}

export interface ListingOffer {
  purpose: "SALE" | "RENT_MONTHLY" | "RENT_DAILY";
  price: Numeric;
  currency: string;
  priceUsd: Numeric | null;
  isActive: boolean;
}

export interface Listing {
  id: string;
  title: string | null;
  descriptionText: string | null;
  category: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SOLD";
  rooms: number | null;
  areaM2: Numeric | null;
  floor: number | null;
  totalFloors: number | null;
  address: string | null;
  images: ListingImage[];
  offers: ListingOffer[];
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  promotedUntil: string | null;
  /**
   * Who published it — OWNER or REALTOR.
   *
   * On the card because it is a real buying signal in this market, not
   * decoration: "from the owner" means no agent fee, and it is the reason
   * every competitor has an "owner only" filter. The feed carries it; it
   * does NOT carry the owner's name, so there is no handle to show.
   */
  sellerType?: string | null;
  publishedAt: string | null;
  centroid: { type: "Point"; coordinates: [number, number] } | null;
}

export interface ListingOwner {
  id: string;
  name: string | null;
  surname: string | null;
  avatarUrl: string | null;
  avatarThumbUrl: string | null;
  isVerifiedRealtor: boolean;
  createdAt: string;
}

/**
 * One listing, in full. Everything the detail page draws.
 *
 * `contactPhone` is on here because the API sends it: it is the number the
 * SELLER chose to publish, not their sign-in number, and showing it is the
 * point of the page.
 */
export interface ListingDetail extends Listing {
  descriptionHtml: string | null;
  contactPhone: string | null;
  sellerType: string | null;
  buildingType: string | null;
  repairType: string | null;
  properties: string[] | null;
  geom: { type: "Polygon"; coordinates: [number, number][][] } | null;
  owner: ListingOwner | null;
  commentCount: number;
  createdAt: string;
}

export interface MapPointFeature {
  listingId: string;
  centroid: { type: "Point"; coordinates: [number, number] };
  price: string;
  currency: string;
  thumbUrl: string | null;
  hasVideo?: boolean;
}

export interface MapPolygonFeature {
  id: string;
  geom: { type: "Polygon"; coordinates: [number, number][][] } | null;
  centroid: { type: "Point"; coordinates: [number, number] } | null;
  title: string | null;
  rooms: number | null;
  areaM2: string | null;
  price: string;
  currency: string;
  thumbUrl: string | null;
  hasVideo?: boolean;
}

export type ViewportResponse =
  | { mode: "points"; features: MapPointFeature[] }
  | { mode: "polygons"; features: MapPolygonFeature[] };

/** What a listing sold for. Owner-only — never on a public response. */
export interface ListingSale {
  listingId: string;
  purpose: ListingOffer["purpose"];
  price: Numeric;
  currency: string;
  soldAt: string;
}
