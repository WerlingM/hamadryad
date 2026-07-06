import { GraphQLError } from "graphql";
import { z } from "zod";
import type { Response } from "express";
import { builder } from "../builder";
import { AuthPayloadRef } from "../types/auth";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
} from "../../lib/auth";

const LoginInput = builder.inputType("LoginInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
});

const RegisterInput = builder.inputType("RegisterInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
    displayName: t.string({ required: true }),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(100),
});

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/auth/refresh",
  });
}

builder.mutationField("login", (t) =>
  t.field({
    type: AuthPayloadRef,
    args: {
      input: t.arg({ type: LoginInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError("Invalid input", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true, displayName: true, passwordHash: true },
      });

      // Use a dummy hash when user not found to prevent email enumeration via timing.
      const passwordHash =
        user?.passwordHash ?? "$2a$12$invalidhashpadding.............";
      const valid = await verifyPassword(parsed.data.password, passwordHash);

      if (!user || !valid) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      const refreshToken = signRefreshToken(user.id);

      setRefreshCookie(ctx.res, refreshToken);

      return {
        token: accessToken,
        user: { id: user.id, email: user.email, displayName: user.displayName },
      };
    },
  })
);

builder.mutationField("register", (t) =>
  t.field({
    type: AuthPayloadRef,
    args: {
      input: t.arg({ type: RegisterInput, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      if (process.env.ALLOW_REGISTRATION !== "true") {
        throw new GraphQLError("Registration is not enabled", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const parsed = registerSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.errors[0].message, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await ctx.prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true },
      });

      if (existing) {
        throw new GraphQLError("An account with that email already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const hash = await hashPassword(parsed.data.password);

      const user = await ctx.prisma.user.create({
        data: {
          email: parsed.data.email,
          displayName: parsed.data.displayName,
          passwordHash: hash,
        },
        select: { id: true, email: true, displayName: true },
      });

      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      const refreshToken = signRefreshToken(user.id);

      setRefreshCookie(ctx.res, refreshToken);

      return { token: accessToken, user };
    },
  })
);
