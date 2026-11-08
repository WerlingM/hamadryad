import { useEffect, useRef } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import { useMap } from "./MapContext";
import { geometryBounds } from "../../lib/geo";

const SOURCE_ID = "parcel";
const EMPTY = { type: "FeatureCollection" as const, features: [] };

interface ParcelLayerProps {
  /** Parcel boundary as a GeoJSON geometry (MultiPolygon), or null if none imported. */
  geometry: unknown;
}

/** Draws the home's lot boundary and zooms to it when it changes. */
export function ParcelLayer({ geometry }: ParcelLayerProps) {
  const map = useMap();
  const lastFitted = useRef<unknown>(undefined);

  useEffect(() => {
    map.addSource(SOURCE_ID, { type: "geojson", data: EMPTY });
    map.addLayer({
      id: "parcel-fill",
      type: "fill",
      source: SOURCE_ID,
      paint: { "fill-color": "#f5d76e", "fill-opacity": 0.15 },
    });
    map.addLayer({
      id: "parcel-outline",
      type: "line",
      source: SOURCE_ID,
      paint: { "line-color": "#e0a800", "line-width": 3 },
    });
    return () => {
      // The map may already be gone if the whole page unmounted.
      if (!map.getStyle()) return;
      map.removeLayer("parcel-outline");
      map.removeLayer("parcel-fill");
      map.removeSource(SOURCE_ID);
    };
  }, [map]);

  useEffect(() => {
    const source = map.getSource<GeoJSONSource>(SOURCE_ID);
    source?.setData(geometry ? { type: "Feature", properties: {}, geometry: geometry as GeoJSON.Geometry } : EMPTY);

    const bounds = geometryBounds(geometry);
    if (bounds && lastFitted.current !== geometry) {
      // Jump on first render (the map already opened here); animate after a new import.
      map.fitBounds(bounds, { padding: 40, maxZoom: 20, duration: lastFitted.current === undefined ? 0 : 800 });
    }
    lastFitted.current = geometry;
  }, [map, geometry]);

  return null;
}
