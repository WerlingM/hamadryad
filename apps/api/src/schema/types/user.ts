import { builder } from "../builder";

export const UserRef = builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    displayName: t.exposeString("displayName"),
    // passwordHash is intentionally not exposed
  }),
});
