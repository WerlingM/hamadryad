import { createContext, useContext } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export const MapContext = createContext<MapLibreMap | null>(null);

/** The loaded map instance. Only available to children of YardMap. */
export function useMap(): MapLibreMap {
  const map = useContext(MapContext);
  if (!map) throw new Error("useMap must be used inside <YardMap>");
  return map;
}
