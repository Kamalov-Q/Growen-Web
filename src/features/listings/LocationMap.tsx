"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { SATELLITE_STYLE, STREET_STYLE, TASHKENT } from "@/src/lib/mapStyles";
import { ensureMapWorker } from "@/src/lib/maplibre";

/**
 * One listing's location: the drawn boundary when it has one, otherwise a pin.
 *
 * The boundary is the app's whole pitch — a plot drawn by the seller rather
 * than a dot dropped near it — so the detail page is exactly where it has to
 * show up. Read-only: the admin's ListingMap is the editable version.
 *
 * Shown for SOLD listings too. Somebody following an old link, or an owner
 * looking at their own sold advert, still wants to see where it was, and
 * `markSold` never touches the geometry.
 */

const PARCEL_COLOR = "#0f766e";

/**
 * The camera, derived once so the reset button and the first load agree.
 *
 * A discriminated union rather than two optional fields: a plot is FRAMED by
 * its own extent, because a field and a flat need very different cameras,
 * while a pin only has a centre and a guess at a zoom. `kind` is what lets
 * the compiler tell the caller which one it got.
 */
type Framing =
  | { kind: "bounds"; bounds: [[number, number], [number, number]] }
  | { kind: "point"; center: [number, number]; zoom: number };

function framing(
  centroid: [number, number] | null,
  ring: [number, number][] | null,
): Framing {
  if (ring && ring.length >= 3) {
    let [west, south] = ring[0]!;
    let [east, north] = ring[0]!;
    for (const [lng, lat] of ring) {
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    }
    return { kind: "bounds", bounds: [[west, south], [east, north]] };
  }
  return { kind: "point", center: centroid ?? TASHKENT, zoom: 15 };
}

export function LocationMap({
  centroid,
  ring,
  lang,
  satellite = false,
}: {
  centroid: [number, number] | null;
  /** The polygon's outer ring, if the seller drew one. */
  ring: [number, number][] | null;
  lang: Lang;
  satellite?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Internal, seeded by the prop. Street is the right default — a plot means
  // nothing without the roads around it — but a field or a half-built house
  // only reads from above, which is why the app offers both.
  const [aerial, setAerial] = useState(satellite);

  useEffect(() => {
    if (!holder.current) return;

    const view = framing(centroid, ring);
    ensureMapWorker();

    const map = new MapLibreMap({
      container: holder.current,
      style: aerial ? SATELLITE_STYLE : STREET_STYLE,
      center: view.kind === "point" ? view.center : (centroid ?? TASHKENT),
      zoom: view.kind === "point" ? view.zoom : 15,
      attributionControl: false,
      /**
       * Scroll zoom behind ctrl/⌘ rather than switched off.
       *
       * It used to be `scrollZoom: false`, so the wheel did nothing at all
       * and the only way to see the neighbourhood was the +/− buttons.
       * `cooperativeGestures` is the better answer to the same problem: the
       * page keeps scrolling on a plain wheel or a one-finger drag, and the
       * map zooms on ctrl+wheel or two fingers, with MapLibre drawing the
       * overlay that says so.
       */
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new FullscreenControl(), "top-right");
    // Where the viewer is, relative to the property — the question anybody
    // looking at a flat in a city they know asks first.
    map.addControl(
      new GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      "top-right",
    );
    // Metric only: a land listing is priced by the sotix, and a scale bar in
    // miles would be answering a question nobody here is asking.
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

    /**
     * Draw the parcel. Separate from map creation because switching the
     * basemap WIPES every source and layer — `setStyle` replaces the whole
     * style document — so this has to run again each time the style loads,
     * not once at startup.
     */
    const draw = () => {
      if (ring && ring.length >= 3) {
        if (!map.getSource("parcel")) {
          // Closed explicitly: GeoJSON requires a linear ring's first and
          // last position to be identical, and the API stores it open.
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
            paint: { "fill-color": PARCEL_COLOR, "fill-opacity": 0.3 },
          });
          map.addLayer({
            id: "parcel-line",
            type: "line",
            source: "parcel",
            paint: { "line-color": PARCEL_COLOR, "line-width": 2 },
          });
        }
      }
    };

    const fit = () => {
      const v = framing(centroid, ring);
      if (v.kind === "bounds") {
        map.fitBounds(v.bounds, { padding: 40, duration: 0 });
      }
    };

    map.on("load", () => {
      draw();
      fit();
      // A marker is a DOM element, not a style layer, so it survives
      // `setStyle` and must only ever be added once.
      if (!(ring && ring.length >= 3) && centroid) {
        new Marker({ color: PARCEL_COLOR }).setLngLat(centroid).addTo(map);
      }
    });

    // Fired after every `setStyle` once the new style is in place.
    map.on("styledata", draw);

    return () => {
      mapRef.current = null;
      map.remove();
    };
    // `aerial` is deliberately absent: switching the basemap must not tear
    // down and rebuild the map, which would lose the camera and flash the
    // container. The effect below does it in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centroid, ring]);

  // The basemap switch, in place.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(aerial ? SATELLITE_STYLE : STREET_STYLE);
  }, [aerial]);

  const reset = () => {
    const map = mapRef.current;
    if (!map) return;
    const v = framing(centroid, ring);
    if (v.kind === "bounds") {
      map.fitBounds(v.bounds, { padding: 40, duration: 400 });
    } else {
      map.easeTo({ center: v.center, zoom: v.zoom, duration: 400 });
    }
  };

  // Where to send someone who wants directions. Both, because which one is
  // installed is a coin toss here and neither is worth guessing wrong.
  const point = centroid ?? ring?.[0] ?? null;
  const external = point
    ? [
        {
          href: `https://yandex.uz/maps/?pt=${point[0]},${point[1]}&z=17&l=map`,
          label: "Yandex",
        },
        {
          href: `https://www.google.com/maps/search/?api=1&query=${point[1]},${point[0]}`,
          label: "Google",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          ref={holder}
          className="h-72 w-full overflow-hidden rounded-card shadow-card ring-1 ring-line sm:h-80 lg:h-96"
        />

        {/* Left-hand stack, so it never collides with MapLibre's own
            controls on the right. */}
        <div className="absolute start-2 top-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setAerial((v) => !v)}
            aria-pressed={aerial}
            className="rounded-control bg-surface/90 px-3 py-2 text-[13px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur transition hover:bg-surface"
          >
            {t(lang, aerial ? "map.street" : "map.satellite")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-control bg-surface/90 px-3 py-2 text-[13px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur transition hover:bg-surface"
          >
            {t(lang, "map.recenter")}
          </button>
        </div>
      </div>

      {external.length ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span>{t(lang, "map.openIn")}</span>
          {external.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              // `noopener` is not optional on a target=_blank link: without
              // it the opened page gets a handle on this one via
              // window.opener and can navigate it somewhere else.
              rel="noopener noreferrer"
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </p>
      ) : null}
    </div>
  );
}
