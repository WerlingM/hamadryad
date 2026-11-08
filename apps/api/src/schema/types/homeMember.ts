import { builder } from "../builder";
import { MemberRoleEnum } from "../enums";

builder.prismaObject("HomeMember", {
  fields: (t) => ({
    id: t.exposeID("id"),
    role: t.expose("role", { type: MemberRoleEnum }),
    user: t.relation("user"),
  }),
});
