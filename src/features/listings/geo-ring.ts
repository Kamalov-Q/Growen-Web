/** [lng, lat] — the order every map library here uses. */
export type Ring = [number, number][];

/**
 * Close a ring the way GeoJSON requires.
 *
 * A GeoJSON `Polygon`'s outer ring must repeat its first position as its
 * last. The drawing UI does NOT keep that duplicate — a visible vertex
 * sitting exactly on another one is something a person would try to drag —
 * so it is added here, at the boundary where the shape stops being a UI
 * concern and becomes data.
 */
export function closeRing(ring: Ring): Ring {
  if (ring.length < 3) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [first[0], first[1]]];
}

/**
 * The area of a ring in square metres.
 *
 * The spherical excess formula (the same one `@turf/area` uses), not a
 * planar shoelace on raw degrees: a degree of longitude is about 83km at
 * Tashkent's latitude and 111km at the equator, so treating lng/lat as a
 * flat grid overstates the area by roughly a third here. For a field the
 * owner may accept as the listing's size, that is not a rounding error.
 *
 * Shown live while drawing so an obviously wrong outline is obvious before
 * it is saved, and pre-filled into the area field.
 */
export function ringAreaM2(ring: Ring): number {
  if (ring.length < 3) return 0;

  const R = 6_378_137; // WGS84 equatorial radius, metres
  const rad = (deg: number) => (deg * Math.PI) / 180;

  const closed = closeRing(ring);
  let total = 0;

  for (let i = 0; i < closed.length - 1; i++) {
    const [lng1, lat1] = closed[i]!;
    const [lng2, lat2] = closed[i + 1]!;
    total +=
      (rad(lng2) - rad(lng1)) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }

  return Math.abs((total * R * R) / 2);
}
