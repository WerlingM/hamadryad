import { builder } from "../builder";
import { YardLocationEnum } from "../enums";

builder.prismaObject("Yard", {
  fields: (t) => ({
    id: t.exposeID("id"),
    home: t.relation("home"),
    name: t.exposeString("name"),
    location: t.expose("location", { type: YardLocationEnum }),
    description: t.exposeString("description", { nullable: true }),
    sortOrder: t.exposeInt("sortOrder"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
