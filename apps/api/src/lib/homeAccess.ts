import { GraphQLError } from "graphql";
import type { MemberRole } from "@prisma/client";
import type { GraphQLContext } from "../context";
import { uuid } from "./validation";

export const CAN_VIEW: MemberRole[] = ["OWNER", "EDITOR", "VIEWER"];
export const CAN_EDIT: MemberRole[] = ["OWNER", "EDITOR"];
export const OWNER_ONLY: MemberRole[] = ["OWNER"];

type AuthedUser = NonNullable<GraphQLContext["user"]>;

export function requireUser(ctx: GraphQLContext): AuthedUser {
  if (!ctx.user) {
    throw new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
  }
  return ctx.user;
}

function notFound(what: string): GraphQLError {
  return new GraphQLError(`${what} not found`, { extensions: { code: "NOT_FOUND" } });
}

/**
 * Ensure the current user is a member of the home with one of the allowed roles.
 * Non-members get NOT_FOUND so home IDs are not leaked.
 */
export async function requireHomeRole(
  ctx: GraphQLContext,
  homeId: string,
  allowed: MemberRole[]
): Promise<void> {
  const user = requireUser(ctx);
  if (!uuid.safeParse(homeId).success) throw notFound("Home");

  const member = await ctx.prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId: user.id } },
    select: { role: true },
  });
  if (!member) throw notFound("Home");
  if (!allowed.includes(member.role)) {
    throw new GraphQLError("You do not have permission to do that", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

/** Look up a yard's home and check the user's role on it. Returns the home ID. */
export async function requireYardRole(
  ctx: GraphQLContext,
  yardId: string,
  allowed: MemberRole[]
): Promise<string> {
  requireUser(ctx);
  if (!uuid.safeParse(yardId).success) throw notFound("Yard");

  const yard = await ctx.prisma.yard.findUnique({
    where: { id: yardId },
    select: { homeId: true },
  });
  if (!yard) throw notFound("Yard");

  try {
    await requireHomeRole(ctx, yard.homeId, allowed);
  } catch (err) {
    // Hide the existence of yards in homes the user can't see.
    if (err instanceof GraphQLError && err.extensions.code === "NOT_FOUND") throw notFound("Yard");
    throw err;
  }
  return yard.homeId;
}
