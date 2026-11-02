"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SATELLITE_STYLE, STREET_STYLE, TASHKENT } from "@/src/lib/mapStyles";
import { ensureMapWorker } from "@/src/lib/maplibre";
import type { Lang } from "@/src/i18n/config";
import { fetchViewport, type OfferPurpose } from "./api";
import type { MapPointFeature, MapPolygonFeature } from "@/src/lib/listing-types";
import { MapControls } from "./MapControls";
import { MapPreview } from "./MapPreview";
import { clusterPoints } from "./cluster";

/**
 * The browse map.
 *
 * Same tiles as the admin dashboard and the phone — OpenFreeMap streets,
 * Esri imagery — so a listing looks the same wherever somebody sees it. The
 * admin's ListingMap is a single-listing EDITOR (drop a pin, drag a
 * boundary); this is the opposite job: many listings, read-only, refetched
 * as the camera moves.
 *
 * Loaded through next/dynamic with ssr:false by its parent. MapLibre touches
 * `window` at import time and is the largest dependency on the site, so it
 * must neither run during the server render nor sit in the bundle of a page
 * that only ever shows a list.
 */

const PRIMARY = "#0f766e";
const LAYER_KEY = "growencity.map.layer";

type Layer = "street" | "satellite";

function readLayer(): Layer {
  try {
    return localStorage.getItem(LAYER_KEY) === "satellite"
      ? "satellite"
      : "street";
  } catch {
    // Private mode and blocked storage both throw rather than return null.
    return "street";
  }
}

const money = (price: string, currency: string) => {
  const n = Math.round(Number(price));
  if (!Number.isFinite(n)) return "";
  const unit = currency === "UZS" ? "so'm" : "$";
  // Compact, because this is a label on a pin and the map is mostly pins.
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M ${unit}`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K ${unit}`;
  return `${n} ${unit}`;
};

