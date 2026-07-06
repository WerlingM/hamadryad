import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // The API must be running on port 3001 before running pnpm codegen.
  schema: "http://localhost:3001/graphql",

  // GraphQL operation files co-located with their components.
  documents: ["apps/web/src/**/*.graphql"],

  generates: {
    "apps/web/src/gql/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        apolloClientVersion: 3,
        scalars: {
          DateTime: "string",
          Date: "string",
          JSON: "unknown",
          ID: "string",
        },
        enumsAsTypes: true,
        dedupeFragments: true,
        skipTypename: false,
        nonOptionalTypename: false,
      },
    },
  },

  ignoreNoDocuments: true,
};

export default config;
