import { builder } from "../builder";
import { MemberRoleEnum, YardLocationEnum } from "../enums";

const YardFilter = builder.inputType("YardFilter", {
  fields: (t) => ({
    location: t.field({ type: YardLocationEnum }),
  }),
});

builder.prismaObject("Home", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    address: t.exposeString("address"),
    notes: t.exposeString("notes", { nullable: true }),
    parcelGeoJson: t.expose("parcelGeoJson", { type: "JSON", nullable: true }),
    yards: t.relation("yards", {
      args: { filter: t.arg({ type: YardFilter }) },
      query: ({ filter }) => ({
        where: filter?.location ? { location: filter.location } : {},
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    }),
    members: t.relation("members"),
    myRole: t.field({
      type: MemberRoleEnum,
      nullable: true,
      description: "The current user's role on this home.",
      select: (_args, ctx) => ({
        members: { where: { userId: ctx.user?.id ?? "" }, select: { role: true } },
      }),
      resolve: (home) => home.members[0]?.role ?? null,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
