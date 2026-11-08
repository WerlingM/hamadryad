# Developer Guide

[Docs home](../index.md)

## Prerequisites

- Node.js ≥ 20, pnpm ≥ 9 (see `engines` in the root `package.json`)
- Podman + `podman compose` (the team runs containers with Podman, not Docker — the compose files are Docker-Compose-compatible)

## Repository layout

```
apps/
  api/                 Node.js/TypeScript GraphQL API
    src/
      index.ts          Express + Apollo Server entry point
      context.ts        per-request GraphQL context (auth lookup, prisma client)
      lib/               auth (JWT/bcrypt), prisma client, home access checks, input validation
      schema/
        builder.ts       the single Pothos SchemaBuilder instance
        scalars.ts       DateTime / Date / JSON scalars
        enums.ts         GraphQL enums mapped from Prisma enums
        types/           Pothos object types (one file per GraphQL type)
        queries/         root Query fields
        mutations/       root Mutation fields
    prisma/
      schema.prisma      database schema (source of truth)
      migrations/
      seed.ts            admin user + sample homes (seedHomes.ts)
  web/                  React (Vite) frontend
    src/
      apollo.ts          Apollo Client instance (auth header, token refresh + retry)
      router.tsx         React Router route table
      stores/            Zustand stores (auth token, future UI state)
      pages/             route-level components, with co-located .graphql operations
      components/        reusable pieces (layout, ui styles, homes, yards)
      lib/               small shared helpers (labels, roles, error messages)
      gql/graphql.ts      generated types + Apollo hooks — do not hand-edit
docs/                   this documentation
codegen.ts               GraphQL Code Generator config (root — spans both apps)
docker-compose.yml       production compose (db + api + web)
docker-compose.dev.yml   dev override (db only; api/web run locally with hot reload)
```

## First-time setup

1. Copy `.env.example` to `.env` and fill in real values — at minimum generate distinct `JWT_SECRET`/`JWT_REFRESH_SECRET` (the file has a one-liner for that) and set a `DB_PASSWORD`.
2. `pnpm install` at the repo root (installs for both workspace packages).
3. Start Postgres only: `podman compose -f docker-compose.yml -f docker-compose.dev.yml up db`. `docker-compose.dev.yml` disables the `api`/`web` services and publishes Postgres on `localhost:5432` for local tools to reach.
4. Apply migrations: `pnpm db:migrate` (interactive, dev-friendly) or `pnpm db:migrate:deploy` (non-interactive, matches production).
5. Seed data: `pnpm seed` — creates the admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_DISPLAY_NAME` in `.env`, plus sample homes ("Suburban Home", "Richmond Rental") each with front and back yards. Safe to re-run; skips anything that already exists.

## Day-to-day dev loop

- `pnpm dev` — runs `tsx watch` for the API and Vite for the web app in parallel. Vite proxies `/graphql` and `/auth` to `localhost:3001`, so there's no CORS to think about in dev.
- `pnpm codegen` — regenerates `apps/web/src/gql/graphql.ts` from the live schema plus every `.graphql` file under `apps/web/src`. **The API must be running first.** Codegen only emits a typed hook for an operation if a `.graphql` file for it exists — a component importing a hook with nothing generating it is usually a missing `.graphql` file, not a broken import.
- `pnpm typecheck` — runs `tsc --noEmit` in both workspaces. Treat this as a required gate before calling any change done.
- `pnpm build` — compiles the API and builds the web bundle.

## Verifying the API directly

Useful when checking the schema or auth flow without the frontend in the loop:

```
curl -s http://localhost:3001/graphql -H "Content-Type: application/json" \
  -d '{"query":"mutation Login($input: LoginInput!) { login(input: $input) { token user { id email displayName } } }","variables":{"input":{"email":"admin@example.com","password":"..."}}}'
```

The returned `token` can be passed as `Authorization: Bearer <token>` on a follow-up request to confirm `{ me { id email displayName } }` resolves.

## Known gotchas

`apps/api`'s Pothos/Prisma/JWT dependency wiring is more brittle than it looks — a version bump broke five things at once (DMMF wiring, scalar type params, JWT option types, and GraphQL codegen hooks). See [Sprint 1 build notes](../../sprint1.md#status--complete-verified-2026-08-24) for exactly what broke and why, before re-touching `schema/builder.ts` or the Prisma generator config.

## Deployment

See [Deployment](deployment.md) for running the full stack (including the web/api containers) via `podman compose`.
