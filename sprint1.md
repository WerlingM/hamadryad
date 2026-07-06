# Hamadryad Sprint 1 — Complete Implementation Plan

## Overview

Sprint 1 delivers a running full-stack skeleton: PostgreSQL with PostGIS running in Docker, a Node.js/TypeScript API with Apollo Server 4 and a `me` query + `login` mutation, and a React frontend with a login page that stores a JWT in Zustand and redirects to a protected `/homes` placeholder. When complete, `docker compose up` starts the DB, `pnpm dev` starts the API and web, a seeded user can log in, and Apollo DevTools confirms `me` returns the user.

---

## 1. Package.json Files

### Root `package.json`

The root package has no runtime dependencies. It only coordinates scripts across the workspace using `pnpm --filter` and `pnpm -r`.

```json
{
  "name": "hamadryad",
  "private": true,
  "version": "0.0.1",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "codegen": "graphql-codegen --config codegen.ts",
    "db:migrate": "pnpm --filter api exec prisma migrate dev",
    "db:migrate:deploy": "pnpm --filter api exec prisma migrate deploy",
    "seed": "pnpm --filter api exec tsx prisma/seed.ts",
    "typecheck": "pnpm -r run typecheck"
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.2",
    "@graphql-codegen/typescript": "^4.0.9",
    },
    "@graphql-codegen/typescript-operations": "^4.2.3",
    "tsx": "^4.15.7",
    "typescript": "^5.5.3"
    "@graphql-codegen/typescript-react-apollo": "^4.3.2",
  }
}
```

**Rationale for non-obvious choices:**
- `@graphql-codegen/*` live at the root because codegen reads from the API and writes to the web app — it belongs to neither workspace package.
- `tsx` at root enables the seed script to run via `pnpm seed` without building first.
- `typescript` at root ensures a single version is used by both apps via workspace hoisting.
- `pnpm -r --parallel run dev` starts both API and web dev servers concurrently without needing `concurrently` as an additional dependency.

---

### `apps/api/package.json`

```json
{
  "name": "@hamadryad/api",
  "version": "0.0.1",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@apollo/server": "^4.11.0",
    "@pothos/core": "^4.0.0",
    "@pothos/plugin-prisma": "^4.1.0",
    "@pothos/plugin-scope-auth": "^4.1.0",
    "@prisma/client": "^5.17.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "graphql": "^16.9.0",
    "graphql-scalars": "^1.23.0",
    "graphql-tag": "^2.12.6",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.11",
    "prisma": "^5.17.0",
    "tsx": "^4.15.7",
    "typescript": "^5.5.3"
  }
}
```

**Rationale:**
- `@apollo/server` v4: the current major; uses the `expressMiddleware` integration pattern (not the older `applyMiddleware`).
- `@pothos/core` + `@pothos/plugin-prisma` + `@pothos/plugin-scope-auth`: Pothos is the code-first schema builder specified in the plan. The Prisma plugin integrates Prisma model types directly. `scope-auth` provides declarative per-type/per-field authentication guards.
- `@prisma/client` is a prod dep (runtime query engine); `prisma` CLI is a devDep (only needed for migrations and type generation).
- `bcryptjs` not `bcrypt`: pure JS, no native node-gyp build step, trivially cross-platform in Docker multi-stage builds.
- `cookie-parser`: parses `httpOnly` cookies on the `/auth/refresh` REST endpoint.
- `graphql-scalars`: provides battle-tested `DateTime`, `Date`, and `JSON` scalars with serializers and parsers already written.
- `helmet`: HTTP security headers. Prod dep because it runs in the Express middleware chain.
- `jsonwebtoken`: JWT sign/verify. Types in devDeps.
- `zod`: input validation on mutations. Already in the plan for Sprint 9 hardening, but useful from Sprint 1 to validate the `login` input.
- `tsx watch`: zero-config TypeScript dev server with file watching. No `ts-node` or `nodemon` needed.
- `graphql-tag`: provides the `gql` tagged template literal. Needed when constructing SDL strings if ever required by tooling.

---

### `apps/web/package.json`

```json
{
  "name": "@hamadryad/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@apollo/client": "^3.11.1",
    "graphql": "^16.9.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
```

**Rationale:**
- `@apollo/client` v3: current stable, includes `InMemoryCache`, `ApolloProvider`, hooks, and link utilities (`ApolloLink`, `onError`, `HttpLink`). Works well with React 18.
- `graphql` peer dep: must match the version used by the API.
- `react-router-dom` v6: current major, uses `createBrowserRouter` / `RouterProvider` pattern specified in the plan.
- `zustand` v4: lightweight UI state per the plan's choice. No devDep needed.
- `@vitejs/plugin-react`: enables React Fast Refresh in Vite.
- No `tailwindcss` or `shadcn/ui` yet — those are Sprint 2+ concerns.

---

## 2. `pnpm-workspace.yaml` and Root Config

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
```

This single glob makes `apps/api` and `apps/web` workspace packages. Root scripts use `pnpm --filter api` (matching the `name` field `@hamadryad/api`) and `pnpm --filter web`.

### Root script breakdown

| Script | Command | Effect |
|---|---|---|
| `dev` | `pnpm -r --parallel run dev` | Starts `tsx watch` in api and `vite` in web simultaneously in the same terminal. |
| `codegen` | `graphql-codegen --config codegen.ts` | Runs from the root; reads `codegen.ts` at root; reads the live API schema at `http://localhost:3001/graphql`; writes to `apps/web/src/gql/graphql.ts`. Requires the API to be running. |
| `db:migrate` | `pnpm --filter api exec prisma migrate dev` | Runs Prisma migrate inside the api package context, so it finds `apps/api/prisma/schema.prisma`. |
| `db:migrate:deploy` | `pnpm --filter api exec prisma migrate deploy` | Production migration (no prompts). |
| `seed` | `pnpm --filter api exec tsx prisma/seed.ts` | Runs the seed script via `tsx` without a build step. |

---

## 3. Docker Compose Files

### `docker-compose.yml` (production)

```yaml
version: "3.9"

services:
  db:
    image: postgis/postgis:16-3.4
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: hamadryad
      POSTGRES_USER: hamadryad
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hamadryad -d hamadryad"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://hamadryad:${DB_PASSWORD}@db:5432/hamadryad
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_EXPIRES_IN: 15m
      JWT_REFRESH_EXPIRES_IN: 30d
      UPLOAD_DIR: /uploads
      ALLOW_REGISTRATION: "false"
      CORS_ORIGIN: ${CORS_ORIGIN}
    volumes:
      - uploads:/uploads
    ports:
      - "3001:3001"

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "3000:80"

volumes:
  pgdata:
  uploads:
```

