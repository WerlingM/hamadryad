import type { YardLocation } from "../gql/graphql";

export const YARD_LOCATION_LABELS: Record<YardLocation, string> = {
  FRONT: "Front",
  BACK: "Back",
  SIDE_LEFT: "Left side",
  SIDE_RIGHT: "Right side",
  OTHER: "Other",
};

export const YARD_LOCATIONS = Object.keys(YARD_LOCATION_LABELS) as YardLocation[];
