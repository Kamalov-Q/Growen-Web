import type { Lang } from "@/src/i18n/config";
import { API_URL } from "@/src/lib/site";
import type {
  Listing,
  ListingDetail,
  ViewportResponse,
} from "@/src/lib/listing-types";

export type { Listing, ListingDetail, ViewportResponse };

export type OfferPurpose = "SALE" | "RENT_MONTHLY" | "RENT_DAILY";

export interface FeedQuery {
  purpose: OfferPurpose;
  q?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "priceAsc" | "priceDesc";
  limit?: number;
  offset?: number;
}

export function feedParams(query: FeedQuery): URLSearchParams {
  const p = new URLSearchParams({
    purpose: query.purpose,
    limit: String(query.limit ?? 24),
    offset: String(query.offset ?? 0),
  });
  if (query.q?.trim()) p.set("q", query.q.trim());
  if (query.category) p.set("category", query.category);
  if (query.priceMin !== undefined) p.set("priceMin", String(query.priceMin));
  if (query.priceMax !== undefined) p.set("priceMax", String(query.priceMax));
  if (query.sort) p.set("sort", query.sort);
  return p;
}

/**
 * The feed, fetched on the SERVER.
 *
 * Plain `fetch`, not the browser api client: this runs during the render, has
 * no session to attach and no 401 to retry. The endpoint is public — it is
 * the same data a crawler must be able to read — so there is nothing to
 * authenticate.
 *
 * `revalidate` rather than `no-store`: the listings page is the one that has
 * to be fast and indexable, and re-querying the API for every visitor would
 * make it neither. Five minutes is well inside how fast a property market
 * moves.
 */
export async function fetchFeed(query: FeedQuery): Promise<Listing[]> {
  const res = await fetch(`${API_URL}/listings?${feedParams(query)}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Feed failed: ${res.status}`);
  return (await res.json()) as Listing[];
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * The map's own endpoint: points when zoomed out, polygons when zoomed in.
 *
 * Takes the WHOLE feed query, not just the purpose.
 *
 * It used to take `purpose` alone, while the endpoint has always accepted
 * category, price bounds and an address substring (see the server's
 * MapViewportQueryDto). So picking "Kvartira" in map view navigated,
 * re-queried the viewport and came back with exactly the same pins — the
 * filter looked broken because it was: the chip changed the URL and the map
 * ignored it.
 *
 * `q` maps to `address`, which is what the feed's search box means here.
 */
export async function fetchViewport(
  bbox: BBox,
  zoom: number,
  query: FeedQuery,
  signal?: AbortSignal,
): Promise<ViewportResponse> {
  const p = new URLSearchParams({
    west: String(bbox.west),
    east: String(bbox.east),
    south: String(bbox.south),
    north: String(bbox.north),
    zoom: String(Math.round(zoom)),
    purpose: query.purpose,
  });
  if (query.category) p.set("category", query.category);
  if (query.priceMin !== undefined) p.set("priceMin", String(query.priceMin));
  if (query.priceMax !== undefined) p.set("priceMax", String(query.priceMax));
  // Trimmed-empty is "not filtering" on the server too, but sending a blank
  // param just to have it discarded busts the cache key for nothing.
  if (query.q?.trim()) p.set("address", query.q.trim());
  const res = await fetch(`${API_URL}/listings/map?${p}`, { signal });
  if (!res.ok) throw new Error(`Viewport failed: ${res.status}`);
  return (await res.json()) as ViewportResponse;
}

/**
 * One listing, on the server.
 *
 * Returns null for 404 rather than throwing, so the page can call
 * `notFound()` itself and render the proper 404 instead of a 500. The two
 * are very different to a crawler: a 404 drops the URL from the index, a 500
 * keeps it and schedules a retry.
 *
 * Revalidated rather than cached forever: a price change or a listing going
 * SOLD should reach the page within minutes, not on the next deploy.
 */
export async function fetchListing(
  id: string,
): Promise<ListingDetail | null> {
  const res = await fetch(`${API_URL}/listings/${id}`, {
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Listing failed: ${res.status}`);
  return (await res.json()) as ListingDetail;
}

export interface Category {
  slug: string;
  nameUz: string;
  nameRu: string;
  icon: string;
  sortOrder: number;
  /**
   * Which questions this category asks, set per category by an admin.
   *
   * The server REFUSES a value for a question the category does not ask —
   * a floor on a plot of land is rejected, not ignored — so hiding the
   * field and clearing it are the same decision. A house is its own
   * building, which is why `floorCapable` is false for HOUSE but true for
   * APARTMENT.
   */
  floorCapable: boolean;
  buildingTypeCapable: boolean;
  repairTypeCapable: boolean;
}

/**
 * The categories, from the server.
 *
 * Admin-managed, so they cannot be a constant in this repo — adding a
 * category in the dashboard has to reach the website without a deploy. Named
 * in both languages on the row itself, which is why there is no translation
 * key for them.
 *
 * Cached for an hour: this list changes a few times a year and sits on every
 * listing page.
 */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return (await res.json()) as Category[];
}

export const categoryName = (c: Category, lang: string) =>
  lang === "ru" ? c.nameRu : c.nameUz;

/**
 * "More like this" — same category, nearest first.
 *
 * Worth the extra request on a page that is already server-rendered: it is
 * how a crawler finds inventory that no feed page links to. A marketplace
 * with ten thousand listings and no internal linking has ten thousand
 * orphans.
 */
export async function fetchSimilar(
  id: string,
  limit = 6,
): Promise<Listing[]> {
  const res = await fetch(`${API_URL}/listings/${id}/similar?limit=${limit}`, {
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];
  return (await res.json()) as Listing[];
}


export interface Amenity {
  key: string;
  nameUz: string;
  nameRu: string;
  sortOrder: number;
}

/**
 * The amenity list, from the server.
 *
 * Admin-managed like the categories, so it cannot be a constant here, and
 * cached for an hour because it changes about as often as the categories do.
 */
export async function fetchAmenities(): Promise<Amenity[]> {
  const res = await fetch(`${API_URL}/amenities`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return (await res.json()) as Amenity[];
}

export const amenityName = (a: Amenity, lang: Lang) =>
  lang === "ru" ? a.nameRu : a.nameUz;