**Notes:**
- `postgis/postgis:16-3.4`: PostgreSQL 16 with PostGIS 3.4. Using a pinned minor version for reproducibility.
- `start_period: 10s` on the healthcheck gives PostgreSQL time to initialize its data directory on first boot before health checks start counting retries.
- Separate `JWT_SECRET` and `JWT_REFRESH_SECRET` so that a leaked access token cannot be used to forge refresh tokens.
- `CORS_ORIGIN` is needed in production because the web app is served from the nginx container on port 3000, not the same origin as the API on 3001.

---

### `docker-compose.dev.yml` (development)

```yaml
version: "3.9"

services:
  db:
    ports:
      - "5432:5432"

  api:
    profiles:
      - disabled

  web:
    profiles:
      - disabled
```

**Usage during development:**

```bash
# Terminal 1 — start DB only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db

# Terminal 2 — API with hot reload
pnpm --filter api dev

# Terminal 3 — Vite dev server
pnpm --filter web dev
```

The `profiles: [disabled]` pattern prevents the api and web services from starting when the dev override is applied. The `db` service override adds port mapping so the local API can connect to it at `localhost:5432`.

---

## 4. `.env.example`

```bash
# .env.example
# Copy to .env and fill in values before running.
# Never commit .env to version control.

# ── Database ─────────────────────────────────────────────────────────────────
# Password for the hamadryad PostgreSQL user.
# Used by Docker Compose to create the user and by DATABASE_URL at runtime.
DB_PASSWORD=changeme

# Full PostgreSQL connection string used by Prisma and the API.
# In Docker Compose, the hostname is "db" (the service name).
# In local dev, the DB runs on localhost:5432 via docker-compose.dev.yml.
DATABASE_URL=postgresql://hamadryad:changeme@localhost:5432/hamadryad

# ── JWT ──────────────────────────────────────────────────────────────────────
# Secret for signing short-lived access tokens (15 min).
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=replace_with_64_byte_random_hex

# Secret for signing long-lived refresh tokens (30 days).
# Must be different from JWT_SECRET.
JWT_REFRESH_SECRET=replace_with_different_64_byte_random_hex

# Access token lifetime (jsonwebtoken expiresIn format).
JWT_EXPIRES_IN=15m

# Refresh token lifetime (jsonwebtoken expiresIn format).
JWT_REFRESH_EXPIRES_IN=30d

# ── Server ────────────────────────────────────────────────────────────────────
# Port the API listens on.
API_PORT=3001

# Allowed CORS origin(s) for the API in production.
# In dev, Vite proxies /graphql so CORS is not an issue.
# In prod, set this to the domain serving the web app (e.g. https://hamadryad.example.com).
CORS_ORIGIN=http://localhost:3000

# ── Registration guard ────────────────────────────────────────────────────────
# Set to "true" to enable the `register` mutation.
# Keep "false" in production; use `pnpm seed` to create users instead.
ALLOW_REGISTRATION=true

# ── Seed ──────────────────────────────────────────────────────────────────────
# Email and password for the admin user created by `pnpm seed`.
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme_admin
SEED_ADMIN_DISPLAY_NAME=Admin
```

---

## 5. Prisma Schema

### `apps/api/prisma/schema.prisma`

```prisma
// Sprint 1: User model only.
// PostGIS extension enabled for future spatial columns.

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

// UUID default via gen_random_uuid() — requires pgcrypto or pg ≥ 13.
// All PKs are UUID strings for consistency with the GraphQL ID scalar.

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique
  displayName  String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

**Notes:**
- `previewFeatures = ["postgresqlExtensions"]`: Required to declare the `extensions` block on the datasource. This is the Prisma-native way to ensure `CREATE EXTENSION IF NOT EXISTS postgis` is applied during `prisma migrate dev`.
- `gen_random_uuid()`: Built into PostgreSQL 13+. Returns a v4 UUID. No extension needed on modern Postgres.
- `@db.Uuid`: Tells Prisma to use the `uuid` column type, not `text`.
- `@@map("users")`: Uses lowercase table name for PostgreSQL convention.
- `@updatedAt`: Prisma automatically sets this field on every update.
- Sprint 1 only needs `User`. All other models from the plan's schema are added in subsequent sprints.

---

## 6. `apps/api` — File-by-File

### `apps/api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "experimentalDecorators": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Notes:**
- `target: ES2022` and `module: CommonJS`: Node.js 20 supports ES2022 features; CommonJS is the safe default for Node without `"type": "module"` in package.json.
- `strict: true`: Catches null-safety issues early, especially important for JWT claims and Prisma results.
- `prisma/seed.ts` is excluded from the `tsc` build (`include` only covers `src`) but `tsx` runs it directly.

---

### `apps/api/src/lib/prisma.ts`

This is the Prisma client singleton. Node.js module caching means this file is only evaluated once per process, so the client is not instantiated multiple times.

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Why `globalThis` assignment:** In development, `tsx watch` reloads modules on file change but does not restart the process. Without the `globalThis` trick, each reload creates a new `PrismaClient` instance, eventually exhausting the connection pool. In production this path is never taken.

---

### `apps/api/src/lib/auth.ts`

Provides four exports: `hashPassword`, `verifyPassword`, `signAccessToken`, `signRefreshToken`, and `verifyToken`. Types are defined here for reuse in context and mutations.

```typescript
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = 12;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;   // User.id
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

// ── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// ── JWT ──────────────────────────────────────────────────────────────────────

function getSecret(key: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable ${key} is not set`);
  return value;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    getSecret("JWT_SECRET"),
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" }
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    getSecret("JWT_REFRESH_SECRET"),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d" }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, getSecret("JWT_SECRET")) as AccessTokenPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, getSecret("JWT_REFRESH_SECRET")) as RefreshTokenPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}
```

**Notes:**
- `BCRYPT_ROUNDS = 12`: Recommended minimum for 2024. Each additional round doubles the cost; 12 is ~250ms on a typical server.
- Separate secrets for access and refresh tokens: a leaked access token cannot mint new refresh tokens.
- The `type` discriminator in the payload prevents a refresh token from being used as an access token (they share the same JWT structure).

---

### `apps/api/src/context.ts`

This file exports the `createContext` function passed to `expressMiddleware` and the `GraphQLContext` type used throughout schema resolvers.

```typescript
import type { Request, Response } from "express";
import { prisma } from "./lib/prisma.js";
import { verifyAccessToken } from "./lib/auth.js";

