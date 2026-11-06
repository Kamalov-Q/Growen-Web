"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ensureMapWorker } from "@/src/lib/maplibre";
import { STREET_STYLE, TASHKENT } from "@/src/lib/mapStyles";
import type { Lang } from "@/src/i18n/config";
import { tCreate } from "@/src/i18n/strings/create";
import { closeRing, ringAreaM2, type Ring } from "./geo-ring";
import { MapControls } from "./MapControls";

export type LocMode = "PIN" | "POLYGON";

const SRC = "draw-shape";
const BRAND = "#2FB8A8";

/**
 * Pick the listing's location: a pin, or a drawn boundary.
 *
 * ── Yes, polygons work on the web ─────────────────────────────────────────
 *
 * Hand-rolled on MapLibre rather than pulling in a draw library. The whole
 * interaction is "click to add a vertex, drag a vertex to move it, click a
 * vertex to remove it", which is about a hundred lines against the GeoJSON
 * source we already use — and a drawing library brings a dependency, its
 * own styling conventions and its own ideas about keyboard handling, for
 * features (multi-polygon, holes, snapping) this form will never offer.
 *
 * ── The ring is NOT stored closed ─────────────────────────────────────────
 *
 * GeoJSON wants the first position repeated at the end. The editor does not
 * keep that duplicate, because a vertex handle sitting exactly on another
 * one is something a person will try to drag and be confused by. It is
 * added in `closeRing` at the moment the shape becomes data.
 *
 * ── Area is computed properly ─────────────────────────────────────────────
 *
 * Spherical, not a planar shoelace on raw degrees — at Tashkent's latitude
 * that mistake overstates the area by about a third, and this figure
 * pre-fills a field the owner may accept as the listing's size.
 */
