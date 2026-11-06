"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TASHKENT } from "@/src/lib/mapStyles";
import {
  readMapLayer,
  styleFor,
  writeMapLayer,
  type MapLayer,
} from "@/src/lib/map-layer";
import { ensureMapWorker } from "@/src/lib/maplibre";

/** See the `moveend` handler — a flick settles several times. */
const VIEWPORT_DEBOUNCE_MS = 300;
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { fetchViewport, type FeedQuery } from "./api";
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
  query,
  onOpen,
  fill = false,
  overlay,
}: {
  lang: Lang;
  /** The whole feed query — the map honours every filter the chips set. */
  query: FeedQuery;
  onOpen: (listingId: string) => void;
  /**
   * Fill the window instead of sitting in the page as a card.
   *
   * The browse page passes this: there, the map IS the page, so it runs
   * edge to edge from under the header to the bottom of the window and the
   * controls float on top of it. Everywhere else — the add-listing shape
   * picker — the map is one element among others and keeps its corners.
   */
  fill?: boolean;
  /**
   * What floats above the map's own controls: the view switcher, the
   * purpose tabs and the category chips. Passed in rather than imported,
   * because those belong to the browse page and this component is also the
   * map in the listing form.
   */
  overlay?: React.ReactNode;
}) {
  // See the viewport effect's dependency list.
  const queryKey = JSON.stringify([
    query.purpose,
    query.category ?? null,
    query.priceMin ?? null,
    query.priceMax ?? null,
    query.q?.trim() || null,
  ]);

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
  const [layer, setLayer] = useState<MapLayer>(() => readMapLayer());
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
   * A cluster the camera cannot split, fanned out into its members.
   *
   * Several listings at one address stay one badge however far you zoom —
   * `fitBounds` on a zero-area box does nothing at all, so the badge reads
   * as broken. Clicking one of those spreads its members around the spot
   * instead, which is the only way to reach them. Holds the cluster key.
   */
  const [expanded, setExpanded] = useState<string | null>(null);
  /**
   * The last features drawn, so fanning a cluster out can redraw without
   * going back to the server for data that has not changed.
   */
  const lastFeatures = useRef<(MapPointFeature | MapPolygonFeature)[]>([]);

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
        // Stated here rather than left to a utility class: this element is
        // the hit target, and an inherited `pointer-events: none` from any
        // future overlay would make every pin on the map dead.
        wrap.style.pointerEvents = "auto";

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

        /**
         * A press on a pin must not start a map drag.
         *
         * MapLibre's pan handler listens on the canvas container, which is
         * this marker's PARENT, so a `mousedown` that is not stopped here
         * bubbles up and begins a drag. Move the pointer a pixel or two
         * before releasing — a trackpad does this on its own — and the
         * release lands somewhere other than where the press started, so
         * the browser fires no `click` at all and the pin appears dead.
         * Both event families, because MapLibre uses whichever the browser
         * sends.
         */
        for (const kind of ["pointerdown", "mousedown", "touchstart"]) {
          el.addEventListener(kind, (e) => e.stopPropagation());
        }

        wrap.appendChild(el);
        return { wrap, el };
      };

      const centre = bounds.getCenter();
      const width = instance.getContainer().clientWidth;

      for (const c of clusterPoints(points, lngSpan, width, centre.lat)) {
        /**
         * A fanned-out cluster: its members, on a ring around the spot.
         *
         * The offset is in PIXELS and the coordinate stays the real one, so
         * the ring holds its shape at any zoom and each pin still points at
         * where its listing actually is.
         */
        if (c.key === expanded && c.members.length > 1) {
          const radius = 42 + c.members.length * 5;
          c.members.forEach((f, i) => {
            const angle = (2 * Math.PI * i) / c.members.length - Math.PI / 2;
            const { wrap, el } = marker(money(f.price, f.currency), false);
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              setSelected(f);
            });
            markers.current.push(
              new Marker({
                element: wrap,
                offset: [
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius,
                ],
              })
                .setLngLat(f.centroid.coordinates)
                .addTo(instance),
            );
          });
          continue;
        }

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

          const box: [[number, number], [number, number]] = [
            [c.bbox[0], c.bbox[1]],
            [c.bbox[2], c.bbox[3]],
          ];

          /**
           * Would moving the camera actually separate them?
           *
           * `cameraForBounds` answers that without moving anything. A
           * cluster of listings at one address has a zero-area box and
           * comes back at the current zoom or lower — zooming would then
           * leave the person somewhere new with the same badge still
           * saying "3", which is the version of this that looked broken.
           * Those get fanned out instead.
           */
          const camera = instance.cameraForBounds(box, { padding: 64 });
          const worthZooming =
            camera?.zoom !== undefined &&
            camera.zoom > instance.getZoom() + 0.3;

          if (!worthZooming) {
            setExpanded(c.key);
            return;
          }

          setExpanded(null);
          instance.fitBounds(box, { padding: 64, maxZoom: 17, duration: 500 });
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
    [onOpen, lang, expanded],
  );

  // One map instance for the lifetime of the component.
  useEffect(() => {
    if (!holder.current || map.current) return;

    ensureMapWorker();
    const instance = new MapLibreMap({
      container: holder.current,
      style: styleFor(readMapLayer()),
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
        query,
        abort.signal,
      )
        .then((res) => {
          lastFeatures.current = res.features;
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

    /**
     * `moveend`, then DEBOUNCED on top of it.
     *
     * `moveend` instead of `move` was always right — the viewport endpoint
     * is a spatial query and firing it per animation frame is how a map
     * takes a database down. It is not enough on its own, though: a kinetic
     * flick settles several times, and every `fitBounds` and `easeTo` fires
     * it again, so one pan across the city produced thirty-odd queries. The
     * only one whose answer anybody sees is the last.
     *
     * 300ms is below the threshold where a pause feels like lag and well
     * above the gap between settles in a flick.
     */
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(load, VIEWPORT_DEBOUNCE_MS);
    };

    instance.on("moveend", schedule);
    // The FIRST load is immediate. Debouncing the opening query would leave
    // the map empty for 300ms on a page whose whole point is the pins.
    if (instance.loaded()) load();
    else instance.once("load", load);

    return () => {
      if (timer) clearTimeout(timer);
      abort?.abort();
      instance.off("moveend", schedule);
    };
    // `queryKey`, not `query`: the object is rebuilt on every parent render,
    // so depending on it directly would tear down and re-add the `moveend`
    // listener (and fire a fetch) on renders where no filter actually
    // changed. The serialised value only changes when a filter does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, draw]);

  /**
   * Redraw when a cluster is fanned out or folded back.
   *
   * `draw` closes over `expanded`, so a new one arrives on every change —
   * and the features are the ones already in hand, since nothing about the
   * viewport moved. Without this the ring would not appear until the next
   * pan.
   */
  useEffect(() => {
    if (lastFeatures.current.length) draw(lastFeatures.current);
  }, [draw]);

  /** Moving the camera folds any fanned-out cluster back up. */
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const collapse = () => setExpanded(null);
    instance.on("movestart", collapse);
    return () => {
      instance.off("movestart", collapse);
    };
  }, []);

  const toggle = () => {
    const next: MapLayer = layer === "street" ? "satellite" : "street";
    setLayer(next);
    writeMapLayer(next);
    // Changing the style wipes every source and layer the controls added,
    // so they are told to put them back once the new style is in.
    setReady(false);
    map.current?.setStyle(styleFor(next));
  };

  return (
    /* Taller on a phone than `70vh` allowed, and taller still on a desktop.
       A map is the one view where the screen IS the content: at 459px the
       old height left a letterbox under a stack of controls, and on a
       1440px monitor it wasted the bottom third of the window.

       `min-h` rather than a plain height so the controls across the top
       always have somewhere to sit. */
    <div
      className={
        fill
          ? /* Header to the foot of the window, nothing below it. The two
               values are the header's two heights: one row from `sm` up,
               two rows on a phone where the search box has the width to
               itself (see Chrome.tsx). */
            "relative h-[calc(100dvh-7rem)] min-h-[26rem] w-full overflow-hidden sm:h-[calc(100dvh-4rem)]"
          : "relative h-[calc(100dvh-13rem)] min-h-[26rem] w-full overflow-hidden rounded-card shadow-card ring-1 ring-line sm:h-[calc(100dvh-15rem)] lg:h-[calc(100dvh-13rem)]"
      }
    >
      <div ref={holder} className="size-full" />

      {/* Everything that floats at the top, in ONE pane of glass: the
          page's rows and the map's own search row, which used to be pinned
          to this corner independently and landed on top of each other.

          The column lets clicks through to the map; the panel takes them
          back for itself. Without `fill` there is no panel — the map is
          then one element in a form, and a sheet of glass over it would be
          a frame around nothing. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
        <div
          className={
            fill
              ? "pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-3 rounded-card bg-surface/80 p-3 shadow-lift ring-1 ring-line backdrop-blur-xl supports-[backdrop-filter]:bg-surface/60"
              : ""
          }
        >
          {overlay}
          <MapControls lang={lang} map={instanceForControls} ready={ready} />
        </div>
      </div>

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
          {/* Through the dictionary like everything else: these were two
              inline ternaries over `lang`, which is how one of the two
              copies of this label ended up spelled "Sun'il". */}
          {t(lang, layer === "street" ? "map.satellite" : "map.street")}
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