export interface GraphQLContext {
  req: Request;
  res: Response;
  user: {
    id: string;
    email: string;
    displayName: string;
  } | null;
  prisma: typeof prisma;
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
      // Verify the user still exists in the database.
      // This check is inexpensive because it hits the primary key index.
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, displayName: true },
      });
      if (dbUser) {
        user = dbUser;
      }
    } catch {
      // Invalid or expired token — context user stays null.
      // The query/mutation resolvers enforce auth via scope-auth.
    }
  }

  return { req, res, user, prisma };
}
```

**Notes:**
- The DB lookup on every request is intentional: it allows instant user lockout by deleting the row without waiting for the token to expire. For a small private app this is preferable to pure stateless JWT.
- The `user` shape in context is a small projection, not the full Prisma model. This avoids accidentally exposing `passwordHash` in resolvers.
- `prisma` is attached to context so resolvers can use `ctx.prisma` — this makes the context the single dependency injection point, which simplifies testing later.

---

### `apps/api/src/schema/builder.ts`

The Pothos `SchemaBuilder` instance. Every schema file imports this and calls methods on it to register types, queries, and mutations.

```typescript
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import type { PrismaClient } from "@prisma/client";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import type { GraphQLContext } from "../context.js";

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  PrismaTypes: PrismaTypes;
  AuthScopes: {
    authenticated: boolean;
  };
  DefaultFieldNullability: false;
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin],
  scopeAuth: {
    // Determines auth scope values from context.
    // Called once per request, result is cached.
    authScopes: async (ctx) => ({
      authenticated: ctx.user !== null,
    }),
    // Throw a GraphQL error (not null) when a scope check fails.
    unauthorizedError: (parent, args, ctx, info) =>
      new Error(`Not authenticated: ${info.fieldName}`),
  },
  prisma: {
    client: (ctx) => ctx.prisma,
    // Exposes all Prisma enums in the builder.
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },
});
```

**Notes:**
- `DefaultFieldNullability: false`: Pothos fields are non-null by default, matching the plan's schema design. Nullable fields must explicitly set `nullable: true`.
- `AuthScopes` has only `authenticated` in Sprint 1. Later sprints add scopes like `homeOwner`.
- `ScopeAuthPlugin` must be listed before `PrismaPlugin` in the `plugins` array; scope-auth wraps field resolvers before Prisma handles them.
- `client: (ctx) => ctx.prisma`: Returns the Prisma client from context, not the global singleton directly. This allows test code to inject a mock Prisma client via the context.

**Prisma types generation:** After running `prisma generate`, Pothos needs the type map. Add this to `apps/api/package.json` under the `prisma` key to auto-generate the Pothos type map:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

The `@pothos/plugin-prisma` package generates its type map automatically when `prisma generate` runs, outputting to `node_modules/@pothos/plugin-prisma/generated.d.ts`. No extra configuration is needed.

---

### `apps/api/src/schema/scalars.ts`

Registers `DateTime`, `Date`, and `JSON` scalars using `graphql-scalars`.

```typescript
import { DateTimeResolver, DateResolver, JSONResolver } from "graphql-scalars";
import { builder } from "./builder.js";

// DateTime: ISO 8601 string with time and timezone (e.g. "2024-05-10T14:30:00.000Z")
// Used for createdAt, updatedAt fields.
builder.addScalarType("DateTime", DateTimeResolver, {});

// Date: ISO 8601 date string without time (e.g. "2024-05-10")
// Used for datePurchased, datePlanted, takenAt fields.
builder.addScalarType("Date", DateResolver, {});

// JSON: arbitrary JSON value (object, array, string, number, boolean, null)
// Used for GeoJSON geometry blobs and featureCollection fields.
builder.addScalarType("JSON", JSONResolver, {});
```

---

### `apps/api/src/schema/types/user.ts`

Defines the `User` Pothos type backed by the Prisma `User` model.

```typescript
import { builder } from "../builder.js";

builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    displayName: t.exposeString("displayName"),
    // passwordHash is intentionally not exposed.
  }),
});
```

**Notes:**
- `builder.prismaObject` creates a Pothos type that is backed by the Prisma `User` model. The Prisma plugin generates the TypeScript connection between them.
- `passwordHash` is never exposed — it is not listed. Pothos only exposes fields that are explicitly declared.
- No `authScope` on the `User` type itself in Sprint 1 — the `me` query resolver controls access, and login/register return the user as part of the `AuthPayload` type.

---

### `apps/api/src/schema/types/auth.ts`

Defines the `AuthPayload` object type returned by `login` and `register` mutations.

```typescript
import { builder } from "../builder.js";

// This type is not backed by a Prisma model — it is a plain Pothos object.
// It carries the access token and the authenticated user.
builder.objectType("AuthPayload", {
  description: "Returned by login and register mutations.",
  fields: (t) => ({
    token: t.string({ resolve: (parent) => parent.token }),
    user: t.field({
      type: "User",
      resolve: (parent) => parent.user,
    }),
  }),
});

// Export the type reference so mutations can reference it.
export const AuthPayloadRef = builder.objectRef<{
  token: string;
  user: { id: string; email: string; displayName: string };
}>("AuthPayload");
```

**Note:** In Pothos, `builder.objectType("AuthPayload", ...)` and `builder.objectRef("AuthPayload")` must be reconciled. The correct pattern is to create the ref first, then use `builder.objectType` to implement it. Here is the corrected pattern:

```typescript
import { builder } from "../builder.js";

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
```

---

### `apps/api/src/schema/queries/me.ts`

The `me` query: returns the authenticated user from context or null.

```typescript
import { builder } from "../builder.js";

builder.queryField("me", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    description: "Returns the currently authenticated user, or null.",
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.user) return null;
      return ctx.prisma.user.findUnique({
        ...query,
        where: { id: ctx.user.id },
      });
    },
  })
);
```

**Notes:**
- `nullable: true` overrides the `DefaultFieldNullability: false` setting because unauthenticated requests legitimately return null.
- `...query`: The Prisma plugin injects a `query` argument containing `select` and `include` derived from the GraphQL selection set. Spreading it into `findUnique` enables the Prisma plugin to eliminate N+1 fetches automatically.
- No `authScope` here: `me` is intentionally public — it returns null rather than throwing for unauthenticated callers.

---

### `apps/api/src/schema/mutations/auth.ts`

Login and register mutations.

```typescript
import { builder } from "../builder.js";
import { AuthPayloadRef } from "../types/auth.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from "../../lib/auth.js";
import { GraphQLError } from "graphql";
import { z } from "zod";

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

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(100),
});

