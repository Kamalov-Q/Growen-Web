"use client";

import { useEffect, useRef } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SATELLITE_STYLE, STREET_STYLE, TASHKENT } from "@/src/lib/mapStyles";
import { ensureMapWorker } from "@/src/lib/maplibre";

/**
 * One listing's location: the drawn boundary when it has one, otherwise a pin.
 *
 * The boundary is the app's whole pitch — a plot drawn by the seller rather
 * than a dot dropped near it — so the detail page is exactly where it has to
 * show up. Read-only: the admin's ListingMap is the editable version of this.
 *
 * Shown for SOLD listings too. Somebody who follows an old link, or an owner
 * looking at their own sold advert, still wants to see where it was, and
 * `markSold` never touches the geometry.
 */
export function LocationMap({
  centroid,
  ring,
  satellite = false,
}: {
  centroid: [number, number] | null;
  /** The polygon's outer ring, if the seller drew one. */
  ring: [number, number][] | null;
  satellite?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!holder.current) return;

    const center = centroid ?? ring?.[0] ?? TASHKENT;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: holder.current,
      style: satellite ? SATELLITE_STYLE : STREET_STYLE,
      center,
      zoom: ring ? 15 : 14,
      attributionControl: false,
      // Nothing on this map is interactive beyond looking at it, and a map
      // that swallows page scroll on a phone is a map people fight with.
      scrollZoom: false,
    });
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (ring && ring.length >= 3) {
        // Closed explicitly: GeoJSON requires the first and last position of
        // a linear ring to be identical, and the API stores it open.
        const closed = [...ring, ring[0]!];
        map.addSource("parcel", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [closed] },
          },
        });
        map.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: { "fill-color": "#0f766e", "fill-opacity": 0.3 },
        });
        map.addLayer({
          id: "parcel-line",
          type: "line",
          source: "parcel",
          paint: { "line-color": "#0f766e", "line-width": 2 },
        });

        // Frame the plot rather than trusting a zoom guess: a field and a
        // flat need very different cameras.
        let [west, south] = ring[0]!;
        let [east, north] = ring[0]!;
        for (const [lng, lat] of ring) {
          west = Math.min(west, lng);
          east = Math.max(east, lng);
          south = Math.min(south, lat);
          north = Math.max(north, lat);
        }
        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          { padding: 40, duration: 0 },
        );
      } else if (centroid) {
        new Marker({ color: "#0f766e" }).setLngLat(centroid).addTo(map);
      }
    });

    return () => map.remove();
  }, [centroid, ring, satellite]);

  return (
    <div
      ref={holder}
      className="h-80 w-full overflow-hidden rounded-card shadow-card ring-1 ring-line"
    />
  );
}