export function BrowseMap({
  lang,
  purpose,
  onOpen,
}: {
  lang: Lang;
  purpose: OfferPurpose;
  onOpen: (listingId: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  /**
   * Lazy initialiser, not an effect.
   *
   * `useState("street")` followed by `useEffect(() => setLayer(readLayer()))`
   * renders once with the wrong layer and then again with the right one —
   * a cascading render, and a visible flash from street tiles to satellite
   * for anybody who chose satellite. Safe to read storage during the
   * initialiser because this component is loaded with `ssr: false` and so
   * only ever runs in a browser, where `localStorage` exists.
   */
  const [layer, setLayer] = useState<Layer>(() => readLayer());
  /**
   * The style has finished loading.
   *
   * `MapControls` adds its own source and layers for the search outline, and
   * `addSource` throws if the style is not in yet. A boolean in state rather
   * than a ref because it has to cause a render — the controls only run
   * their effect once it flips.
   */
  const [ready, setReady] = useState(false);
  /**
   * The map instance, in STATE as well as in the ref.
   *
   * The ref is what the effects reach for; this is what gets passed to a
   * child. Handing `map.current` to `<MapControls>` during render looks
   * equivalent and is not: creating the map inside an effect mutates the
   * ref without scheduling a render, so the child would be given `null` and
   * never hear that the map arrived. The lint rule that rejects reading a
   * ref during render is pointing at exactly that bug.
   */
  const [instanceForControls, setInstanceForControls] =
    useState<MapLibreMap | null>(null);
  const [count, setCount] = useState<number | null>(null);
  /** The pin whose preview card is open, if any. */
  const [selected, setSelected] = useState<MapPointFeature | null>(null);

  /**
   * Draw the pins for the current viewport.
   *
   * Points are CLUSTERED first — see `cluster.ts`, ported from the app — so
   * a city-wide view shows a handful of numbered bubbles instead of two
   * hundred overlapping price pills. A cluster click fits the camera to its
   * bounds, which is the only gesture that can ever separate them; a single
   * pin opens the preview card.
   *
   * Polygons keep their own pill: a drawn outline is one listing by
   * definition, so there is nothing to group.
   */
  const draw = useCallback(
    (features: (MapPointFeature | MapPolygonFeature)[]) => {
      const instance = map.current;
      if (!instance) return;

      // Markers are DOM nodes MapLibre does not own, so they have to be
      // removed by hand. Leaving them is the classic map memory leak: pan a
      // few times and the page is carrying several thousand detached nodes.
      for (const m of markers.current) m.remove();
      markers.current = [];

      const points: MapPointFeature[] = [];
      const polygons: MapPolygonFeature[] = [];
      for (const f of features) {
        if ("listingId" in f) points.push(f);
        else polygons.push(f);
      }

      const bounds = instance.getBounds();
      const lngSpan = Math.abs(bounds.getEast() - bounds.getWest());

      /**
       * A marker: a plain wrapper that MapLibre owns, with the visible
       * button inside it.
       *
       * ── Why two elements ──────────────────────────────────────────────
       *
       * MapLibre positions a marker by writing `transform: translate(…)` to
       * the element it is given, and it rewrites it on every reposition.
       * Anything else that touches `transform` on that same element fights
       * it — and Tailwind's bare `transition` utility animates `transform`,
       * `translate`, `scale` and `rotate` among others. The marker then
       * ANIMATES toward each new position instead of being there, so it
       * drifts out from under the pointer and the click lands on the map.
       * That is the "badge escapes on hover" bug exactly.
       *
       * So the wrapper is left completely untouched — no classes, no
       * transition — and every visual effect lives on the button inside it,
       * which MapLibre never writes to.
       */
      const marker = (label: string, cluster: boolean) => {
        const wrap = document.createElement("div");

        const el = document.createElement("button");
        el.type = "button";
        el.textContent = label;
        el.setAttribute("aria-label", label);
        el.className = [
          "cursor-pointer rounded-full border border-white/70 font-semibold",
          "shadow-md",
          // Scoped to the properties actually animated. Never `transform`,
          // and never the bare `transition` utility that includes it.
          "transition-[scale,background-color,box-shadow] duration-150",
          "hover:scale-110 active:scale-95",
          cluster
            ? "grid place-items-center text-[13px] tabular-nums"
            : "px-2.5 py-1 text-xs",
        ].join(" ");
        el.style.background = PRIMARY;
        el.style.color = "#ffffff";
        if (cluster) {
          // A circle that grows with the number so "7" and "2 480" both fit
          // without the bubble becoming a lozenge.
          const size = label.length <= 2 ? 36 : label.length === 3 ? 42 : 50;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
        }

        // A hovered marker is lifted above its neighbours. Without this a
        // pill that grows under an adjacent one becomes unclickable along
        // the overlap — the same symptom from a different cause.
        el.addEventListener("pointerenter", () => {
          wrap.style.zIndex = "1";
        });
        el.addEventListener("pointerleave", () => {
          wrap.style.zIndex = "";
        });

        wrap.appendChild(el);
        return { wrap, el };
      };

      for (const c of clusterPoints(points, lngSpan)) {
        if (c.single) {
          const f = c.single;
          const { wrap, el } = marker(money(f.price, f.currency), false);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelected(f);
          });
          markers.current.push(
            new Marker({ element: wrap })
              .setLngLat(f.centroid.coordinates)
              .addTo(instance),
          );
          continue;
        }

        const { wrap, el } = marker(
          c.count.toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ"),
          true,
        );
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          instance.fitBounds(
            [
              [c.bbox[0], c.bbox[1]],
              [c.bbox[2], c.bbox[3]],
            ],
            // A cluster whose members share one coordinate has a zero-area
            // box; `maxZoom` stops the camera diving to street level and
            // leaving the person with no idea where they are.
            { padding: 64, maxZoom: 17, duration: 500 },
          );
        });
        markers.current.push(
          new Marker({ element: wrap })
            .setLngLat([c.lng, c.lat])
            .addTo(instance),
        );
      }

      for (const f of polygons) {
        const centroid = f.centroid;
        if (!centroid) continue;
        const { wrap, el } = marker(money(f.price, f.currency), false);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onOpen(f.id);
        });
        markers.current.push(
          new Marker({ element: wrap })
            .setLngLat(centroid.coordinates)
            .addTo(instance),
        );
      }
    },
    [onOpen, lang],
  );

  // One map instance for the lifetime of the component.
  useEffect(() => {
    if (!holder.current || map.current) return;

    ensureMapWorker();
    const instance = new MapLibreMap({
      container: holder.current,
      style: readLayer() === "satellite" ? SATELLITE_STYLE : STREET_STYLE,
      center: TASHKENT,
      zoom: 11,
      // The licences require the credits to stay reachable; compact keeps
      // them out of the way without hiding them.
      attributionControl: false,
    });
    instance.addControl(new AttributionControl({ compact: true }), "bottom-right");
    setInstanceForControls(instance);
    const onStyle = () => setReady(true);
    instance.on("style.load", onStyle);
    if (instance.isStyleLoaded()) setReady(true);
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.current = instance;
    return () => {
      for (const m of markers.current) m.remove();
      markers.current = [];
      instance.remove();
      map.current = null;
    };
  }, []);

  // Refetch as the camera settles.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    let abort: AbortController | null = null;

    const load = () => {
      const b = instance.getBounds();
      // Abort the previous request rather than letting it land after this
      // one: a slow response from two pans ago would otherwise repaint the
      // map with the wrong part of the city.
      abort?.abort();
      abort = new AbortController();

      void fetchViewport(
        {
          west: b.getWest(),
          south: b.getSouth(),
          east: b.getEast(),
          north: b.getNorth(),
        },
        instance.getZoom(),
        purpose,
        abort.signal,
      )
        .then((res) => {
          draw(res.features);
          // Set here, in the async callback, rather than inside draw():
          // draw() is also reachable synchronously from this effect, and
          // state set synchronously from an effect body drives a cascading
          // render. Painting the map and telling React how many pins there
          // are are two different jobs anyway.
          setCount(res.features.length);
        })
        .catch(() => {
          // An aborted fetch is the normal case while panning, not an error
          // worth showing anybody.
        });
    };

    // `moveend`, not `move`: the viewport endpoint is a spatial query and
    // firing it on every animation frame is how a map takes a database down.
    instance.on("moveend", load);
    if (instance.loaded()) load();
    else instance.once("load", load);

    return () => {
      abort?.abort();
      instance.off("moveend", load);
    };
  }, [purpose, draw]);

  const toggle = () => {
    const next: Layer = layer === "street" ? "satellite" : "street";
    setLayer(next);
    try {
      localStorage.setItem(LAYER_KEY, next);
    } catch {
      // Remembering the preference is a convenience, not a requirement.
    }
    // Changing the style wipes every source and layer the controls added,
    // so they are told to put them back once the new style is in.
    setReady(false);
    map.current?.setStyle(next === "satellite" ? SATELLITE_STYLE : STREET_STYLE);
  };

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-card shadow-card ring-1 ring-line">
      <div ref={holder} className="size-full" />

      <MapControls lang={lang} map={instanceForControls} ready={ready} />

      {selected ? (
        <MapPreview
          key={selected.listingId}
          lang={lang}
          feature={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-control bg-surface/95 px-3 text-[13px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur-sm transition hover:bg-surface"
        >
          {layer === "street" ? "🛰" : "🗺"}{" "}
          {layer === "street"
            ? lang === "ru"
              ? "Спутник"
              : "Sun'iy yo'ldosh"
            : lang === "ru"
              ? "Схема"
              : "Xarita"}
        </button>

        {count !== null ? (
          <span className="pointer-events-auto nums rounded-control bg-surface/95 px-3 py-1.5 text-[13px] font-semibold text-muted shadow-card ring-1 ring-line backdrop-blur-sm">
            {count}
          </span>
        ) : null}
      </div>
    </div>
  );
}
