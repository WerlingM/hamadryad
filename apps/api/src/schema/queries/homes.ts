import { builder } from "../builder";
import { requireUser } from "../../lib/homeAccess";
import { uuid } from "../../lib/validation";

builder.queryField("homes", (t) =>
  t.prismaField({
    type: ["Home"],
    authScopes: { authenticated: true },
    description: "Homes the current user is a member of.",
    resolve: (query, _root, _args, ctx) => {
      const user = requireUser(ctx);
      return ctx.prisma.home.findMany({
        ...query,
        where: { members: { some: { userId: user.id } } },
        orderBy: { name: "asc" },
      });
    },
  })
);

builder.queryField("home", (t) =>
  t.prismaField({
    type: "Home",
    nullable: true,
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: (query, _root, { id }, ctx) => {
      const user = requireUser(ctx);
      if (!uuid.safeParse(id).success) return null;
      return ctx.prisma.home.findFirst({
        ...query,
        where: { id: String(id), members: { some: { userId: user.id } } },
      });
    },
  })
);
