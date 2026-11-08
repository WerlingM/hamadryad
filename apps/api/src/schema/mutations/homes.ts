import { z } from "zod";
import { builder } from "../builder";
import { CAN_EDIT, OWNER_ONLY, requireHomeRole, requireUser } from "../../lib/homeAccess";
import { parseInput } from "../../lib/validation";

const name = z.string().trim().min(1, "is required").max(200);
const address = z.string().trim().min(1, "is required").max(500);
const notes = z.string().trim().max(5000).nullable().optional();

const createSchema = z.object({ name, address, notes });
const updateSchema = z.object({ name: name.optional(), address: address.optional(), notes });

const CreateHomeInput = builder.inputType("CreateHomeInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    address: t.string({ required: true }),
    notes: t.string(),
  }),
});

const UpdateHomeInput = builder.inputType("UpdateHomeInput", {
  fields: (t) => ({
    name: t.string(),
    address: t.string(),
    notes: t.string(),
  }),
});

builder.mutationField("createHome", (t) =>
  t.prismaField({
    type: "Home",
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CreateHomeInput, required: true }) },
    resolve: (query, _root, { input }, ctx) => {
      const user = requireUser(ctx);
      const data = parseInput(createSchema, input);
      return ctx.prisma.home.create({
        ...query,
        data: {
          ...data,
          ownerId: user.id,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    },
  })
);

builder.mutationField("updateHome", (t) =>
  t.prismaField({
    type: "Home",
    authScopes: { authenticated: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateHomeInput, required: true }),
    },
    resolve: async (query, _root, { id, input }, ctx) => {
      await requireHomeRole(ctx, String(id), CAN_EDIT);
      const data = parseInput(updateSchema, input);
      return ctx.prisma.home.update({ ...query, where: { id: String(id) }, data });
    },
  })
);

builder.mutationField("deleteHome", (t) =>
  t.boolean({
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      await requireHomeRole(ctx, String(id), OWNER_ONLY);
      await ctx.prisma.home.delete({ where: { id: String(id) } });
      return true;
    },
  })
);
