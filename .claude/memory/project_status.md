---
name: project-status
description: Where development left off (as of 2026-11-08) and what to pick up next
metadata:
  type: project
---
**As of 2026-11-08:** Sprint 1 merged to `main` and pushed. Sprint 2 (Homes & Yards, see `plan.md` Sprint 2) complete on branch `feature/sprint2-homes-yards` (API verified via curl, UI verified by user in browser 2026-11-08). Next: merge to `main`, then Sprint 3 (The Map).

**New machine setup gotchas:**
- `.env` is gitignored — recreate from `.env.example` (DB credentials, JWT secrets, SEED_ADMIN_*).
- Use podman / podman compose, not docker.
- Run `pnpm install`, start db, `pnpm db:migrate`, `pnpm seed`. If Prisma client is missing (pnpm `allowBuilds` blocks postinstall), run `pnpm --filter @hamadryad/api exec prisma generate`.

**Why:** Development is moving between computers; this is the handoff point.
**How to apply:** Read alongside [[project_overview]] and [[project_stack]] before starting Sprint 2 work.
