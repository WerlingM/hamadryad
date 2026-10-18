---
name: Yardscape Tech Stack
description: Confirmed technology choices for Yardscape
type: project
---
**Monorepo:** pnpm workspaces — `apps/api`, `apps/web`

**Frontend:** React + TypeScript, Vite, MapLibre GL JS, maplibre-gl-draw, Apollo Client, GraphQL Code Generator (typed hooks from .graphql operation files), Zustand, React Router v6, shadcn/ui + Tailwind

**Backend:** Node.js + TypeScript, Express, Apollo Server 4, Pothos (code-first GraphQL schema builder), @pothos/plugin-prisma, @pothos/plugin-scope-auth, DataLoader (N+1 prevention)

**Database:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4` Docker image). Prisma for ORM/migrations; raw `$queryRaw`/`$executeRaw` for spatial geometry columns only.

**API:** GraphQL at `/graphql`. Two top-level query entry points: `home`/`homes` (traverses Home→Yard→Bed→Planting) and `catalog` (independent plant catalog, cursor-paginated). REST used only for `POST /upload` (multer) and `POST /auth/refresh` (httpOnly cookie).

**Entity hierarchy:** Home → Yard → Bed → Planting → CatalogSpecies

**Auth:** bcrypt + short-lived JWT in memory (Zustand authStore) + long-lived refresh token in httpOnly cookie. `ALLOW_REGISTRATION` env var guard. Seed users via script.

**Map tiles:** OpenFreeMap (vector, no key) + ESRI World Imagery (satellite, no key)

**Containers:** podman compose (not docker) for prod (db + api + web). Dev: only db runs in a container; api and web run locally. Vite proxies `/graphql` and `/upload` to `:3001`.

**Schema codegen:** `pnpm codegen` at root regenerates `apps/web/src/gql/graphql.ts` from the running API schema. Generated file is committed.

**Why:** No Python. No Google Maps API. No IE required. GraphQL chosen for well-formed data graph with field-level collection filtering.
