import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./schema/index";
import { createContext } from "./context";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "./lib/auth";
import { prisma } from "./lib/prisma";

const PORT = parseInt(process.env.API_PORT ?? "3001", 10);
const IS_DEV = process.env.NODE_ENV !== "production";

async function main() {
  const app = express();

  app.use(
    helmet({
      // Apollo Sandbox loads CDN resources in dev — relax CSP accordingly.
      crossOriginEmbedderPolicy: !IS_DEV,
      contentSecurityPolicy: IS_DEV ? false : undefined,
    })
  );

  app.use(
    cors({
      origin: IS_DEV ? "http://localhost:5173" : process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(cookieParser());
  // Parcel GeoJSON uploads can exceed the 100 KB default.
  app.use(express.json({ limit: "5mb" }));

  // ── REST: token refresh ────────────────────────────────────────────────────
  app.post("/auth/refresh", async (req, res) => {
    const token: string | undefined = req.cookies["refresh_token"];
    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    try {
      const payload = verifyRefreshToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });

      if (!user) {
        res.clearCookie("refresh_token", { path: "/auth/refresh" });
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Rotate refresh token on every use.
      const newRefreshToken = signRefreshToken(user.id);
      const newAccessToken = signAccessToken({ sub: user.id, email: user.email });

      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: !IS_DEV,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/auth/refresh",
      });

      res.json({ token: newAccessToken });
    } catch {
      res.clearCookie("refresh_token", { path: "/auth/refresh" });
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  });

  // ── Apollo Server ──────────────────────────────────────────────────────────
  const server = new ApolloServer({
    schema,
    introspection: true,
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, { context: createContext })
  );

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
