# Deployment

[Docs home](../index.md) · [Developer Guide](index.md)

## Production compose

`docker-compose.yml` at the repo root defines three services, brought up with `podman compose up`:

- **`db`** — `postgis/postgis:16-3.4`, with a health check gating startup of the API until Postgres accepts connections. Data persists in the `pgdata` volume.
- **`api`** — built from `apps/api/Dockerfile` (multi-stage: compiles TypeScript, then runs `prisma migrate deploy` before starting the compiled server). Listens on `3001`.
- **`web`** — built from `apps/web/Dockerfile` (Vite build served by nginx). Listens on `3000`.

`docker-compose.dev.yml` is a local-dev override: it publishes the `db` port to the host and disables the `api`/`web` services entirely (via Compose `profiles`), since those run locally with hot reload instead. Always pass both files together in dev: `podman compose -f docker-compose.yml -f docker-compose.dev.yml up ...`.

## Environment variables

`.env.example` at the repo root is the source of truth for every variable the stack needs (database credentials, JWT secrets and lifetimes, CORS origin, the registration guard, seed admin credentials). Copy it to `.env` and fill in real values — don't duplicate the variable list here; if it changes, `.env.example` is what's authoritative.

Two production-specific requirements worth calling out:
- `ALLOW_REGISTRATION` must be `"false"` in production — the compose file hardcodes this in the `api` service's environment block regardless of `.env`, so `register` can't be reached even if a `.env` mistake sets it to `"true"`.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be distinct, high-entropy values — a leaked one shouldn't compromise the other class of token.

## Migrations in production

The API container runs `prisma migrate deploy` (non-interactive, applies only pending migrations) as part of its startup command, before the server starts listening. There's no separate migration step to remember — deploying a new image is sufficient.

## Backups

Not yet implemented. `pgdata` is a named volume; a `pg_dump` cron job or compose-managed backup script is planned for the hardening sprint (see the [roadmap](../../plan.md#sprint-9--polish--production-hardening)).
