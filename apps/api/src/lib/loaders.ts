import DataLoader from "dataloader";
import { Prisma } from "@prisma/client";
import type { prisma as prismaClient } from "./prisma";

export type Loaders = ReturnType<typeof createLoaders>;

/** Per-request DataLoaders. Created in context.ts so batches never cross requests. */
export function createLoaders(prisma: typeof prismaClient) {
  return {
    /** Bed outline as a GeoJSON geometry (or null), batched into one PostGIS query. */
    bedGeometry: new DataLoader<string, unknown>(async (ids) => {
      const rows = await prisma.$queryRaw<{ id: string; geometry: unknown }[]>`
        SELECT id::text, ST_AsGeoJSON(geometry)::json AS geometry
        FROM beds
        WHERE id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})`;
      const byId = new Map(rows.map((r) => [r.id, r.geometry]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}
