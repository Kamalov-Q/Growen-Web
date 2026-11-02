import type { MapPointFeature } from "@/src/lib/listing-types";

/**
 * How many cells the visible width is divided into.
 *
 * Ported from the mobile app (`CLUSTER_GRID_DIVISIONS`). Four means a
 * cluster bubble is never closer than a quarter of the screen to its
 * neighbour, which is what stops the price pills overlapping at city zoom.
 */
const GRID_DIVISIONS = 4;

export interface PointCluster {
  key: string;
  lng: number;
  lat: number;
  count: number;
  /** The one listing, when the cluster holds exactly one. */
  single: MapPointFeature | null;
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
  /** The visible longitude span, which sets the cell size. */
  lngSpan: number,
): PointCluster[] {
  const cell = Math.max(lngSpan / GRID_DIVISIONS, 1e-6);
  const buckets = new Map<string, MapPointFeature[]>();

  for (const f of features) {
    const [lng, lat] = f.centroid.coordinates;
    const key = `${Math.floor(lng / cell)}:${Math.floor(lat / cell)}`;
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
      bbox: [west, south, east, north],
    });
  }

  const clusters: PointCluster[] = [];
  for (const c of raw) {
    const near = clusters.find(
      (r) => Math.abs(r.lng - c.lng) < cell && Math.abs(r.lat - c.lat) < cell,
    );
    if (!near) {
      clusters.push({ ...c });
      continue;
    }
    // Weighted mean, so merging a cluster of twelve into one of two does not
    // drag the bubble halfway to the small one.
    const total = near.count + c.count;
    near.lat = (near.lat * near.count + c.lat * c.count) / total;
    near.lng = (near.lng * near.count + c.lng * c.count) / total;
    near.count = total;
    near.single = null;
    near.bbox = [
      Math.min(near.bbox[0], c.bbox[0]),
      Math.min(near.bbox[1], c.bbox[1]),
      Math.max(near.bbox[2], c.bbox[2]),
      Math.max(near.bbox[3], c.bbox[3]),
    ];
  }

  return clusters;
}
