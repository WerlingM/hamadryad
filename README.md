# Hamadryad

A full-stack app for planning, visualizing, and tracking residential landscaping across multiple properties — replacing notebooks and spreadsheets with a shareable, map-first, queryable tool. Built around a visual yard map (MapLibre), a shared native-plant catalog, and per-bed planting logs with photos and comments.

Node.js/TypeScript (Apollo Server + Pothos + Prisma) backend, React (Vite + Apollo Client) frontend, PostgreSQL + PostGIS, all wired together as a pnpm workspaces monorepo.

## Status

Sprint 1 (foundation) is complete: authentication, the GraphQL API skeleton, and a login page work end to end. Everything else — homes, the map, garden beds, the plant catalog, plantings, irrigation, reporting — is planned but not yet built.

## Quick start

```bash
cp .env.example .env    # then fill in real secrets
pnpm install
podman compose -f docker-compose.yml -f docker-compose.dev.yml up db
pnpm db:migrate && pnpm seed
pnpm dev
```

For prerequisites, the full setup walkthrough, and day-to-day scripts, see the [Developer Guide](docs/developer-guide/index.md).

## Documentation

Start at the [documentation index](docs/index.md) — it covers architecture and data model, the developer guide, and the user guide. See also the [product concept](concept.md) and [sprint roadmap](plan.md).
