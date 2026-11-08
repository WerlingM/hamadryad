import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { maplibregl } from "./maplibre";
import { addSatelliteLayer, BASE_STYLE_URL, DEFAULT_VIEW } from "./baseStyle";
import { MapContext } from "./MapContext";
import type { Bounds } from "../../lib/geo";

interface YardMapProps {
  /** Area to show on first load; falls back to a country-wide view. */
  initialBounds?: Bounds | null;
  /** Map layers and overlays; rendered once the base style has loaded. */
  children?: ReactNode;
}

export function YardMap({ initialBounds, children }: YardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  // Only the first value matters; later bounds changes are handled by layers.
  const initialBoundsRef = useRef(initialBounds);

  useEffect(() => {
    if (!containerRef.current) return;
    const bounds = initialBoundsRef.current;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE_URL,
      ...(bounds ? { bounds, fitBoundsOptions: { padding: 40, maxZoom: 20 } } : DEFAULT_VIEW),
      maxZoom: 21,
    });
    instance.addControl(new maplibregl.NavigationControl(), "top-right");
    instance.addControl(new maplibregl.ScaleControl({ unit: "imperial" }), "bottom-left");
    instance.on("load", () => {
      addSatelliteLayer(instance);
      setMap(instance);
    });

    return () => {
      setMap(null);
      instance.remove();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
}
