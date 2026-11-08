import SchemaBuilder from "@pothos/core";
import { GraphQLError } from "graphql";
import PrismaPlugin from "@pothos/plugin-prisma";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import PrismaTypes, { getDatamodel } from "@pothos/plugin-prisma/generated";
import type { GraphQLContext } from "../context";

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  PrismaTypes: PrismaTypes;
  AuthScopes: {
    authenticated: boolean;
  };
  DefaultFieldNullability: false;
  Scalars: {
    DateTime: { Input: Date | string; Output: Date | string };
    Date: { Input: Date | string; Output: Date | string };
    JSON: { Input: unknown; Output: unknown };
  };
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin],
  defaultFieldNullability: false,
  scopeAuth: {
    authScopes: async (ctx) => ({
      authenticated: ctx.user !== null,
    }),
    unauthorizedError: (_parent, _ctx, info) =>
      new GraphQLError(`Not authenticated: ${info.fieldName}`, {
        extensions: { code: "UNAUTHENTICATED" },
      }),
  },
  prisma: {
    client: (ctx) => ctx.prisma,
    dmmf: getDatamodel(),
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },
});

// Declare root types here so they exist before any queryField/mutationField calls
// in other schema modules (which are imported after this module is evaluated).
builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });
