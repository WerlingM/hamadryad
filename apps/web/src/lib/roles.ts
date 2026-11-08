import type { MemberRole } from "../gql/graphql";

export const canEdit = (role?: MemberRole | null) => role === "OWNER" || role === "EDITOR";
export const isOwner = (role?: MemberRole | null) => role === "OWNER";
