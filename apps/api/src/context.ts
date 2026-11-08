import type { Request, Response } from "express";
import { prisma } from "./lib/prisma";
import { verifyAccessToken } from "./lib/auth";
import { createLoaders, type Loaders } from "./lib/loaders";

export interface GraphQLContext {
  req: Request;
  res: Response;
  user: {
    id: string;
    email: string;
    displayName: string;
  } | null;
  prisma: typeof prisma;
  loaders: Loaders;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> {
  let user: GraphQLContext["user"] = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, displayName: true },
      });
      if (dbUser) user = dbUser;
    } catch {
      // Invalid or expired token — user stays null.
    }
  }

  return { req, res, user, prisma, loaders: createLoaders(prisma) };
}
