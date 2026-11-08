import { GraphQLError } from "graphql";

type Position = [number, number];
type PolygonCoords = Position[][];

export interface MultiPolygon {
  type: "MultiPolygon";
  coordinates: PolygonCoords[];
}

const MAX_POSITIONS = 100_000;
const WGS84_CRS = /(CRS84|EPSG:+4326)$/i;

function invalid(message: string): never {
  throw new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Collect polygon coordinate arrays from any GeoJSON object, ignoring non-polygon geometries. */
function collectPolygons(node: unknown, out: unknown[]): void {
  if (!isObject(node)) return;
  switch (node.type) {
    case "FeatureCollection":
      if (Array.isArray(node.features)) node.features.forEach((f) => collectPolygons(f, out));
      return;
    case "Feature":
      collectPolygons(node.geometry, out);
      return;
    case "GeometryCollection":
      if (Array.isArray(node.geometries)) node.geometries.forEach((g) => collectPolygons(g, out));
      return;
    case "Polygon":
      out.push(node.coordinates);
      return;
    case "MultiPolygon":
      if (Array.isArray(node.coordinates)) out.push(...node.coordinates);
      return;
  }
}

/** Validate a polygon's rings and drop any Z/M values so it fits a 2D column. */
function toPolygon(raw: unknown, counter: { n: number }): PolygonCoords {
  if (!Array.isArray(raw) || raw.length === 0) invalid("A polygon in the file has no rings.");
  return raw.map((ring) => {
    if (!Array.isArray(ring) || ring.length < 3) invalid("A polygon ring needs at least 3 points.");
    const positions = ring.map((pos): Position => {
      if (!Array.isArray(pos) || typeof pos[0] !== "number" || typeof pos[1] !== "number") {
        invalid("The file contains a malformed coordinate.");
      }
      const [lon, lat] = pos as number[];
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
        invalid(
          "Coordinates don't look like longitude/latitude. Export the parcel as WGS 84 (EPSG:4326) GeoJSON."
        );
      }
      if (++counter.n > MAX_POSITIONS) invalid("The parcel file is too detailed (over 100,000 points).");
      return [lon, lat];
    });
    // Close the ring if the file left it open.
    const [first, last] = [positions[0], positions[positions.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) positions.push([...first]);
    if (positions.length < 4) invalid("A polygon ring needs at least 3 distinct points.");
    return positions;
  });
}

/**
 * Turn uploaded GeoJSON text (FeatureCollection, Feature, or geometry) into a single
 * 2D MultiPolygon in WGS 84. Throws BAD_USER_INPUT with a user-facing message.
 */
export function parseParcelGeoJson(text: string): MultiPolygon {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    invalid("The file is not valid JSON.");
  }

  const crsName = isObject(doc) && isObject(doc.crs) && isObject(doc.crs.properties) ? doc.crs.properties.name : null;
  if (typeof crsName === "string" && !WGS84_CRS.test(crsName)) {
    invalid(`The file uses coordinate system ${crsName}. Export the parcel as WGS 84 (EPSG:4326) GeoJSON.`);
  }

  const raw: unknown[] = [];
  collectPolygons(doc, raw);
  if (raw.length === 0) invalid("No polygon boundary was found in the file.");

  const counter = { n: 0 };
  return { type: "MultiPolygon", coordinates: raw.map((p) => toPolygon(p, counter)) };
}
