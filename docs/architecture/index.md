# Architecture & Design

[Docs home](../index.md)

## System overview

Hamadryad is a pnpm workspaces monorepo with two apps that share a single contract: the GraphQL schema.

- **`apps/api`** — Node.js/TypeScript backend. Express hosts an Apollo Server 4 GraphQL endpoint whose schema is built code-first with [Pothos](https://pothos-graphql.dev/). Pothos's Prisma plugin wires Prisma models directly into GraphQL types, so most CRUD fields need no hand-written resolver boilerplate.
- **`apps/web`** — React (Vite) frontend using Apollo Client for data fetching and Zustand for ephemeral UI state (map interaction state, panel visibility, the in-memory auth token).
- **PostgreSQL + PostGIS** — the database. PostGIS is enabled from the start because the core feature (parcel boundaries, garden bed polygons) is inherently spatial.

The GraphQL schema is the single API contract between the two apps: [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) reads the live schema and the `.graphql` operation files co-located with frontend components, and generates typed Apollo hooks into `apps/web/src/gql/graphql.ts`. The frontend is never blocked on a running API during development because the generated file is committed.

See [Data Model](data-model.md) for the entity schema and [API Design](api.md) for the GraphQL contract and auth approach.

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| API framework | Express + Apollo Server 4 | Mature, well-documented GraphQL HTTP layer |
| Schema | Pothos (code-first) | Schema and resolvers co-located in TypeScript; Prisma plugin eliminates most boilerplate |
| ORM | Prisma | Type-safe queries, migrations; `Unsupported(...)` + raw SQL fills the PostGIS gap |
| Database | PostgreSQL + PostGIS | Relational data plus native spatial types/queries |
| Auth | JWT (access) + httpOnly cookie (refresh) | Stateless API; XSS-safe access token; see [API Design](api.md#auth-approach) |
| Frontend framework | React + Vite | Fast dev server/HMR; no server-side rendering needed for this app |
| Data fetching | Apollo Client | Normalized cache — mutations auto-update every query referencing the same entity |
| Codegen | GraphQL Code Generator | Typed hooks generated from the schema; no hand-written query typings |
| UI state | Zustand | Lightweight, separate from server state in the Apollo cache |
| Map (planned) | MapLibre GL JS + maplibre-gl-draw | Open-source, no API key, supports polygon drawing for beds |
| Containers | Podman / `podman compose` | Team preference over Docker; compose files are Docker-Compose-compatible |
| Monorepo tooling | pnpm workspaces | Lightweight; no separate build orchestrator needed at this scale |

## Key decisions

- **Code-first schema over SDL-first.** Pothos keeps types and resolvers in one place and generates the Prisma type map automatically, so adding a Prisma column surfaces in GraphQL types with minimal glue code.
- **Two graph entry points.** `home`/`homes` is the entry point for a property's yards/beds/plantings; `catalog` is an independent entry point into the shared plant species catalog. They don't need to be joined at the root.
- **REST only where GraphQL is awkward.** File upload (`POST /upload`) and refresh-token rotation (`POST /auth/refresh`, which needs to set an httpOnly cookie) are plain REST endpoints; everything else goes through `/graphql`.
- **Spatial data via raw SQL.** Prisma has no native geometry type, so PostGIS columns are declared `Unsupported(...)` in the schema and read/written with raw `ST_AsGeoJSON` / `ST_GeomFromGeoJSON` queries.
- **Single JSONB layer for irrigation.** The irrigation overlay is one GeoJSON `FeatureCollection` per home, replaced wholesale on save — no structured line/point/polygon model, since it's annotation only.

## Status

`User`, `Home`, `HomeMember`, and `Yard` exist today (Sprints 1–2). The rest of the hierarchy in [Data Model](data-model.md) — beds, plantings, the catalog, irrigation — is the target schema for later sprints; see the [roadmap](../../plan.md) for sequencing.
