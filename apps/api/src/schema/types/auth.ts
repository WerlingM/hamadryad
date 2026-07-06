import { builder } from "../builder";

export const AuthPayloadRef = builder.objectRef<{
  token: string;
  user: { id: string; email: string; displayName: string };
}>("AuthPayload");

AuthPayloadRef.implement({
  description: "Returned by login and register mutations.",
  fields: (t) => ({
    token: t.exposeString("token"),
    user: t.field({
      type: "User",
      resolve: (parent) => parent.user,
    }),
  }),
});
