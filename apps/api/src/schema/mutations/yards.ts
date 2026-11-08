import { z } from "zod";
import { YardLocation } from "@prisma/client";
import { builder } from "../builder";
import { YardLocationEnum } from "../enums";
import { CAN_EDIT, requireHomeRole, requireYardRole } from "../../lib/homeAccess";
import { parseInput } from "../../lib/validation";

const name = z.string().trim().min(1, "is required").max(200);
const location = z.nativeEnum(YardLocation);
const description = z.string().trim().max(5000).nullable().optional();
const sortOrder = z.number().int().min(0).max(10000);

const createSchema = z.object({ name, location, description, sortOrder: sortOrder.nullish() });
const updateSchema = z.object({
  name: name.optional(),
  location: location.optional(),
  description,
  sortOrder: sortOrder.optional(),
});

const CreateYardInput = builder.inputType("CreateYardInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    location: t.field({ type: YardLocationEnum, required: true }),
    description: t.string(),
    sortOrder: t.int({ description: "Defaults to after the last yard in the home." }),
  }),
});

const UpdateYardInput = builder.inputType("UpdateYardInput", {
  fields: (t) => ({
    name: t.string(),
    location: t.field({ type: YardLocationEnum }),
    description: t.string(),
    sortOrder: t.int(),
  }),
});

builder.mutationField("createYard", (t) =>
  t.prismaField({
    type: "Yard",
    authScopes: { authenticated: true },
    args: {
      homeId: t.arg.id({ required: true }),
      input: t.arg({ type: CreateYardInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const homeId = String(args.homeId);
      await requireHomeRole(ctx, homeId, CAN_EDIT);
      const { sortOrder: requested, ...data } = parseInput(createSchema, args.input);

      let sortOrder = requested;
      if (sortOrder == null) {
        const { _max } = await ctx.prisma.yard.aggregate({
          where: { homeId },
          _max: { sortOrder: true },
        });
        sortOrder = (_max.sortOrder ?? -1) + 1;
      }

      return ctx.prisma.yard.create({ ...query, data: { ...data, sortOrder, homeId } });
    },
  })
);

builder.mutationField("updateYard", (t) =>
  t.prismaField({
    type: "Yard",
    authScopes: { authenticated: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateYardInput, required: true }),
    },
    resolve: async (query, _root, { id, input }, ctx) => {
      await requireYardRole(ctx, String(id), CAN_EDIT);
      const data = parseInput(updateSchema, input);
      return ctx.prisma.yard.update({ ...query, where: { id: String(id) }, data });
    },
  })
);

builder.mutationField("deleteYard", (t) =>
  t.boolean({
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      await requireYardRole(ctx, String(id), CAN_EDIT);
      await ctx.prisma.yard.delete({ where: { id: String(id) } });
      return true;
    },
  })
);
