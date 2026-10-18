# API Design

[Docs home](../index.md) · [Architecture](index.md)

## GraphQL as the contract

The schema lives in `apps/api/src/schema/` and is built with Pothos's `SchemaBuilder` (`builder.ts`). Every type, query, and mutation file imports that single builder instance and registers fields on it as a side effect of being imported; `schema/index.ts` assembles the final schema.

Two entry points sit on the root `Query` type by design:

- `home(id)` / `homes` — traverse into a property's yards, beds, and plantings.
- `catalog` / `catalogSpecies(id)` — independent access to the shared plant catalog, not tied to any home.

Collection fields (`yards`, `beds`, `plantings`) accept a filter argument so the client can filter at the field level (e.g., beds by sunlight) without extra round-trips. Mutations return the mutated object so Apollo's normalized cache updates automatically wherever that entity is referenced, instead of requiring a manual refetch.

## REST endpoints (alongside GraphQL)

Two things don't fit GraphQL cleanly and stay as plain REST:

- `POST /auth/refresh` — reads the httpOnly refresh cookie, returns a new access token, and rotates the refresh cookie. GraphQL's JSON transport isn't a good fit for setting cookies from a mutation response the way the browser needs.
- `POST /upload` *(planned)* — multipart file upload, returns a storage path; a GraphQL mutation then references that path. GraphQL multipart upload support is comparatively finicky for the value it adds here.

## Auth approach

- **Access token**: short-lived JWT (15 min default, `JWT_EXPIRES_IN`), held only in memory in the frontend's Zustand `authStore` — never `localStorage` or a readable cookie, so it isn't exposed to XSS. Sent as `Authorization: Bearer` on every GraphQL request.
- **Refresh token**: long-lived JWT (30 days default, `JWT_REFRESH_EXPIRES_IN`), stored as an `httpOnly; Secure; SameSite=Strict` cookie scoped to `/auth/refresh`. Rotated on every use.
- Separate signing secrets for access vs. refresh tokens, so a leaked access token can't be used to mint new refresh tokens.
- On every GraphQL request, `context.ts` looks up the user by the access token's subject claim and re-fetches it from the database (rather than trusting the JWT payload alone), so deleting a user's row revokes access immediately instead of waiting for token expiry.
- `register` is gated by `ALLOW_REGISTRATION` (env var) — off in production; users are created via `pnpm seed` instead.

`@pothos/plugin-scope-auth` enforces authentication declaratively: an `authenticated` scope is computed once per request from `ctx.user !== null` and can be required on any type or field.

## Current schema (Sprint 1)

```graphql
type Query {
  me: User
}

type Mutation {
  login(input: LoginInput!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
}

type User {
  id: ID!
  email: String!
  displayName: String!
}

type AuthPayload {
  token: String!
  user: User!
}
```

The full target schema (homes, yards, beds, plantings, catalog, irrigation, reports) is specified in the [roadmap](../../plan.md#4-backend-api-design--graphql) and lands incrementally over the following sprints.
