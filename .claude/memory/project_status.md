---
name: project-status
description: Where development left off (as of 2026-10-17) and what to pick up next
metadata:
  type: project
---
**As of 2026-10-17:** Sprint 1 (foundation) is complete and verified end-to-end (2026-08-24) on branch `feature/sprint1-scaffolding`. Docs skeleton added under `docs/` (index, architecture, developer guide, user guide) plus root `README.md`.

**Next:** Sprint 2 — Homes & Yards (see `plan.md` Sprint 2 and the "Sprint 2 preview" at the end of `sprint1.md`). Consider merging `feature/sprint1-scaffolding` to `main` first and starting `feature/sprint2-homes-yards`.

**New machine setup gotchas:**
- `.env` is gitignored — recreate from `.env.example` (DB credentials, JWT secrets, SEED_ADMIN_*).
- Use podman / podman compose, not docker.
- Run `pnpm install`, start db, `pnpm db:migrate`, `pnpm seed`. If Prisma client is missing (pnpm `allowBuilds` blocks postinstall), run `pnpm --filter @hamadryad/api exec prisma generate`.

**Why:** Development is moving between computers; this is the handoff point.
**How to apply:** Read alongside [[project_overview]] and [[project_stack]] before starting Sprint 2 work.