// Helper to set the httpOnly refresh token cookie on the response.
function setRefreshCookie(res: import("express").Response, refreshToken: string): void {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
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
        throw new GraphQLError("Invalid input", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true, displayName: true, passwordHash: true },
      });

      // Use a constant-time comparison even when user is not found
      // to prevent email enumeration via timing attacks.
      const passwordHash = user?.passwordHash ?? "$2a$12$invalidhashpadding.............";
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

      const passwordHash = await hashPassword(parsed.data.password);

      const user = await ctx.prisma.user.create({
        data: {
          email: parsed.data.email,
          displayName: parsed.data.displayName,
          passwordHash,
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
```

**Security notes:**
- The timing-attack mitigation on login: when the user is not found, a dummy hash is still passed to `bcrypt.compare`. This ensures the response time is the same whether the email exists or not, preventing email enumeration by measuring response latency.
- `ALLOW_REGISTRATION` check is the first thing done in `register` — no DB queries if the guard is off.
- Refresh cookie `path: "/auth/refresh"` scopes the cookie so it is only sent to that one endpoint, reducing its exposure surface.

---

### `apps/api/src/schema/index.ts`

Assembles the schema by importing all type/query/mutation files (as a side effect — each file calls builder methods) and calling `builder.toSchema()`.

```typescript
// Import scalars first — other types depend on them.
import "./scalars.js";

// Import types — must be imported before queries/mutations that reference them.
import "./types/user.js";
import "./types/auth.js";

// Import queries
import "./queries/me.js";

// Import mutations
import "./mutations/auth.js";

// Initialize Query and Mutation root types.
// Pothos requires at least one field on each root type before toSchema() is called.
// These are called before the field imports above — but because JavaScript module
// evaluation is synchronous and ordered, the builder has already had fields registered
// by the time toSchema() is called here.
import { builder } from "./builder.js";

// builder.queryType() and builder.mutationType() must be called before adding fields
// if no fields are added via queryField/mutationField. Since we use queryField and
// mutationField, we still need to declare the root types.
builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });

export const schema = builder.toSchema();
```

**Important Pothos ordering note:** In Pothos, `builder.queryType()` and `builder.mutationType()` must be called before `builder.toSchema()`. However, `builder.queryField()` and `builder.mutationField()` (used in me.ts and auth.ts) require the root types to already exist. The correct ordering is:

1. Call `builder.queryType()` and `builder.mutationType()` in `index.ts` before importing the query/mutation files.
2. Then import the query/mutation files.

Revise `schema/index.ts` to this structure:

```typescript
import { builder } from "./builder.js";

// Declare root types FIRST before any field registrations.
builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });

// Now import scalars, types, queries, mutations.
import "./scalars.js";
import "./types/user.js";
import "./types/auth.js";
import "./queries/me.js";
import "./mutations/auth.js";

export const schema = builder.toSchema();
```

**Note:** ES module static imports are hoisted and evaluated before any code in the module body. This means the `import` statements above will all execute before the `builder.queryType()` call, which is a problem. Use `require()` or restructure. The correct approach for CommonJS (which this project uses per tsconfig) is:

```typescript
// schema/index.ts
import { builder } from "./builder.js";

// Declare root types first.
builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });

// Register scalars, types, queries, mutations via require to control order.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("./scalars");
require("./types/user");
require("./types/auth");
require("./queries/me");
require("./mutations/auth");

export const schema = builder.toSchema();
```

With `module: CommonJS` in tsconfig, TypeScript compiles `import` to `require`. But since imports are still hoisted by the TypeScript compiler, the safest pattern is to have the builder and root type declarations in `builder.ts` itself, and use a separate `initSchema.ts` that is `require`d. Alternatively, declare `queryType` and `mutationType` in `builder.ts`:

**Revised `builder.ts` addition** — add at the bottom:

```typescript
// Declare root types on the builder singleton so they exist before any
// queryField/mutationField calls in other modules.
builder.queryType({ description: "Root query type" });
builder.mutationType({ description: "Root mutation type" });
```

And simplify `schema/index.ts` to:

```typescript
import "./scalars.js";
import "./types/user.js";
import "./types/auth.js";
import "./queries/me.js";
import "./mutations/auth.js";
import { builder } from "./builder.js";

export const schema = builder.toSchema();
```

This works because `builder.ts` is imported first (it is the dependency of all other files), so `queryType` and `mutationType` are called before any `queryField`/`mutationField` calls that happen during module evaluation of the imported files.

---

### `apps/api/src/index.ts`

The Express entry point. Sets up middleware, Apollo Server, and REST endpoints.

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./schema/index.js";
import { createContext } from "./context.js";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";

const PORT = parseInt(process.env.API_PORT ?? "3001", 10);
const IS_DEV = process.env.NODE_ENV !== "production";

async function main() {
  const app = express();

  // ── Security middleware ───────────────────────────────────────────────────
  app.use(
    helmet({
      // Apollo sandbox/explorer needs these relaxed in dev.
      crossOriginEmbedderPolicy: !IS_DEV,
      contentSecurityPolicy: IS_DEV ? false : undefined,
    })
  );

  app.use(
    cors({
      origin: IS_DEV ? "http://localhost:5173" : process.env.CORS_ORIGIN,
      credentials: true, // Required for httpOnly cookie on /auth/refresh
    })
  );

  app.use(cookieParser());
  app.use(express.json());

  // ── REST endpoint: refresh token ──────────────────────────────────────────
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

      // Rotate the refresh token on every use.
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

  // ── Apollo Server ─────────────────────────────────────────────────────────
  const server = new ApolloServer({
    schema,
    introspection: true, // Enabled in all envs for Sprint 1; restrict in Sprint 9.
    // Apollo Server 4 does not include a landing page plugin by default in production.
    // In dev, Apollo Sandbox is available at the /graphql endpoint.
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // ── Health check ──────────────────────────────────────────────────────────
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
```

**Notes:**
- `helmet` CSP is disabled in dev to allow Apollo Sandbox to load its CDN resources.
- CORS `credentials: true` is required for the browser to send the `httpOnly` cookie to `/auth/refresh`.
- `introspection: true` in all environments for Sprint 1 — codegen needs introspection. Sprint 9 restricts this to development.
- `server.start()` must be called before `expressMiddleware` is used — this is an Apollo Server 4 requirement.
- The refresh token is rotated on every use (a new one is issued and the old one implicitly expires). This is standard refresh token rotation practice; without a token store, true one-time-use cannot be enforced, but the rotation still limits the window of reuse.

---

