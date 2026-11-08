import { create } from "zustand";

export type BaseLayer = "map" | "satellite";

interface MapState {
  baseLayer: BaseLayer;
  setBaseLayer: (layer: BaseLayer) => void;
}

/** Map UI state (drawing mode and selection join this in later sprints). */
export const useMapStore = create<MapState>()((set) => ({
  baseLayer: "map",
  setBaseLayer: (baseLayer) => set({ baseLayer }),
}));
