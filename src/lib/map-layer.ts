import { SATELLITE_STYLE, STREET_STYLE } from "./mapStyles";

/**
 * Streets or imagery, remembered for this browser.
 *
 * ONE preference, shared by every map on the site. It used to live inside
 * the browse map, which meant the settings card could not read what
 * somebody had already chosen — and two maps on one site disagreeing about
 * which one they are showing is the kind of detail that makes a product
 * feel assembled rather than built.
 *
 * Reads are wrapped: a private window and blocked site data both throw
 * here rather than returning null, and a map that will not render because
 * storage is disabled is a worse outcome than a map in the default layer.
 */
export type MapLayer = "street" | "satellite";

const KEY = "growencity.map.layer";

export function readMapLayer(): MapLayer {
  try {
    return localStorage.getItem(KEY) === "satellite" ? "satellite" : "street";
  } catch {
    return "street";
  }
}

export function writeMapLayer(layer: MapLayer): void {
  try {
    localStorage.setItem(KEY, layer);
  } catch {
    // Remembering the choice is a convenience, not a requirement.
  }
}

export const styleFor = (layer: MapLayer) =>
  layer === "satellite" ? SATELLITE_STYLE : STREET_STYLE;
