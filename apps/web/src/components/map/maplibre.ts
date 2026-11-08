import * as maplibregl from "maplibre-gl";
import "~maplibre-gl-dist/maplibre-gl.css";
import workerUrl from "~maplibre-gl-dist/maplibre-gl-worker.mjs?url";

// MapLibre looks for its worker next to its own module by default, which breaks once
// Vite bundles it. Point it at the copy Vite emits as an asset instead.
maplibregl.setWorkerUrl(workerUrl);

export { maplibregl };
