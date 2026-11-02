"use client";

import { setWorkerUrl } from "maplibre-gl";

/**
 * Point MapLibre at its own worker.
 *
 * MapLibre looks for `maplibre-gl-worker.mjs` next to its own file at
 * runtime, and a bundler moves that file — so the lookup fails with
 * "Worker failed to load. Check that the worker URL is correct." and the
 * map renders a blank grey box: tile parsing, outlines and labels all happen
 * in the worker.
 *
 * `new URL(path, import.meta.url)` is the pattern bundlers are built to
 * recognise. Turbopack sees it, emits the worker as an asset and rewrites
 * the URL to wherever it put it, so this stays correct across versions
 * without copying the file into `public/` and remembering to update it when
 * maplibre is upgraded.
 *
 * The admin dashboard has the same fix in Vite's dialect
 * (`import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"`).
 *
 * Called at module load, which happens before any Map is constructed because
 * both map components import from here rather than from maplibre directly —
 * setWorkerUrl after the first Map exists is too late.
 */
let configured = false;

export function ensureMapWorker(): void {
  if (configured) return;
  configured = true;
  setWorkerUrl(
    new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
  );
}
