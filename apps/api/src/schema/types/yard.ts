import { builder } from "../builder";
import { MoistureEnum, SunlightEnum, YardLocationEnum } from "../enums";

const BedFilter = builder.inputType("BedFilter", {
  fields: (t) => ({
    sunlight: t.field({ type: SunlightEnum }),
    moisture: t.field({ type: MoistureEnum }),
  }),
});

builder.prismaObject("Yard", {
  fields: (t) => ({
    id: t.exposeID("id"),
    home: t.relation("home"),
    name: t.exposeString("name"),
    location: t.expose("location", { type: YardLocationEnum }),
    description: t.exposeString("description", { nullable: true }),
    sortOrder: t.exposeInt("sortOrder"),
    beds: t.relation("beds", {
      args: { filter: t.arg({ type: BedFilter }) },
      query: ({ filter }) => ({
        where: {
          ...(filter?.sunlight ? { sunlight: filter.sunlight } : {}),
          ...(filter?.moisture ? { moisture: filter.moisture } : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