export function ShapePicker({
  lang,
  mode,
  point,
  ring,
  onPoint,
  onRing,
}: {
  lang: Lang;
  mode: LocMode;
  point: [number, number] | null;
  ring: Ring;
  onPoint: (p: [number, number]) => void;
  onRing: (r: Ring) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const pinMarker = useRef<Marker | null>(null);
  const vertexMarkers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  /**
   * The instance as STATE, for the controls below.
   *
   * Passing `map.current` during render would hand them `null` for ever:
   * the map is created in an effect, which mutates the ref without
   * scheduling a render, so the child never hears it arrived.
   */
  const [instance, setInstance] = useState<MapLibreMap | null>(null);

  // The live props the map's own listeners read. Written in an effect, never
  // during render — mutating a ref while rendering is unsafe under
  // concurrent rendering and the lint rule rejects it.
  const live = useRef({ mode, ring, onPoint, onRing });
  useEffect(() => {
    live.current = { mode, ring, onPoint, onRing };
  }, [mode, ring, onPoint, onRing]);

  useEffect(() => {
    if (!holder.current || map.current) return;
    ensureMapWorker();

    const instance = new MapLibreMap({
      container: holder.current,
      style: STREET_STYLE,
      center: point ?? TASHKENT,
      zoom: point ? 15 : 12,
      attributionControl: { compact: true },
    });
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.current = instance;
    setInstance(instance);

    instance.on("load", () => {
      instance.addSource(SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      instance.addLayer({
        id: `${SRC}-fill`,
        type: "fill",
        source: SRC,
        paint: { "fill-color": BRAND, "fill-opacity": 0.2 },
      });
      instance.addLayer({
        id: `${SRC}-line`,
        type: "line",
        source: SRC,
        paint: { "line-color": BRAND, "line-width": 2.5 },
      });
      setReady(true);
    });

    instance.on("click", (e) => {
      const { mode: m, ring: r, onPoint: op, onRing: or } = live.current;
      const next: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (m === "PIN") op(next);
      else or([...r, next]);
    });

    return () => {
      instance.remove();
      map.current = null;
      pinMarker.current = null;
      vertexMarkers.current = [];
    };
    // Mount only. `point`/`ring` seed the camera and are then driven by the
    // effects below; re-running this would tear the map down on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The pin.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    if (mode !== "PIN" || !point) {
      pinMarker.current?.remove();
      pinMarker.current = null;
      return;
    }

    if (!pinMarker.current) {
      pinMarker.current = new Marker({ color: BRAND, draggable: true })
        .setLngLat(point)
        .addTo(instance);
      pinMarker.current.on("dragend", () => {
        const p = pinMarker.current!.getLngLat();
        live.current.onPoint([p.lng, p.lat]);
      });
    } else {
      pinMarker.current.setLngLat(point);
    }
  }, [mode, point]);

  // The boundary: its fill, its outline, and a draggable handle per vertex.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    for (const m of vertexMarkers.current) m.remove();
    vertexMarkers.current = [];

    const src = instance.getSource(SRC) as GeoJSONSource | undefined;
    const drawing = mode === "POLYGON" && ring.length >= 3;

    src?.setData({
      type: "FeatureCollection",
      features: drawing
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [closeRing(ring)] },
            },
          ]
        : [],
    });

    if (mode !== "POLYGON") return;

    ring.forEach((pos, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "size-3.5 cursor-pointer rounded-full border-2 border-white shadow-md";
      el.style.background = BRAND;
      el.setAttribute("aria-label", `${i + 1}`);
      // Click removes this vertex: the only way back from a misplaced
      // corner that does not throw the whole shape away.
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const r = live.current.ring;
        live.current.onRing(r.filter((_, n) => n !== i));
      });

      const m = new Marker({ element: el, draggable: true })
        .setLngLat(pos)
        .addTo(instance);
      m.on("dragend", () => {
        const p = m.getLngLat();
        const r = live.current.ring;
        live.current.onRing(
          r.map((old, n) => (n === i ? [p.lng, p.lat] : old)),
        );
      });
      vertexMarkers.current.push(m);
    });
  }, [mode, ring, ready]);

  const area = mode === "POLYGON" && ring.length >= 3 ? ringAreaM2(ring) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-96 w-full overflow-hidden rounded-card ring-1 ring-line">
        <div ref={holder} className="size-full" />

        {/* The same search / locate / fullscreen controls the browse map
            has. Finding the address is most of the work of placing a pin,
            and typing a district is faster than panning to it.

            The row places itself in flow now — the browse map stacks it
            under its own floating panel — so the wrapper is what puts it
            over the top of this map. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
          <MapControls lang={lang} map={instance} ready={ready} />
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
          <p className="rounded-control bg-surface/95 px-3 py-2 text-center text-[13px] text-muted shadow-card ring-1 ring-line backdrop-blur-sm">
            {mode === "PIN"
              ? point
                ? tCreate(lang, "create.pinSet")
                : tCreate(lang, "create.pickPoint")
              : ring.length < 3
                ? tCreate(lang, "create.drawHint")
                : tCreate(lang, "create.drawDone", { n: ring.length })}
          </p>
        </div>

        {mode === "POLYGON" && ring.length ? (
          <div className="absolute end-3 top-16 flex gap-2">
            <button
              type="button"
              onClick={() => onRing(ring.slice(0, -1))}
              className="h-9 rounded-control bg-surface/95 px-3 text-[13px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur-sm transition hover:bg-surface"
            >
              {tCreate(lang, "create.undo")}
            </button>
            <button
              type="button"
              onClick={() => onRing([])}
              className="h-9 rounded-control bg-surface/95 px-3 text-[13px] font-semibold text-danger shadow-card ring-1 ring-line backdrop-blur-sm transition hover:bg-surface"
            >
              {tCreate(lang, "create.clear")}
            </button>
          </div>
        ) : null}

        {!ready ? (
          <div className="absolute inset-0 animate-pulse bg-muted-bg" />
        ) : null}
      </div>

      {area > 0 ? (
        <p className="nums text-[13px] text-muted">
          {tCreate(lang, "create.measured", {
            n: Math.round(area).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ"),
          })}
        </p>
      ) : null}
    </div>
  );
}
