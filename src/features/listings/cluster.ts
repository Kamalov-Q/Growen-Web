import type { MapPointFeature } from "@/src/lib/listing-types";

/**
 * How close two bubbles may be, IN PIXELS, before they are merged.
 *
 * This used to be a fraction of the viewport — a quarter of the visible
 * longitude span, ported straight from the app (`CLUSTER_GRID_DIVISIONS =
 * 4`). On a phone a quarter of the screen is about 100px, which is the
 * distance that rule was tuned for. On a 1900px-wide desktop map the same
 * fraction is 475px: listings kilometres apart were merged into one badge,
 * and because a cluster is drawn at its members' MEAN, the badge landed on
 * an empty street with nothing under it. The count was right and looked
 * wrong, which is worse than being wrong.
 *
 * A pixel distance is the thing actually being prevented — two bubbles
 * overlapping — and it behaves the same at any window size. 72px is a
 * little over the widest bubble (50px) plus a gap.
 */
const CLUSTER_PX = 72;

export interface PointCluster {
  key: string;
  lng: number;
  lat: number;
  count: number;
  /** The one listing, when the cluster holds exactly one. */
  single: MapPointFeature | null;
  /**
   * Everyone in it. Kept so a cluster the camera cannot split — several
   * listings at one address — can be fanned out instead of staying a badge
   * that does nothing when clicked.
   */
  members: MapPointFeature[];
  /** [west, south, east, north] — what the camera is fitted to on click. */
  bbox: [number, number, number, number];
}

/**
 * Screen-space grid clustering — the numbered circles every serious listings
 * map shows when zoomed out.
 *
 * Ported from `mobile/src/features/map/ListingsMap.maplibre.tsx` so both
 * maps group points identically; a listing that sits in a cluster of three
 * in the app should not be a lone pin on the website.
 *
 * Two passes, and the second is not optional. Points either side of a cell
 * border land in neighbouring buckets and their bubbles still overlap on
 * screen, so anything closer than one cell is merged afterwards. That pass
 * is O(n²) over at most a couple of hundred clusters, which is nothing, and
 * a plain grid beats pulling in a clustering library for this.
 */
export function clusterPoints(
  features: MapPointFeature[],
  /** The visible longitude span. */
  lngSpan: number,
  /** How wide the map is on screen. Together these give degrees per pixel. */
  widthPx: number,
  /** Centre latitude, for the Mercator stretch — see `latCell`. */
  centreLat: number,
): PointCluster[] {
  const cell = Math.max((lngSpan * CLUSTER_PX) / Math.max(widthPx, 1), 1e-7);
  /**
   * The same distance, going up.
   *
   * In Mercator a degree of latitude covers 1/cos(lat) as many pixels as a
   * degree of longitude — a third more at Tashkent's 41°. Using one degree
   * threshold for both axes made the grid merge a third more eagerly
   * vertically than horizontally, so a cell was a rectangle on screen and
   * clusters formed in columns.
   */
  const latCell = Math.max(cell * Math.cos((centreLat * Math.PI) / 180), 1e-7);
  const buckets = new Map<string, MapPointFeature[]>();

  for (const f of features) {
    const [lng, lat] = f.centroid.coordinates;
    const key = `${Math.floor(lng / cell)}:${Math.floor(lat / latCell)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(f);
    else buckets.set(key, [f]);
  }

  const raw: PointCluster[] = [];
  for (const [key, members] of buckets) {
    let west = Infinity;
    let east = -Infinity;
    let south = Infinity;
    let north = -Infinity;
    let sumLng = 0;
    let sumLat = 0;

    for (const m of members) {
      const [lng, lat] = m.centroid.coordinates;
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      sumLng += lng;
      sumLat += lat;
    }

    raw.push({
      key,
      lng: sumLng / members.length,
      lat: sumLat / members.length,
      count: members.length,
      single: members.length === 1 ? (members[0] ?? null) : null,
      members,
      bbox: [west, south, east, north],
    });
  }

  const clusters: PointCluster[] = [];
  for (const c of raw) {
    const near = clusters.find(
      (r) => Math.abs(r.lng - c.lng) < cell && Math.abs(r.lat - c.lat) < latCell,
    );
    if (!near) {
      clusters.push({ ...c, members: [...c.members] });
      continue;
    }
    // Weighted mean, so merging a cluster of twelve into one of two does not
    // drag the bubble halfway to the small one.
    const total = near.count + c.count;
    near.lat = (near.lat * near.count + c.lat * c.count) / total;
    near.lng = (near.lng * near.count + c.lng * c.count) / total;
    near.count = total;
    near.single = null;
    near.members.push(...c.members);
    near.bbox = [
      Math.min(near.bbox[0], c.bbox[0]),
      Math.min(near.bbox[1], c.bbox[1]),
      Math.max(near.bbox[2], c.bbox[2]),
      Math.max(near.bbox[3], c.bbox[3]),
    ];
  }

  return clusters;
}
