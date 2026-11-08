import { GraphQLError } from "graphql";
import { builder } from "../builder";
import { CAN_EDIT, requireHomeRole } from "../../lib/homeAccess";
import { parseParcelGeoJson } from "../../lib/parcelGeoJson";

builder.mutationField("importParcel", (t) =>
  t.prismaField({
    type: "Home",
    authScopes: { authenticated: true },
    description:
      "Replace the home's parcel boundary from GeoJSON text (FeatureCollection, Feature, or Polygon/MultiPolygon in WGS 84).",
    args: {
      homeId: t.arg.id({ required: true }),
      geoJson: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const homeId = String(args.homeId);
      await requireHomeRole(ctx, homeId, CAN_EDIT);
      const geometry = JSON.stringify(parseParcelGeoJson(args.geoJson));

      // Repair self-intersections, keep only polygon parts, and store both the
      // PostGIS geometry and its GeoJSON form (used for rendering).
      const updated = await ctx.prisma.$executeRaw`
        UPDATE homes h
        SET "parcelGeometry" = g.geom,
            "parcelGeoJson" = ST_AsGeoJSON(g.geom)::jsonb,
            "updatedAt" = now()
        FROM (
          SELECT ST_Multi(ST_CollectionExtract(ST_MakeValid(
            ST_SetSRID(ST_GeomFromGeoJSON(${geometry}), 4326)), 3)) AS geom
        ) g
        WHERE h.id = ${homeId}::uuid AND NOT ST_IsEmpty(g.geom)`;

      if (updated === 0) {
        throw new GraphQLError("The boundary in the file is not a valid area.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return ctx.prisma.home.findUniqueOrThrow({ ...query, where: { id: homeId } });
    },
  })
);
