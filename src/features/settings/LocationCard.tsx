"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { GEOSEARCH_CREDIT, reverseGeocode } from "@/src/lib/geosearch";
import { ensureMapWorker } from "@/src/lib/maplibre";
import {
  readMapLayer,
  styleFor,
  writeMapLayer,
  type MapLayer,
} from "@/src/lib/map-layer";

/**
 * "Where am I" — the settings card, as the app has it
 * (mobile/src/features/map/MiniLocationMap).
 *
 * ── Nothing runs on mount ─────────────────────────────────────────────────
 *
 * Opening settings is not consent to a location prompt. A permission sheet
 * nobody asked for is the fastest way to be denied permanently, and once
 * denied there is no way back from inside the page. So the card starts as a
 * row with a sentence and a button: it asks, and only then locates.
 *
 * ── The preview is a picture ──────────────────────────────────────────────
 *
 * Panning and zooming are off, and the whole frame is one button that opens
 * the interactive map below it. A small live map inside a settings list
 * steals the scroll on a phone — the gesture that should move the page
 * moves the map instead.
 *
 * ── The address is best effort ────────────────────────────────────────────
 *
 * Nominatim answers with a street and a district when it can, and when it
 * cannot the card prints the coordinates. Either way the credit goes with
 * it, which ODbL requires wherever the answer is shown.
 */

interface Coords {
  latitude: number;
  longitude: number;
}

/** Close enough to recognise the street, wide enough to know the district. */
const PREVIEW_ZOOM = 15;

