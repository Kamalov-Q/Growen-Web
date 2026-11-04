"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapMarker } from "maplibre-gl";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { GEOSEARCH_CREDIT, searchPlace, type Place, type UzRegion } from "@/src/lib/geosearch";
import { API_URL } from "@/src/lib/site";

const SEARCH_SOURCE = "map-search";
const SEARCH_COLOR = "#3b82f6";

/**
 * The map's own controls: place search, fullscreen, and "where am I".
 *
 * Ported from the admin dashboard's `ListingMap`, which is the map this one
 * was asked to match. The admin map is an EDITOR — it draws and saves one
 * listing's outline — so its editing half has no meaning here; what carried
 * over is everything that helps a person get the camera where they want it.
 *
 * The search is deliberately the admin's, not a simpler one. Nominatim with
 * `polygon_geojson=1` returns a district's REAL boundary (Chilonzor is a
 * 610-point ring), and the SOATO list is consulted first so a bare
 * "Chilonzor" resolves to the district instead of the metro station — a
 * failure the admin version documents having measured.
 */
export function MapControls({
  lang,
  map,
  ready,
}: {
  lang: Lang;
  map: MapLibreMap | null;
  /** The style has loaded; before that, adding a source throws. */
  ready: boolean;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [full, setFull] = useState(false);
  const [regions, setRegions] = useState<readonly UzRegion[]>([]);
  const meMarker = useRef<MapMarker | null>(null);

  // The SOATO list, used only to resolve a typed district name before it
  // goes to Nominatim. Failure is silent and harmless: without it, search
  // still works, it is just worse at bare district names.
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/regions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: UzRegion[]) => alive && setRegions(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // The highlighted outline of whatever was found. Torn down with the map.
  useEffect(() => {
    if (!map || !ready) return;
    const draw = () => {
      const data = {
        type: "FeatureCollection" as const,
        features:
          found?.kind === "area"
            ? [{ type: "Feature" as const, properties: {}, geometry: found.geometry }]
            : [],
      };
      const src = map.getSource(SEARCH_SOURCE);
      if (src && "setData" in src) {
        (src as GeoJSONSource).setData(data);
        return;
      }
      map.addSource(SEARCH_SOURCE, { type: "geojson", data });
      map.addLayer({
        id: `${SEARCH_SOURCE}-fill`,
        type: "fill",
        source: SEARCH_SOURCE,
        paint: { "fill-color": SEARCH_COLOR, "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: `${SEARCH_SOURCE}-line`,
        type: "line",
        source: SEARCH_SOURCE,
        paint: { "line-color": SEARCH_COLOR, "line-width": 2 },
      });
    };
    draw();
  }, [map, ready, found]);

  const runSearch = async () => {
    if (!map || !query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const b = map.getBounds();
      const place = await searchPlace(query, {
        // The box currently on screen, as a PREFERENCE not a filter, so
        // "Bodomzor" finds the station you are looking at rather than the
        // village of that name three regions away.
        bias: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        regions,
      });
      if (!place) {
        setFound(null);
        setError(t(lang, "map.searchEmpty"));
        return;
      }
      setFound(place);
      if (place.kind === "area") {
        map.fitBounds(
          [
            [place.bbox[0], place.bbox[1]],
            [place.bbox[2], place.bbox[3]],
          ],
          { padding: 48, duration: 600 },
        );
      } else {
        map.flyTo({ center: place.center, zoom: 15, duration: 600 });
      }
    } catch {
      setError(t(lang, "map.searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setFound(null);
    setError(null);
  };

  const locate = () => {
    if (!map) return;
    if (!navigator.geolocation) return setError(t(lang, "map.noGeo"));
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { Marker } = await import("maplibre-gl");
        const center: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        meMarker.current?.remove();
        const dot = document.createElement("div");
        dot.style.cssText =
          "width:16px;height:16px;border-radius:999px;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.28)";
        meMarker.current = new Marker({ element: dot }).setLngLat(center).addTo(map);
        map.flyTo({ center, zoom: 14, duration: 600 });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          t(lang, err.code === err.PERMISSION_DENIED ? "map.geoDenied" : "map.geoFailed"),
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  // Fullscreen is done with the real Fullscreen API rather than a fixed
  // overlay: it hides the browser chrome too, which on a laptop is most of
  // what makes a map feel big.
  const toggleFull = () => {
    const el = map?.getContainer().parentElement;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen().catch(() => setError(t(lang, "map.fullFailed")));
  };

  useEffect(() => {
    const onChange = () => {
      setFull(Boolean(document.fullscreenElement));
      // The canvas must be told; entering fullscreen changes the element's
      // size without a window resize event the map would notice.
      map?.resize();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [map]);

  const btn =
    "flex h-9 items-center gap-1.5 rounded-control bg-surface/95 px-3 text-[13px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur-sm transition hover:bg-surface disabled:opacity-60";

  return (
    <>
      {/* IN FLOW, not absolutely placed.
          The row used to pin itself to the map's top-left corner, which is
          also where the browse page's own floating panel goes — the two
          landed on top of each other. The parent stacks whatever floats
          over the map in one column instead, so this row simply follows
          whatever is above it and neither has to know the other's height.

          On a phone the search box takes the full row and the two buttons
          drop beneath it as icons. Before this they shared one line with
          their labels, so at 459px "Butun ekran" was sliced off the right
          edge and the search input had about forty pixels to itself. */}
      <div className="pointer-events-none flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
        {/* A <div>, NOT a <form>.
            ShapePicker drops this map inside CreateListingForm's own
            <form>, and HTML forbids a form inside a form: the parser throws
            the inner one away, so the server's HTML and React's tree
            disagree and hydration fails on the whole add-listing page.
            Nothing here submits to a server, so the element was only ever
            buying Enter-to-search — which the input does for itself
            below. */}
        <div
          role="search"
          className="pointer-events-auto flex h-9 w-full min-w-0 items-center gap-1 rounded-control bg-surface/95 px-2.5 shadow-card ring-1 ring-line backdrop-blur-sm sm:w-auto sm:max-w-xs sm:flex-1"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, "map.searchPlaceholder")}
            aria-label={t(lang, "map.searchPlaceholder")}
            enterKeyHint="search"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              // Without this the Enter lands on the ANCESTOR form — the
              // add-listing form — and submits a half-filled listing.
              e.preventDefault();
              e.stopPropagation();
              void runSearch();
            }}
            className="h-full w-full min-w-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          {query || found ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t(lang, "filters.reset")}
              className="shrink-0 px-1 text-muted hover:text-ink"
            >
              ✕
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching || !query.trim()}
            aria-label={t(lang, "home.searchAction")}
            className="shrink-0 rounded-[0.5rem] bg-brand px-2.5 py-1 text-[12px] font-bold text-brand-ink disabled:opacity-50"
          >
            {searching ? "…" : (
              <>
                <span aria-hidden className="sm:hidden">⌕</span>
                <span className="hidden sm:inline">
                  {t(lang, "home.searchAction")}
                </span>
              </>
            )}
          </button>
        </div>

        <div className="pointer-events-auto flex gap-2 self-start">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            aria-label={t(lang, "map.locate")}
            className={btn}
          >
            {locating ? "…" : "◎"}
            <span className="hidden sm:inline">{t(lang, "map.locate")}</span>
          </button>
          <button
            type="button"
            onClick={toggleFull}
            aria-label={t(lang, full ? "map.exitFull" : "map.full")}
            className={btn}
          >
            {full ? "✕" : "⤢"}
            <span className="hidden sm:inline">
              {t(lang, full ? "map.exitFull" : "map.full")}
            </span>
          </button>
        </div>
      </div>

      {/* Under the row it belongs to, in the same column. It used to be
          pinned to the bottom of the map, which is now where the listing
          preview card opens. */}
      {found || error ? (
        <div className="pointer-events-none flex justify-center">
          <p className="pointer-events-auto max-w-full truncate rounded-control bg-surface/95 px-3 py-1.5 text-[12px] shadow-card ring-1 ring-line backdrop-blur-sm">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : (
              <>
                <span className="text-ink">{found?.label}</span>
                {/* Required by ODbL wherever a Nominatim result is shown. */}
                <span className="text-faint"> · {GEOSEARCH_CREDIT}</span>
              </>
            )}
          </p>
        </div>
      ) : null}
    </>
  );
}