### `apps/api/prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in the environment. " +
        "Copy .env.example to .env and fill them in."
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user already exists: ${email} — skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, displayName, passwordHash },
  });

  console.log(`Created admin user: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Notes:**
- Uses a fresh `PrismaClient` instead of the singleton. The seed script is a one-shot CLI process; the singleton's `globalThis` pattern is only relevant for long-running server processes.
- Idempotent: if the user already exists, it skips creation rather than throwing. This allows `pnpm seed` to be re-run safely.
- Reads credentials from environment variables so the seed command works in both local dev (`.env` file) and CI/CD (environment variables injected by the pipeline).
- `.finally` ensures the Prisma connection is closed even on error.

---

### `apps/api/Dockerfile`

Multi-stage build: `builder` stage compiles TypeScript, `runner` stage copies only the compiled output.

```dockerfile
# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config files needed for pnpm to resolve the workspace.
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install only production + dev dependencies for the api workspace.
# --frozen-lockfile ensures reproducibility.
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter @hamadryad/api...

# Copy source
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter api exec prisma generate

# Compile TypeScript
RUN pnpm --filter api run build

# Prune devDependencies for the runner stage
RUN pnpm --filter api deploy --prod /prod/api

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy pruned node_modules + compiled dist
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist

# Copy Prisma schema and migrations (needed at runtime for prisma migrate deploy)
COPY --from=builder /app/apps/api/prisma ./prisma

# Copy generated Prisma client (embedded in node_modules, but prisma generate output may differ)
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma

# Runtime environment
ENV NODE_ENV=production
ENV API_PORT=3001

USER appuser

EXPOSE 3001

# Run migrations then start the server.
# In production, `prisma migrate deploy` applies pending migrations without prompting.
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy && node dist/index.js"]
```

**Notes:**
- `corepack enable` installs pnpm without a separate download step.
- `pnpm deploy --prod /prod/api`: The `pnpm deploy` command creates a standalone directory with only production dependencies, ready to be copied into the runner stage.
- The runner uses a non-root user (`appuser`) — security best practice.
- `prisma migrate deploy` in CMD: ensures the DB schema is up to date on container start. This is safe because `migrate deploy` is idempotent — it only applies unapplied migrations.
- The `.prisma` directory in `node_modules/.prisma` contains the compiled Prisma query engine binary. It must be copied from the builder stage because the pruned `node_modules` from `pnpm deploy` may not include it.

---

## 7. `apps/web` — File-by-File

### `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Also create `apps/web/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Notes:**
- `moduleResolution: "bundler"`: The correct setting for Vite + TypeScript. It understands Vite's resolution rules (extensionless imports, etc.).
- `noEmit: true`: Vite handles bundling; `tsc` is only used for type checking.
- `jsx: "react-jsx"`: Uses the automatic JSX transform (no need to import React in every file).

---

### `apps/web/index.html`

The Vite entry HTML. The `id="root"` div is the React mount point.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hamadryad</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### `apps/web/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy GraphQL requests to the API dev server.
      // This eliminates CORS issues in development — the browser sees all requests
      // going to the same origin (localhost:5173).
      "/graphql": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Proxy the auth/refresh REST endpoint.
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Proxy future file upload endpoint.
      "/upload": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Proxy future static file serving endpoint.
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

---

### `apps/web/src/stores/authStore.ts`

Zustand store for authentication state. The access token is kept in memory only — not in `localStorage`, not in a cookie — to prevent XSS attacks from reading it.

```typescript
import { create } from "zustand";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => set({ token, user }),

  clearAuth: () => set({ token: null, user: null }),
}));
```

**Notes:**
- No `persist` middleware: the token lives only in memory. When the tab is refreshed, the token is gone and `ProtectedRoute` triggers a `/auth/refresh` call to get a new one from the `httpOnly` cookie.
- The `user` object mirrors the subset returned by the API (`id`, `email`, `displayName`). This is populated on login and on successful refresh, so the app knows who is logged in without an extra `me` query on startup.

---

### `apps/web/src/apollo.ts`

Apollo Client instance. The `authLink` reads the token from Zustand on every request. The `errorLink` handles 401 errors by refreshing the token and retrying.

```typescript
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "./stores/authStore";

// ── Auth link: attach Bearer token to every request ──────────────────────────

const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

// ── Error link: refresh token on 401, then retry ─────────────────────────────

const errorLink = onError(({ networkError, operation, forward }) => {
  // networkError.statusCode is available on ServerParseError / ServerError from Apollo.
  if (
    networkError &&
    "statusCode" in networkError &&
    networkError.statusCode === 401
  ) {
    // Attempt to refresh the access token.
    return new (require("@apollo/client/utilities").Observable)(
      (observer: import("zen-observable-ts").Observer<import("@apollo/client").FetchResult>) => {
        fetch("/auth/refresh", { method: "POST", credentials: "include" })
          .then((res) => {
            if (!res.ok) throw new Error("Refresh failed");
            return res.json() as Promise<{ token: string }>;
          })
          .then(({ token }) => {
            // Update the store with the new token.
            // We don't have the user object here, so we preserve the existing user.
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              useAuthStore.getState().setAuth(token, currentUser);
            }

            // Retry the failed operation with the new token.
            operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
              headers: { ...headers, authorization: `Bearer ${token}` },
            }));

            const subscriber = {
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            };
            forward(operation).subscribe(subscriber);
          })
          .catch(() => {
            // Refresh failed — clear auth and let the app redirect to login.
            useAuthStore.getState().clearAuth();
            observer.error(networkError);
          });
      }
    );
  }
});

// ── HTTP link: relative URL works in both dev (Vite proxy) and prod ───────────

const httpLink = new HttpLink({
  uri: "/graphql",
  credentials: "include", // Include cookies (for future use; token is in header)
});

// ── Client ────────────────────────────────────────────────────────────────────

export const apolloClient = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enables Apollo DevTools in the browser extension.
});
```

**Notes:**
- `useAuthStore.getState()` is called outside of a React component — this is a valid Zustand pattern for accessing state imperatively in non-component code.
- `credentials: "include"` on `HttpLink`: tells the browser to include cookies. Needed for the `httpOnly` refresh cookie to be sent to `/auth/refresh`. For the GraphQL endpoint itself, the token is in the header; the cookie is irrelevant.
- The `Observable`-based retry pattern is the standard Apollo error link pattern for async retries. The `require` of `@apollo/client/utilities` is avoided in the final version — use `new Observable` from `zen-observable-ts` directly, which `@apollo/client` re-exports:

Replace the Observable construction with:

```typescript
import { Observable } from "@apollo/client";
// ...
return new Observable((observer) => { ... });
```

---

### `apps/web/src/gql/` — Sprint 1 Hand-Written Stub

`codegen` populates `apps/web/src/gql/graphql.ts` after the API is running. For Sprint 1, before codegen has been run, a minimal hand-written stub must exist so the app compiles and TypeScript is satisfied.

Create `apps/web/src/gql/graphql.ts` with:

```typescript
// THIS FILE IS AUTO-GENERATED BY GRAPHQL CODE GENERATOR.
// After the API is running, regenerate with: pnpm codegen
// Do not edit this file by hand after codegen has run.
//
// Sprint 1 hand-written stub: provides just enough types and hooks
// for Login.tsx to compile before the first codegen run.

import { gql } from "@apollo/client";
import type { MutationHookOptions } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client";

// ── Generated Types (stub) ────────────────────────────────────────────────────

export type Maybe<T> = T | null;
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: string; output: string };
};

export interface User {
  __typename?: "User";
  id: Scalars["ID"]["output"];
  email: Scalars["String"]["output"];
  displayName: Scalars["String"]["output"];
}

export interface AuthPayload {
  __typename?: "AuthPayload";
  token: Scalars["String"]["output"];
  user: User;
}

export interface LoginInput {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
}

export interface LoginMutation {
  __typename?: "Mutation";
  login: AuthPayload;
}

export interface LoginMutationVariables {
  input: LoginInput;
}

export interface MeQuery {
  __typename?: "Query";
  me: Maybe<User>;
}

// ── Operations ────────────────────────────────────────────────────────────────

export const LoginDocument = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        displayName
      }
    }
  }
`;

export const MeDocument = gql`
  query Me {
    me {
      id
      email
      displayName
    }
  }
`;

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLoginMutation(
  options?: MutationHookOptions<LoginMutation, LoginMutationVariables>
) {
  return useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
}

export function useMeQuery() {
  return useQuery<MeQuery>(MeDocument);
}
```

Also create `apps/web/src/gql/index.ts`:

```typescript
export * from "./graphql";
```

**Note:** Once `pnpm codegen` has been run for the first time against the live API, this stub is replaced by the generated file. The stub's type shapes match exactly what codegen will generate, so no component code needs to change after the first codegen run.

---

### `apps/web/src/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router-dom";
import { apolloClient } from "./apollo";
import { router } from "./router";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in index.html");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </React.StrictMode>
);
```

---

### `apps/web/src/router.tsx`

```typescript
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Homes } from "./pages/Homes";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/homes" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/homes",
    element: (
      <ProtectedRoute>
        <Homes />
      </ProtectedRoute>
    ),
  },
]);
```

---

### `apps/web/src/components/layout/ProtectedRoute.tsx`

This component checks the Zustand `authStore` for a token. If none is present, it attempts to restore the session by calling `/auth/refresh`. If that succeeds, the user is stored and the children render. If it fails, the user is redirected to `/login`.

```typescript
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthState = "checking" | "authenticated" | "unauthenticated";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, setAuth } = useAuthStore();
  const [authState, setAuthState] = useState<AuthState>(
    token ? "authenticated" : "checking"
  );

  useEffect(() => {
    // If we already have a token in memory, no need to refresh.
    if (token) {
      setAuthState("authenticated");
      return;
    }

    // No token in memory — try to restore the session using the httpOnly cookie.
    let cancelled = false;

    fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        const { token: newToken } = (await res.json()) as { token: string };

        // We have a new access token but not the user object.
        // Call the me query to get user details.
        // This is a direct fetch rather than an Apollo call to avoid circular
        // dependency between ProtectedRoute → apolloClient → authStore.
        const meRes = await fetch("/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({ query: "{ me { id email displayName } }" }),
        });

        const meData = (await meRes.json()) as {
          data?: { me: { id: string; email: string; displayName: string } | null };
        };

        if (cancelled) return;

        const me = meData.data?.me;
        if (!me) {
          setAuthState("unauthenticated");
          return;
        }

        setAuth(newToken, me);
        setAuthState("authenticated");
      })
      .catch(() => {
        if (!cancelled) setAuthState("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (authState === "checking") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**Notes:**
- The `cancelled` flag prevents state updates on unmounted components (React will warn otherwise).
- The `me` fetch uses a direct `fetch` call (not `useMeQuery` from Apollo) to avoid a circular dependency: Apollo's `apolloClient` is constructed with the `authStore`, and `ProtectedRoute` already imports `authStore`. Using Apollo here would require importing `apolloClient`, creating a circular module reference. A direct fetch sidesteps this.
- The loading state shows a simple "Loading..." to prevent a flash of the login page while the refresh is in flight.

---

### `apps/web/src/pages/Login.tsx`

```typescript
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useLoginMutation } from "../gql/graphql";

export function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [login, { loading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({
        variables: { input: { email, password } },
      });

      const payload = result.data?.login;
      if (!payload) {
        setError("Login failed. Please try again.");
        return;
      }

      setAuth(payload.token, payload.user);
      navigate("/homes", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Hamadryad</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px", width: "300px" }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "10px" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
```

**Notes:**
- Inline styles only — no Tailwind or shadcn yet. Sprint 2 adds the UI framework.
- The form uses `autoComplete` attributes for browser password manager support.
- Error handling catches both network errors (thrown by Apollo) and GraphQL errors (which Apollo throws when `graphQLErrors` is present in the response).

---

### `apps/web/src/pages/Homes.tsx`

Sprint 1 placeholder. Confirms that the user is authenticated and the `displayName` is available from the store.

```typescript
import { useAuthStore } from "../stores/authStore";

export function Homes() {
  const { user } = useAuthStore();

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Welcome, {user?.displayName ?? "..."}</h1>
      <p>Homes list coming in Sprint 2.</p>
    </div>
  );
}
```

---

### `apps/web/Dockerfile`

Multi-stage: Node build stage compiles the Vite app; nginx runner serves the static files with SPA routing support.

```dockerfile
# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/

COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter @hamadryad/web...

COPY apps/web ./apps/web

RUN pnpm --filter web run build

# ── Stage 2: nginx runner ─────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA routing
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Also create `apps/web/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Serve static assets with long cache headers.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback: for any path that doesn't match a real file,
    # serve index.html and let React Router handle routing client-side.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression for text responses.
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1000;
}
```

**Notes:**
- `try_files $uri $uri/ /index.html`: The critical SPA routing line. Without it, refreshing `/homes` returns a 404 because nginx tries to find a file at that path.
- `/assets/` gets `immutable` cache headers because Vite generates content-hashed filenames — the URL changes when the file changes, so aggressive caching is safe.
- The Vite build creates `/assets/` for hashed JS/CSS; other paths like `/vite.svg` are served directly.

---

## 8. `codegen.ts` at Repo Root

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // Read the schema from the running API server via introspection.
  // The API must be running on port 3001 before running pnpm codegen.
  schema: "http://localhost:3001/graphql",

  // Find all GraphQL operation files (queries, mutations, fragments)
  // co-located with their components.
  documents: ["apps/web/src/**/*.graphql"],

  generates: {
    // All generated output goes to a single file.
    "apps/web/src/gql/graphql.ts": {
      plugins: [
        // 1. typescript: generates TypeScript types for all schema types,
        //    enums, scalars, and input types.
        "typescript",
        // 2. typescript-operations: generates TypeScript types for each
        //    specific operation defined in .graphql files.
        "typescript-operations",
        // 3. typescript-react-apollo: generates typed React hooks
        //    (useXxxQuery, useXxxMutation, useXxxLazyQuery) for each operation.
        "typescript-react-apollo",
      ],
      config: {
        // Use "input" suffix for input types to avoid naming collisions.
        // e.g., LoginInput stays as LoginInput.
        withHooks: true,

        // Apollo Client 3 compatible output.
        apolloClientVersion: 3,

        // Scalar type mappings: map GraphQL scalars to TypeScript types.
        scalars: {
          DateTime: "string",   // ISO 8601 datetime string
          Date: "string",       // ISO 8601 date string
          JSON: "unknown",      // Arbitrary JSON — use unknown, not any
          ID: "string",
        },

        // Generate all enum types as TypeScript string unions instead of
        // TypeScript enums. String unions are more ergonomic and avoid
        // the issues with TypeScript enum tree-shaking.
        enumsAsTypes: true,

        // Prefix generated types with the operation name to avoid collisions.
        // e.g., LoginMutation, LoginMutationVariables
        dedupeFragments: true,

        // Skip generating __typename fields on types by default.
        // Components that need __typename can add it to their query.
        skipTypename: false,
        nonOptionalTypename: false,
      },
    },
  },

  // Silence the "overwriting file" warning since this file is committed.
  ignoreNoDocuments: false,
};

export default config;
```

**Notes:**
- `schema: "http://localhost:3001/graphql"` uses introspection. The API must be running. An alternative (for CI without a running API) is to output `printSchema(schema)` from the API to a `.graphql` file and point codegen at that file — but that adds a build step. For Sprint 1 with a single developer, the introspection approach is simpler.
- `enumsAsTypes: true`: Generates `type Sunlight = "FULL_SUN" | "PART_SHADE" | "FULL_SHADE"` instead of TypeScript enums. This is easier to use with Zod schemas and avoids the TypeScript enum-related tree-shaking pitfalls.
- `scalars.JSON: "unknown"`: Using `unknown` instead of `any` maintains type safety — components that receive a JSON field must narrow the type before using it.
- `ignoreNoDocuments: false`: If no `.graphql` files are found (e.g., in Sprint 1 before any are written), codegen still runs and generates the schema types. The operation types come from `.graphql` files added in later sprints.

---

## 9. `.gitignore`

```gitignore
# ── Dependencies ──────────────────────────────────────────────────────────────
node_modules/
.pnpm-store/

# ── Environment variables ─────────────────────────────────────────────────────
# Never commit .env — it contains secrets.
# Commit .env.example with placeholder values.
.env
.env.local
.env.*.local

# ── Build outputs ─────────────────────────────────────────────────────────────
dist/
build/
out/

# ── Generated files ───────────────────────────────────────────────────────────
# GraphQL Code Generator output — commit this so the frontend can compile
# without a running API, but regenerate with `pnpm codegen` after schema changes.
# Uncomment the line below to ignore it instead (not recommended for this project):
# apps/web/src/gql/graphql.ts

# Prisma generates a query engine binary at runtime — do not commit.
apps/api/node_modules/.prisma/

# ── TypeScript ────────────────────────────────────────────────────────────────
*.tsbuildinfo
*.d.ts.map

# ── Logs ─────────────────────────────────────────────────────────────────────
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# ── OS / IDE ──────────────────────────────────────────────────────────────────
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
.idea/
.vscode/
!.vscode/extensions.json
!.vscode/settings.json

# ── Docker ────────────────────────────────────────────────────────────────────
# Do not ignore docker-compose files — they are configuration, not generated.

# ── Uploads ───────────────────────────────────────────────────────────────────
# Local file uploads during development.
uploads/
```

**Notes on committed vs. gitignored generated files:**
- `apps/web/src/gql/graphql.ts` is committed. This allows the frontend to compile and run without a running API. The comment in `.gitignore` explains the reasoning and how to change this policy if desired.
- The Prisma query engine binary (`.prisma/` in `node_modules`) is NOT committed — it is OS-specific and regenerated by `prisma generate`.

---

## 10. Execution Order — Zero to Done

These are the exact commands to run in sequence to go from a fresh clone of the repository (with all files created above) to the Sprint 1 "done when" state.

**Prerequisites:**
- Docker Desktop running
- Node.js 20 installed
- pnpm 9 installed (`npm install -g pnpm@9`)

---

**Step 1: Install all workspace dependencies**

```bash
pnpm install
```

Run from the repo root. pnpm reads `pnpm-workspace.yaml`, resolves all dependencies for `apps/api` and `apps/web`, and installs them. A single `pnpm-lock.yaml` is created or updated at the root.

---

**Step 2: Copy `.env.example` to `.env` and fill in values**

```bash
cp .env.example .env
```

Then open `.env` and set:
- `DB_PASSWORD`: any strong password (e.g., `hamadryad_dev_pw`)
- `DATABASE_URL`: `postgresql://hamadryad:hamadryad_dev_pw@localhost:5432/hamadryad`
- `JWT_SECRET`: generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_REFRESH_SECRET`: generate another random hex with the same command
- `SEED_ADMIN_EMAIL`: your email
- `SEED_ADMIN_PASSWORD`: a password you will use to log in
- `ALLOW_REGISTRATION`: `true` (so register mutation works in dev; seed still preferred)

---

**Step 3: Start the database**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d
```

This starts only the `db` service (the dev override disables `api` and `web` services). The `-d` flag runs it in the background. The DB is now available at `localhost:5432`.

Wait about 5 seconds for PostgreSQL to initialize, then verify it is healthy:

```bash
docker compose ps
```

The `db` service should show `healthy`.

---

**Step 4: Run the initial Prisma migration**

```bash
pnpm db:migrate
```

This runs `prisma migrate dev` inside `apps/api`. Prisma:
1. Detects that there are no existing migrations.
2. Generates a new migration file in `apps/api/prisma/migrations/`.
3. Applies the migration to the database (creates the `users` table and enables the `postgis` extension).
4. Generates the Prisma client (`@prisma/client`) with TypeScript types for the `User` model.

When prompted for a migration name, enter: `init_user`

---

**Step 5: Seed the database**

```bash
pnpm seed
```

This runs `apps/api/prisma/seed.ts` via `tsx`. It reads `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_DISPLAY_NAME` from `.env` and creates the admin user with a bcrypt-hashed password.

Expected output:
```
Created admin user: admin@example.com (id: <uuid>)
```

---

**Step 6: Start the API and web dev servers**

Open two separate terminals (or use a terminal multiplexer):

```bash
# Terminal 1: API with hot reload
pnpm --filter api dev
```

Expected output:
```
API listening on http://localhost:3001
GraphQL endpoint: http://localhost:3001/graphql
```

```bash
# Terminal 2: Vite dev server
pnpm --filter web dev
```

Expected output:
```
  VITE v5.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Or, if you prefer running both concurrently in one terminal:

```bash
pnpm dev
```

This runs `pnpm -r --parallel run dev` which starts both in parallel. Both outputs interleave in the terminal.

---

**Step 7: Run GraphQL Code Generator**

The API must be running on port 3001 for this step.

```bash
pnpm codegen
```

This connects to `http://localhost:3001/graphql`, introspects the schema, finds any `.graphql` operation files in `apps/web/src/`, and writes the generated types and hooks to `apps/web/src/gql/graphql.ts`.

For Sprint 1, there are no `.graphql` operation files yet (the stub in `apps/web/src/gql/graphql.ts` is hand-written). After running codegen, the stub is replaced by the generated file. Verify that the generated file contains `useLoginMutation` and `useMeQuery` hooks.

**Note:** If Vite HMR is running and codegen replaces `apps/web/src/gql/graphql.ts`, Vite will pick up the change automatically.

---

**Step 8: Verify the "done when" conditions**

Open a browser and navigate to `http://localhost:5173`.

1. The browser redirects to `/login` (the ProtectedRoute sees no token and no valid refresh cookie).
2. Enter the `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `.env`.
3. On successful login, the browser redirects to `/homes` and shows "Welcome, [displayName]".

To verify via Apollo DevTools:
1. Install the Apollo Client Devtools browser extension (Chrome or Firefox).
2. Open DevTools and go to the Apollo tab.
3. In the Explorer panel, run:
   ```graphql
   query {
     me {
       id
       email
       displayName
     }
   }
   ```
4. The response should return the seeded user's details. This confirms:
   - The JWT is being sent as a header by `authLink`.
   - The API is decoding the JWT in `createContext`.
   - The `me` resolver is returning the user from the database.

---

**Step 9: Verify Docker Compose full-stack build (optional, confirms "deployable via Docker Compose")**

Stop the local dev servers (Ctrl+C in both terminals). Then:

```bash
docker compose down  # Stop the db container
docker compose up --build
```

This builds all three Docker images (`db`, `api`, `web`) and starts them. Access the app at `http://localhost:3000`.

The API container will run `prisma migrate deploy` on startup (the seed is not run automatically in prod — use `docker compose exec api node node_modules/.bin/tsx prisma/seed.ts` to seed manually).

---

## Summary of Files to Create

For reference, every file that needs to be created for Sprint 1:

```
hamadryad/
├── .gitignore
├── .env.example
├── pnpm-workspace.yaml
├── package.json
├── codegen.ts
├── docker-compose.yml
├── docker-compose.dev.yml
│
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── context.ts
│   │       ├── lib/
│   │       │   ├── auth.ts
│   │       │   └── prisma.ts
│   │       └── schema/
│   │           ├── builder.ts
│   │           ├── index.ts
│   │           ├── scalars.ts
│   │           ├── types/
│   │           │   ├── user.ts
│   │           │   └── auth.ts
│   │           ├── queries/
│   │           │   └── me.ts
│   │           └── mutations/
│   │               └── auth.ts
│   │
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── nginx.conf
│       ├── Dockerfile
│       └── src/
│           ├── main.tsx
│           ├── apollo.ts
│           ├── router.tsx
│           ├── stores/
│           │   └── authStore.ts
│           ├── pages/
│           │   ├── Login.tsx
│           │   └── Homes.tsx
│           ├── components/
│           │   └── layout/
│           │       └── ProtectedRoute.tsx
│           └── gql/
│               ├── graphql.ts  (hand-written stub; replaced by codegen)
│               └── index.ts
```

---

### Critical Files for Implementation

- `apps/api/src/schema/builder.ts`
- `apps/api/src/schema/index.ts`
- `apps/api/prisma/schema.prisma`
- `apps/web/src/apollo.ts`
- `codegen.ts`

---

## Status & Continuation Notes

**Last updated:** 2026-07-05

### Completed

- [x] All Sprint 1 files written and committed to `feature/sprint1-scaffolding`
- [x] App renamed from Yardscape → **Hamadryad** across all package names, DB config, and UI strings
- [x] `pnpm-workspace.yaml` updated with `allowBuilds` entries (blocks native build scripts for security: `@apollo/protobufjs`, `@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`)
- [x] `pnpm install` run — `pnpm-lock.yaml` generated
- [x] `.env` configured (copied from `.env.example`, credentials set)

### Remaining to complete Sprint 1

Run these in order from the repo root:

```bash
# 1. Start the database (Docker must be running)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d

# 2. Wait for healthy, then run initial migration
#    When prompted for migration name, enter: init_user
pnpm db:migrate

# 3. Seed the admin user
pnpm seed

# 4. Start dev servers (two terminals, or one with pnpm dev)
pnpm --filter @hamadryad/api dev    # terminal 1 — API on :3001
pnpm --filter @hamadryad/web dev    # terminal 2 — web on :5173

# 5. Run codegen (API must be running)
pnpm codegen

# 6. Verify
#    Open http://localhost:5173
#    → redirects to /login
#    → log in with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
#    → lands on /homes showing "Welcome, [displayName]"
#    → Apollo DevTools: run { me { id email displayName } } — returns the user
```

### Known items to watch

- `pnpm-workspace.yaml` has `allowBuilds` blocking native postinstall scripts. If Prisma client generation fails during `pnpm db:migrate`, run `pnpm --filter @hamadryad/api exec prisma generate` manually.
- The `@pothos/plugin-prisma` Pothos type map is generated by `prisma generate` and output to `node_modules/@pothos/plugin-prisma/generated.d.ts`. This must exist before the API TypeScript compiles — `pnpm db:migrate` triggers it automatically.
- `apps/web/src/gql/graphql.ts` is currently the hand-written Sprint 1 stub. After step 5 above (`pnpm codegen`), it will be replaced by the generated file. The shapes match so no component code changes.

### Sprint 2 preview

Once Sprint 1 is verified working, Sprint 2 adds Home + Yard CRUD:
- `Home`, `HomeMember`, `Yard` Prisma models + migration
- Pothos types for `Home`, `Yard`, `HomeMember`
- `homes` / `home(id)` root queries with `yards(filter: YardFilter)` field
- `createHome`, `updateHome`, `deleteHome`, `createYard`, `updateYard`, `deleteYard` mutations
- Homes list page replacing the Sprint 1 placeholder
- Yard management UI within home detail