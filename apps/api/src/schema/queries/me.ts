import { builder } from "../builder";

builder.queryField("me", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    description: "Returns the currently authenticated user, or null.",
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.user) return null;
      return ctx.prisma.user.findUnique({
        ...query,
        where: { id: ctx.user.id },
      });
    },
  })
);
