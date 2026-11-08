export type Bounds = [[number, number], [number, number]];

/** Bounding box [[west, south], [east, north]] of any GeoJSON geometry, or null if it has no coordinates. */
export function geometryBounds(geometry: unknown): Bounds | null {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;

  const visit = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      west = Math.min(west, node[0]);
      east = Math.max(east, node[0]);
      south = Math.min(south, node[1]);
      north = Math.max(north, node[1]);
      return;
    }
    node.forEach(visit);
  };

  if (geometry && typeof geometry === "object" && "coordinates" in geometry) {
    visit((geometry as { coordinates: unknown }).coordinates);
  }
  return west === Infinity ? null : [[west, south], [east, north]];
}
