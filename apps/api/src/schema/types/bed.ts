import { builder } from "../builder";
import { MoistureEnum, SunlightEnum } from "../enums";

builder.prismaObject("Bed", {
  fields: (t) => ({
    id: t.exposeID("id"),
    yard: t.relation("yard"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    sunlight: t.expose("sunlight", { type: SunlightEnum }),
    moisture: t.expose("moisture", { type: MoistureEnum }),
    geometry: t.field({
      type: "JSON",
      nullable: true,
      description: "Bed outline as a GeoJSON Polygon geometry.",
      resolve: (bed, _args, ctx) => ctx.loaders.bedGeometry.load(bed.id),
    }),
    sortOrder: t.exposeInt("sortOrder"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
