import type { Map as MapLibreMap } from "maplibre-gl";

/** OpenFreeMap vector style: free, no API key. */
export const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const SATELLITE_LAYER_ID = "satellite";

/** Continental US, used when a home has no parcel yet. */
export const DEFAULT_VIEW = { center: [-98.5, 39.8] as [number, number], zoom: 3 };

/**
 * Add ESRI World Imagery as a hidden raster layer under the base map's labels.
 * Toggling its visibility switches between map and satellite without reloading the style,
 * so app layers (parcel, beds) are never lost.
 */
export function addSatelliteLayer(map: MapLibreMap): void {
  map.addSource(SATELLITE_LAYER_ID, {
    type: "raster",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    tileSize: 256,
    maxzoom: 19,
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
  });
  const firstLabelLayer = map.getStyle().layers.find((layer) => layer.type === "symbol");
  map.addLayer(
    { id: SATELLITE_LAYER_ID, type: "raster", source: SATELLITE_LAYER_ID, layout: { visibility: "none" } },
    firstLabelLayer?.id
  );
}
