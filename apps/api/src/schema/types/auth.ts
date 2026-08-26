import type { User } from "@prisma/client";
import { builder } from "../builder";
import { UserRef } from "./user";

export const AuthPayloadRef = builder.objectRef<{
  token: string;
  user: User;
}>("AuthPayload");

AuthPayloadRef.implement({
  description: "Returned by login and register mutations.",
  fields: (t) => ({
    token: t.exposeString("token"),
    user: t.field({
      type: UserRef,
      resolve: (parent) => parent.user,
    }),
  }),
});