export function LocationCard({ lang }: { lang: Lang }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  /**
   * Streets or imagery — the SAME choice the browse map remembers, so
   * somebody who put that one on satellite finds this one there too.
   * Read in the initialiser rather than an effect: this component only ever
   * renders in a browser (`ssr: false`), so storage is there, and an effect
   * would paint the wrong layer first and swap it a frame later.
   */
  const [layer, setLayer] = useState<MapLayer>(() => readMapLayer());

  const toggleLayer = () => {
    const next: MapLayer = layer === "street" ? "satellite" : "street";
    setLayer(next);
    writeMapLayer(next);
  };

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t(lang, "map.noGeo"));
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(next);
        setBusy(false);
        // Behind the map rather than before it: the dot is the answer, the
        // street name is a label on it.
        void reverseGeocode(next.latitude, next.longitude).then(setAddress);
      },
      (err) => {
        setBusy(false);
        setError(
          t(
            lang,
            err.code === err.PERMISSION_DENIED
              ? "map.geoDenied"
              : "map.geoFailed",
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, [lang]);

  // ---- ask first: a row, not a dead grey slab ----------------------------
  if (!coords) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand ring-1 ring-brand-line">
            <Pin />
          </span>
          <p className="min-w-0 flex-1 text-[14px] leading-5 text-muted">
            {t(lang, "location.previewHint")}
          </p>
          <button
            type="button"
            onClick={locate}
            disabled={busy}
            className="shrink-0 rounded-control bg-brand px-3.5 py-2 text-[13px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? "…" : t(lang, "location.show")}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // ---- located: preview, address, and the full map on demand -------------
  return (
    <div className="flex flex-col gap-3">
      {/* The map, the thing that opens it, and the layer switch are
          SIBLINGS: a button inside a button is invalid HTML, and the
          browser's repair for it is to drop one — which is how a layer
          toggle ends up opening the full map instead of switching tiles. */}
      <div className="relative h-[170px] overflow-hidden rounded-card ring-1 ring-line">
        <StaticMap coords={coords} layer={layer} />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t(lang, "location.tapToOpen")}
          className="absolute inset-0 transition hover:bg-black/5"
        />

        <span className="pointer-events-none absolute end-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Expand />
          {t(lang, "location.tapToOpen")}
        </span>

        <LayerButton lang={lang} layer={layer} onToggle={toggleLayer} />
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-brand">
          <Navigate />
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] text-muted">
          {address ??
            `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}
        </p>
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          aria-label={t(lang, "location.myLocation")}
          className="shrink-0 rounded-full p-1.5 text-brand transition hover:bg-brand-soft disabled:opacity-50"
        >
          <Refresh spinning={busy} />
        </button>
      </div>

      {/* ODbL: the credit goes wherever the answer is shown. */}
      {address ? (
        <p className="text-[11px] text-faint">{GEOSEARCH_CREDIT}</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      {open ? (
        <FullMap
          lang={lang}
          coords={coords}
          busy={busy}
          layer={layer}
          onToggleLayer={toggleLayer}
          onRelocate={locate}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** The preview: one map, every interaction turned off. */
function StaticMap({ coords, layer }: { coords: Coords; layer: MapLayer }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);

  useEffect(() => {
    if (!holder.current || map.current) return;
    ensureMapWorker();
    const instance = new MapLibreMap({
      container: holder.current,
      style: styleFor(layer),
      center: [coords.longitude, coords.latitude],
      zoom: PREVIEW_ZOOM,
      interactive: false,
      attributionControl: false,
    });
    instance.addControl(
      new AttributionControl({ compact: true }),
      "bottom-right",
    );
    marker.current = new Marker({ element: dot() })
      .setLngLat([coords.longitude, coords.latitude])
      .addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // Built once; re-locating moves the camera below rather than rebuilding
    // a WebGL context, which is expensive and flashes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-locating moves the preview to the new spot.
  useEffect(() => {
    map.current?.jumpTo({
      center: [coords.longitude, coords.latitude],
      zoom: PREVIEW_ZOOM,
    });
    marker.current?.setLngLat([coords.longitude, coords.latitude]);
  }, [coords]);

  /* Swapping the style keeps the camera and the marker: a Marker is a DOM
     node the map positions, not something the style owns, so it survives —
     unlike a source or a layer, which is why the browse map has to put its
     search outline back after a swap. */
  useEffect(() => {
    map.current?.setStyle(styleFor(layer));
  }, [layer]);

  return <div ref={holder} className="size-full" />;
}

/**
 * Full screen, fully interactive: pan, zoom, re-locate, close.
 *
 * A dialog rather than a route — this is a bigger look at the same thing,
 * and pushing a URL for it would put a map in the back button's history
 * between the settings page and wherever somebody came from.
 */
function FullMap({
  lang,
  coords,
  busy,
  layer,
  onToggleLayer,
  onRelocate,
  onClose,
}: {
  lang: Lang;
  coords: Coords;
  busy: boolean;
  layer: MapLayer;
  onToggleLayer: () => void;
  onRelocate: () => void;
  onClose: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!holder.current || map.current) return;
    ensureMapWorker();
    const instance = new MapLibreMap({
      container: holder.current,
      style: styleFor(layer),
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      attributionControl: false,
    });
    instance.addControl(
      new AttributionControl({ compact: true }),
      "bottom-right",
    );
    instance.addControl(
      new NavigationControl({ showCompass: false }),
      "top-right",
    );
    marker.current = new Marker({ element: dot() })
      .setLngLat([coords.longitude, coords.latitude])
      .addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      duration: 500,
    });
    marker.current?.setLngLat([coords.longitude, coords.latitude]);
  }, [coords]);

  useEffect(() => {
    map.current?.setStyle(styleFor(layer));
  }, [layer]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "location.myLocation")}
      className="fixed inset-0 z-50 flex flex-col bg-page"
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        {/* Close on the LEFT, as the app has it. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, "filters.close")}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink ring-1 ring-line transition hover:bg-muted-bg"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <h2 className="min-w-0 flex-1 truncate text-[1.05rem] font-bold text-ink">
          {t(lang, "location.myLocation")}
        </h2>
        <button
          type="button"
          onClick={onRelocate}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-control bg-brand px-3.5 py-2 text-[13px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-60"
        >
          <Refresh spinning={busy} />
          {t(lang, "map.locate")}
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={holder} className="size-full" />
        <LayerButton lang={lang} layer={layer} onToggle={onToggleLayer} />
      </div>
    </div>
  );
}

/**
 * Streets or imagery.
 *
 * Bottom-left on both maps, which is where the browse map puts its own —
 * out of the way of the zoom controls on the right and of the attribution
 * in the corner.
 */
function LayerButton({
  lang,
  layer,
  onToggle,
}: {
  lang: Lang;
  layer: MapLayer;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute bottom-2 start-2 z-10 flex items-center gap-1.5 rounded-control bg-surface/95 px-2.5 py-1.5 text-[12px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur-sm transition hover:bg-surface"
    >
      {layer === "street" ? <SatelliteGlyph /> : <MapGlyph />}
      {/* The label says what pressing it GIVES you, not what is on screen:
          a button labelled with the current state reads as a status. */}
      {t(lang, layer === "street" ? "map.satellite" : "map.street")}
    </button>
  );
}

function SatelliteGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m10 6.5 3.5-3.5 4.5 4.5-3.5 3.5z" />
      <path d="m6.5 10 3.5 3.5-3.5 3.5L2 12.5z" />
      <path d="M13 13.5 16.5 17 14 19.5 10.5 16z" />
      <path d="M15.5 4.5A5 5 0 0 1 20 9" />
    </svg>
  );
}

function MapGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" />
      <path d="M9 4v13M15 7v13" />
    </svg>
  );
}

/** The blue dot, drawn once and reused by both maps. */
function dot(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:14px;height:14px;border-radius:999px;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.25)";
  return el;
}

function Pin() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.2s7-5.4 7-10.6a7 7 0 1 0-14 0c0 5.2 7 10.6 7 10.6Z" />
      <circle cx="12" cy="10.4" r="2.6" />
    </svg>
  );
}

function Expand() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
    </svg>
  );
}

function Navigate() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
    >
      <path d="M21 3 3 10.5l7.2 3.3L13.5 21z" />
    </svg>
  );
}

function Refresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`size-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8 8 0 1 0-.6 4" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}
