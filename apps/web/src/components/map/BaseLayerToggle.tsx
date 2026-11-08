import { useEffect } from "react";
import { useMap } from "./MapContext";
import { SATELLITE_LAYER_ID } from "./baseStyle";
import { useMapStore, type BaseLayer } from "../../stores/mapStore";
import { button } from "../ui/styles";

const OPTIONS: { value: BaseLayer; label: string }[] = [
  { value: "map", label: "Map" },
  { value: "satellite", label: "Satellite" },
];

export function BaseLayerToggle() {
  const map = useMap();
  const { baseLayer, setBaseLayer } = useMapStore();

  useEffect(() => {
    map.setLayoutProperty(SATELLITE_LAYER_ID, "visibility", baseLayer === "satellite" ? "visible" : "none");
  }, [map, baseLayer]);

  return (
    <div role="group" aria-label="Base map" style={{ position: "absolute", top: 10, left: 10, display: "flex" }}>
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          aria-pressed={baseLayer === value}
          onClick={() => setBaseLayer(value)}
          style={{
            ...button,
            borderRadius: 0,
            background: baseLayer === value ? "#2f6b3a" : "#fff",
            color: baseLayer === value ? "#fff" : "#222",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
