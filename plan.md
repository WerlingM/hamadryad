# Hamadryad — Full Implementation Plan

## 1. Repository / Project Structure

pnpm workspaces monorepo. The GraphQL schema (defined via Pothos on the server) is the contract between frontend and backend. GraphQL Code Generator consumes the schema and produces TypeScript types and Apollo hooks for the web app — no shared `packages/types` needed; the schema IS the type source.

```
hamadryad/
├── .claude/
├── .gitignore
├── concept.md
├── plan.md
├── pnpm-workspace.yaml
├── package.json                    # root — scripts only, no deps
├── codegen.ts                      # GraphQL Code Generator config
├── docker-compose.yml              # production compose
├── docker-compose.dev.yml          # dev overrides (db only)
├── .env.example
│
├── apps/
│   ├── api/                        # Node.js / TypeScript backend
│   │   ├── src/
│   │   │   ├── index.ts            # Express + Apollo Server entry point
│   │   │   ├── context.ts          # GraphQL context factory
│   │   │   ├── schema/             # Pothos schema builders
│   │   │   │   ├── index.ts        # assembles the full schema
│   │   │   │   ├── builder.ts      # Pothos SchemaBuilder instance
│   │   │   │   ├── scalars.ts      # DateTime, Date, JSON, GeoJSON scalars
│   │   │   │   ├── types/
│   │   │   │   │   ├── home.ts
│   │   │   │   │   ├── yard.ts
│   │   │   │   │   ├── bed.ts
│   │   │   │   │   ├── planting.ts
│   │   │   │   │   ├── catalog.ts
│   │   │   │   │   ├── irrigation.ts
│   │   │   │   │   ├── user.ts
│   │   │   │   │   └── shared.ts   # Comment, ExternalLink, PageInfo, etc.
│   │   │   │   ├── queries/
│   │   │   │   │   ├── home.ts
│   │   │   │   │   └── catalog.ts
│   │   │   │   └── mutations/
│   │   │   │       ├── auth.ts
│   │   │   │       ├── home.ts
│   │   │   │       ├── yard.ts
│   │   │   │       ├── bed.ts
│   │   │   │       ├── planting.ts
│   │   │   │       ├── catalog.ts
│   │   │   │       └── irrigation.ts
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts       # Prisma client singleton
│   │   │   │   ├── auth.ts         # bcrypt, JWT
│   │   │   │   ├── storage.ts      # file upload handling
│   │   │   │   └── dataloader.ts   # DataLoader instances (N+1 prevention)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                        # React frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router.tsx
│       │   ├── apollo.ts           # Apollo Client instance
│       │   ├── gql/                # codegen output (committed, regenerated on schema change)
│       │   │   ├── graphql.ts      # all generated types
│       │   │   └── index.ts
│       │   ├── components/
│       │   │   ├── map/
│       │   │   ├── ui/             # shadcn/ui components
│       │   │   └── layout/
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Homes.tsx
│       │   │   ├── HomeMap.tsx
│       │   │   ├── BedDetail.tsx
│       │   │   ├── PlantCatalog.tsx
│       │   │   └── Reports.tsx
│       │   ├── hooks/
│       │   ├── stores/             # Zustand (UI state only)
│       │   └── lib/
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
```

### Key conventions

- The **Pothos schema** in `apps/api/src/schema/` is the single API contract. Running `pnpm codegen` from the root hits the API (or its exported schema) and regenerates `apps/web/src/gql/graphql.ts`.
- `builder.ts` exports a single Pothos `SchemaBuilder` instance with the Prisma plugin wired in. All type/query/mutation files import from it.
- Committed generated types mean the frontend is never blocked by a running API during development.
- REST is used only for two endpoints: `POST /upload` (file upload) and `POST /auth/refresh` (httpOnly cookie token refresh — cannot go through GraphQL JSON transport cleanly).

---

## 2. Docker Compose Setup

### `docker-compose.yml` (production)

```yaml
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
      test: ["CMD-SHELL", "pg_isready -U hamadryad"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: ./apps/api
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://hamadryad:${DB_PASSWORD}@db:5432/hamadryad
      JWT_SECRET: ${JWT_SECRET}
      UPLOAD_DIR: /uploads
      ALLOW_REGISTRATION: "false"
    volumes:
      - uploads:/uploads
    ports:
      - "3001:3001"

  web:
    build: ./apps/web
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "3000:80"     # Nginx serves the Vite build

volumes:
  pgdata:
  uploads:
```

### `docker-compose.dev.yml` (development override)

Only the `db` runs in Docker during development. The API and web run locally with hot reload.

```yaml
services:
  db:
    ports:
      - "5432:5432"

  api:
    profiles: ["disabled"]

  web:
    profiles: ["disabled"]
```

### Dev workflow

```bash
# terminal 1 — database only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db

# terminal 2 — API with hot reload (tsx watch)
pnpm --filter api dev

# terminal 3 — frontend with HMR
pnpm --filter web dev        # Vite proxies /graphql and /upload to :3001
```

Vite `server.proxy` forwards `/graphql` and `/upload` to `http://localhost:3001`, eliminating CORS issues in development. Apollo Client is configured to use `/graphql` as a relative URL — same config works in dev and production.

---

## 3. Database Schema

### Design decisions

- **`Home`** replaces `Property` as the table name, matching the GraphQL type and concept language.
- **`Yard`** is introduced as an intermediate entity between `Home` and `Bed`, reflecting the front/back/side yard structure described in the concept.
- PostGIS geometry columns use `Unsupported(...)` in Prisma; raw SQL handles spatial reads (`ST_AsGeoJSON`) and writes (`ST_GeomFromGeoJSON`).
- SRID 4326 (WGS 84) throughout — matches GeoJSON and MapLibre defaults.
- Photos stored as file paths or S3 keys; the DB holds metadata only.

### Entity hierarchy

```
Home → Yard → Bed → Planting → CatalogSpecies
```

### Entities

#### `User`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| displayName | TEXT | shown in comments |
| passwordHash | TEXT | bcrypt |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `Home`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | "Suburban Home", "Richmond Rental" |
| address | TEXT | |
| notes | TEXT | nullable |
| parcelGeometry | geometry(MultiPolygon,4326) | Unsupported, nullable |
| parcelGeoJson | JSONB | raw imported GeoJSON, nullable |
| ownerId | UUID FK → User | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `HomeMember`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| homeId | UUID FK → Home | |
| userId | UUID FK → User | |
| role | ENUM: OWNER, EDITOR, VIEWER | |

#### `Yard`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| homeId | UUID FK → Home | |
| name | TEXT | "Front Yard", "Back Yard" |
| location | ENUM: FRONT, BACK, SIDE_LEFT, SIDE_RIGHT, OTHER | |
| description | TEXT | nullable |
| sortOrder | INT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `Bed`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| yardId | UUID FK → Yard | |
| name | TEXT | "Rain Garden", "Front Slope" |
| description | TEXT | nullable |
| sunlight | ENUM: FULL_SUN, PART_SHADE, FULL_SHADE | |
| moisture | ENUM: DRY, AVERAGE, MOIST, WET | |
| geometry | geometry(Polygon,4326) | Unsupported |
| sortOrder | INT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `BedComment`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| bedId | UUID FK → Bed | |
| authorId | UUID FK → User | |
| body | TEXT | |
| createdAt | TIMESTAMPTZ | |

#### `CatalogSpecies`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| commonName | TEXT | "Purple Coneflower" |
| scientificName | TEXT UNIQUE | "Echinacea purpurea" |
| description | TEXT | nullable |
| nativeRange | TEXT | nullable |
| sunlight | ENUM: FULL_SUN, PART_SHADE, FULL_SHADE, VARIABLE | |
| moisture | ENUM: DRY, AVERAGE, MOIST, WET, VARIABLE | |
| bloomMonthStart | INT | nullable (1–12) |
| bloomMonthEnd | INT | nullable (1–12) |
| matureHeightCm | INT | nullable |
| tags | TEXT[] | |
| externalLinks | JSONB | array of {label, url} |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `Planting`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| bedId | UUID FK → Bed | |
| speciesId | UUID FK → CatalogSpecies | |
| nickname | TEXT | nullable |
| datePurchased | DATE | nullable |
| datePlanted | DATE | nullable |
| source | TEXT | nullable |
| pricePaidCents | INT | nullable |
| quantity | INT | default 1 |
| status | ENUM: PLANNED, PLANTED, REMOVED | |
| maintenanceNotes | TEXT | nullable |
| externalLinks | JSONB | array of {label, url} |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

#### `PlantingComment`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| plantingId | UUID FK → Planting | |
| authorId | UUID FK → User | |
| body | TEXT | |
| createdAt | TIMESTAMPTZ | |

#### `PlantingPhoto`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| plantingId | UUID FK → Planting | |
| uploadedById | UUID FK → User | |
| storagePath | TEXT | |
| caption | TEXT | nullable |
| takenAt | DATE | nullable |
| createdAt | TIMESTAMPTZ | |

#### `IrrigationLayer`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| homeId | UUID FK → Home UNIQUE | one layer per home |
| featureCollection | JSONB | full GeoJSON FeatureCollection |
| updatedAt | TIMESTAMPTZ | |
| updatedById | UUID FK → User | |

### Key indexes

```sql
CREATE INDEX yards_home_id ON "Yard"("homeId");
CREATE INDEX beds_yard_id ON "Bed"("yardId");
CREATE INDEX plantings_bed_id ON "Planting"("bedId");
CREATE INDEX plantings_species_id ON "Planting"("speciesId");
CREATE INDEX catalog_fts ON "CatalogSpecies"
  USING gin(to_tsvector('english', "scientificName" || ' ' || "commonName"));
CREATE INDEX beds_geometry ON "Bed" USING gist(geometry);
CREATE INDEX homes_parcel ON "Home" USING gist("parcelGeometry");
```

---

## 4. Backend API Design — GraphQL

### Tooling

| Tool | Role |
|---|---|
| Apollo Server 4 | GraphQL HTTP server |
| Pothos | Code-first TypeScript schema builder |
| @pothos/plugin-prisma | Wires Prisma models directly into Pothos types, eliminates boilerplate |
| @pothos/plugin-scope-auth | Declarative auth on types and fields |
| DataLoader | Batches and caches resolver fetches (N+1 prevention) |
| graphql-upload | Multipart upload support (or separate REST endpoint — see below) |

**Pothos over SDL-first**: Pothos keeps the schema and its resolvers co-located in TypeScript. The Prisma plugin generates Pothos types directly from the Prisma schema — field additions to a model automatically surface in the GraphQL type. The SDL can be exported at any time (`printSchema(schema)`) for tooling or documentation.

**File uploads**: Use a separate REST `POST /upload` endpoint (multer). GraphQL multipart adds complexity and the Pothos/Apollo integration is finicky. The pattern is: upload returns a `storagePath`, then a GraphQL mutation references it.

### GraphQL Schema

The schema has **two primary entry points on the Query type** as specified:

1. **`home` / `homes`** — top-level queries into a home location; yards and beds are accessed by traversing the graph from there
2. **`catalog`** — independent entry point for the plant catalog, not tied to any home

```graphql
# ── Scalars ──────────────────────────────────────────────────────────────
scalar DateTime
scalar Date
scalar JSON        # arbitrary JSON (used for GeoJSON blobs)

# ── Enums ─────────────────────────────────────────────────────────────────
enum YardLocation { FRONT  BACK  SIDE_LEFT  SIDE_RIGHT  OTHER }
enum Sunlight     { FULL_SUN  PART_SHADE  FULL_SHADE }
enum SunlightExt  { FULL_SUN  PART_SHADE  FULL_SHADE  VARIABLE }  # catalog
enum Moisture     { DRY  AVERAGE  MOIST  WET }
enum MoistureExt  { DRY  AVERAGE  MOIST  WET  VARIABLE }          # catalog
enum PlantingStatus { PLANNED  PLANTED  REMOVED }
enum MemberRole   { OWNER  EDITOR  VIEWER }

# ── Root queries ───────────────────────────────────────────────────────────
type Query {
  # Home entry point — filter yards at the field level
  home(id: ID!): Home
  homes: [Home!]!

  # Catalog entry point — independent of home location
  catalog(filter: CatalogFilter, first: Int, after: String): CatalogConnection!
  catalogSpecies(id: ID!): CatalogSpecies

  # Auth
  me: User
}

# ── Home graph ─────────────────────────────────────────────────────────────
type Home {
  id: ID!
  name: String!
  address: String!
  notes: String
  parcelGeoJson: JSON
  yards(filter: YardFilter): [Yard!]!
  members: [HomeMember!]!
  irrigationLayer: IrrigationLayer
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Yard {
  id: ID!
  home: Home!
  name: String!
  location: YardLocation!
  description: String
  sortOrder: Int!
  beds(filter: BedFilter): [Bed!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Bed {
  id: ID!
  yard: Yard!
  name: String!
  description: String
  sunlight: Sunlight!
  moisture: Moisture!
  geometry: JSON          # GeoJSON Polygon feature
  sortOrder: Int!
  plantings(filter: PlantingFilter): [Planting!]!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Planting {
  id: ID!
  bed: Bed!
  species: CatalogSpecies!
  nickname: String
  datePurchased: Date
  datePlanted: Date
  source: String
  pricePaidCents: Int
  quantity: Int!
  status: PlantingStatus!
  maintenanceNotes: String
  externalLinks: [ExternalLink!]!
  photos: [PlantingPhoto!]!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# ── Catalog graph (independent entry point) ────────────────────────────────
type CatalogSpecies {
  id: ID!
  commonName: String!
  scientificName: String!
  description: String
  nativeRange: String
  sunlight: SunlightExt!
  moisture: MoistureExt!
  bloomMonthStart: Int
  bloomMonthEnd: Int
  matureHeightCm: Int
  tags: [String!]!
  externalLinks: [ExternalLink!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type CatalogConnection {
  edges: [CatalogEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CatalogEdge {
  node: CatalogSpecies!
  cursor: String!
}

# ── Shared types ───────────────────────────────────────────────────────────
type Comment {
  id: ID!
  author: User!
  body: String!
  createdAt: DateTime!
}

type ExternalLink {
  label: String!
  url: String!
}

type PlantingPhoto {
  id: ID!
  storagePath: String!
  caption: String
  takenAt: Date
  uploadedBy: User!
  createdAt: DateTime!
}

type IrrigationLayer {
  id: ID!
  featureCollection: JSON!
  updatedAt: DateTime!
  updatedBy: User!
}

type HomeMember {
  user: User!
  role: MemberRole!
}

type User {
  id: ID!
  email: String!
  displayName: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# ── Filters ────────────────────────────────────────────────────────────────
input YardFilter {
  location: YardLocation
}

input BedFilter {
  sunlight: Sunlight
  moisture: Moisture
}

input PlantingFilter {
  status: PlantingStatus
  speciesId: ID
}

input CatalogFilter {
  search: String
  sunlight: SunlightExt
  moisture: MoistureExt
  tags: [String!]
}

# ── Mutations ──────────────────────────────────────────────────────────────
type Mutation {
  # Auth
  login(email: String!, password: String!): AuthPayload!
  register(email: String!, password: String!, displayName: String!): AuthPayload!

  # Homes
  createHome(input: CreateHomeInput!): Home!
  updateHome(id: ID!, input: UpdateHomeInput!): Home!
  deleteHome(id: ID!): Boolean!
  importParcel(homeId: ID!, geoJson: String!): Home!

  # Yards
  createYard(homeId: ID!, input: CreateYardInput!): Yard!
  updateYard(id: ID!, input: UpdateYardInput!): Yard!
  deleteYard(id: ID!): Boolean!

  # Beds
  createBed(yardId: ID!, input: CreateBedInput!): Bed!
  updateBed(id: ID!, input: UpdateBedInput!): Bed!
  deleteBed(id: ID!): Boolean!
  addBedComment(bedId: ID!, body: String!): Comment!

  # Plantings
  createPlanting(bedId: ID!, input: CreatePlantingInput!): Planting!
  updatePlanting(id: ID!, input: UpdatePlantingInput!): Planting!
  deletePlanting(id: ID!): Boolean!
  addPlantingComment(plantingId: ID!, body: String!): Comment!
  addPlantingPhoto(plantingId: ID!, input: PlantingPhotoInput!): PlantingPhoto!
  deletePlantingPhoto(id: ID!): Boolean!

  # Catalog
  createCatalogSpecies(input: CreateCatalogSpeciesInput!): CatalogSpecies!
  updateCatalogSpecies(id: ID!, input: UpdateCatalogSpeciesInput!): CatalogSpecies!
  deleteCatalogSpecies(id: ID!): Boolean!

  # Irrigation
  saveIrrigationLayer(homeId: ID!, featureCollection: JSON!): IrrigationLayer!
}

type AuthPayload {
  token: String!
  user: User!
}
```

### Schema design notes

- **Nullability is intentional**: non-null (`!`) only where the field is guaranteed to exist. Optional fields (notes, geometry before a parcel is imported, bloom months) are nullable.
- **Filters on collection fields**: `yards(filter: YardFilter)`, `beds(filter: BedFilter)`, `plantings(filter: PlantingFilter)` push filtering to the field level. The client can write `home(id: $id) { yards(filter: {location: BACK}) { beds { ... } } }` without extra round-trips.
- **CatalogConnection** uses cursor-based pagination (Relay spec) because catalog search results can be large and benefit from stable pagination.
- **Mutations return the mutated object** so the client can update the Apollo cache directly without a refetch.
- **`Boolean!` deletes**: sufficient for this app; a full payload type would be overkill.

### Authorization

`@pothos/plugin-scope-auth` defines scopes at the type level. All types except `AuthPayload` require an authenticated user in context. The `home` resolver additionally checks that `ctx.user` is a member of the requested home. This is declared once on the `Home` type and inherited by all fields resolved from it.

### N+1 prevention (DataLoader)

Every resolver that traverses a relation uses a DataLoader instance from `ctx.loaders`. Example: `Bed.plantings` does not query per-bed; the DataLoader batches all bed IDs from a single request into one `WHERE bedId IN (...)` query. Loaders are instantiated per-request in `context.ts` so they are never shared across requests.

Key loaders: `yardsByHomeId`, `bedsByYardId`, `plantingsByBedId`, `commentsByBedId`, `commentsByPlantingId`, `photosByPlantingId`, `speciesById`.

### REST endpoints (alongside GraphQL)

```
POST /upload            — multipart file, returns { storagePath }
GET  /uploads/:path     — serve uploaded files (auth-checked)
POST /auth/refresh      — reads httpOnly refresh cookie, returns { token }
```

---

## 5. Frontend Architecture

### Stack

| Tool | Purpose |
|---|---|
| Vite | Bundler, dev server, HMR |
| React Router v6 | Client-side routing |
| Apollo Client | GraphQL data fetching, normalized cache |
| GraphQL Code Generator | Generates TypeScript types + typed hooks from schema |
| Zustand | Ephemeral UI state (map, panels, auth token) |
| MapLibre GL JS | Map rendering |
| maplibre-gl-draw | Bed polygon drawing/editing |
| shadcn/ui + Tailwind CSS | UI components |

### GraphQL Code Generator

Running `pnpm codegen` from the repo root hits the API schema and generates `apps/web/src/gql/graphql.ts`. This file contains:
- All GraphQL enum and object types as TypeScript interfaces
- Typed `useQuery` / `useMutation` hooks for every `.graphql` operation file in the web app

Operations are written as `.graphql` files co-located with the component that uses them:

```
apps/web/src/pages/HomeMap.tsx
apps/web/src/pages/HomeMap.graphql   ← query used by HomeMap
```

This means the component imports a typed hook directly: `import { useHomeMapQuery } from '../gql/graphql'`. No string queries in component code.

### Routing structure

```
/                             → redirect to /homes
/login                        → Login page
/homes                        → Homes list (was /properties)
/homes/new                    → Create home
/homes/:homeId                → HomeMap (core page)
/homes/:homeId/beds/:bedId    → BedDetail panel (drawer on map page)
/catalog                      → Catalog browse/search
/catalog/:speciesId           → Species detail
/reports                      → Reports hub
/reports/:reportType          → Specific report
```

### Component tree (core map page)

```
HomeMap
├── MapSidebar (left panel)
│   ├── HomeHeader (name, address)
│   ├── YardList (grouped accordion)
│   │   └── BedListItem (per yard section)
│   └── AddYard / AddBed buttons
│
├── YardMap (full-screen MapLibre container)
│   ├── ParcelLayer        (home boundary)
│   ├── BedLayer           (per-bed fills, color-coded by sunlight)
│   ├── IrrigationLayer    (toggle-able annotation)
│   └── DrawControl        (maplibre-gl-draw)
│
└── BedDetailPanel (slide-over)
    ├── BedInfo
    ├── PlantingList
    │   └── PlantingCard
    │       ├── PlantingPhotos
    │       ├── PlantingComments
    │       └── PlantingActions
    └── BedComments
```

### State management split

**Apollo Client cache (server state):** All GraphQL data. Apollo's normalized cache (`InMemoryCache`) means that when a mutation returns a `Bed`, any other query referencing that bed ID is automatically updated. Cache updates are declared in mutation `update` functions or via automatic normalization by `id`.

**Zustand (UI state):** Three stores:
1. `mapStore` — drawing mode (`idle | drawing | editing`), hovered/selected feature id, layer visibility
2. `panelStore` — which panel is open and what it shows
3. `authStore` — JWT access token in memory (not localStorage); `null` means unauthenticated

### Apollo Client setup

```typescript
// apollo.ts
const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  operation.setContext({ headers: { authorization: token ? `Bearer ${token}` : '' } });
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (networkError?.statusCode === 401) {
    // call /auth/refresh, update token in authStore, retry
  }
});

const client = new ApolloClient({
  link: from([authLink, errorLink, new HttpLink({ uri: '/graphql' })]),
  cache: new InMemoryCache(),
});
```

### MapLibre integration

Identical to the prior plan: map instance in `useRef`, `useMap` context hook, bed geometries via `map.getSource('beds').setData(...)` driven by Apollo query results, `maplibre-gl-draw` events trigger GraphQL mutations.

### Map tile sources

- **Vector base map**: OpenFreeMap — free, no API key, MapLibre-compatible
- **Satellite imagery**: ESRI World Imagery tiles — publicly accessible, no key required for personal use

---

## 6. Auth Approach

Identical to the prior plan — the transport changed (GraphQL replaces tRPC) but the auth mechanism does not.

1. **Access token**: Short-lived JWT (15 min), in Zustand `authStore` (memory only). Sent as `Authorization: Bearer` header on every GraphQL request via Apollo's `authLink`.
2. **Refresh token**: Long-lived (30 days), `httpOnly; Secure; SameSite=Strict` cookie. REST `POST /auth/refresh` issues a new access token and rotates the refresh token.
3. On app load, if the access token is absent, hit `/auth/refresh`. Valid cookie → new token → proceed. Invalid → redirect to `/login`.
4. Apollo `errorLink` intercepts 401 errors, refreshes the token, and retries the operation.

`login` and `register` are GraphQL mutations. `register` is guarded server-side by `ALLOW_REGISTRATION=true` env var. Users are seeded via `pnpm seed` in production.

---

## 7. Sprint Breakdown

Each sprint delivers working, deployable software. Sized for roughly one focused week of solo development.

---

### Sprint 1 — Foundation ✅ COMPLETE

**Goal:** Running full-stack skeleton with GraphQL endpoint, login works, deployable via Docker Compose.

- [x] pnpm workspace with `apps/api`, `apps/web`
- [x] Prisma schema: `User` table + initial migration, PostGIS extension enabled
- [x] Apollo Server 4 + Pothos `SchemaBuilder` wired into Express
- [x] `scalars.ts`: DateTime, Date, JSON scalars registered
- [x] `me` query + `login` mutation (returns JWT)
- [x] `POST /auth/refresh` REST endpoint + httpOnly cookie rotation
- [x] GraphQL Code Generator config (`codegen.ts`) — generates types to `apps/web/src/gql/`
- [x] Apollo Client instance in `apps/web`
- [x] Login page using `useLoginMutation` (generated hook)
- [x] `authStore` in Zustand, protected route wrapper
- [x] `docker-compose.yml` + `docker-compose.dev.yml` (podman-compatible)
- [x] `.env.example`, root `pnpm dev` script

**Done when:** `docker compose up` starts DB; `pnpm dev` starts API + web; seeded user can log in; Apollo DevTools shows the `me` query returning the user.

**Status:** Verified end-to-end (2026-08-24) — seeded admin logs in via the `login` mutation, `me` resolves the authenticated user with the returned token, and both `apps/api` and `apps/web` typecheck cleanly. See `sprint1.md` for the post-scaffolding dependency-upgrade fixes that were required (Pothos/Prisma dmmf wiring, scalar type params, jsonwebtoken types, codegen hooks).

---

### Sprint 2 — Homes & Yards ✅ COMPLETE

**Goal:** Create and manage homes with yards; dashboard is functional.

- `Home`, `HomeMember`, `Yard` Prisma models + migration
- Pothos types for `Home`, `Yard`, `HomeMember`
- `homes` and `home(id)` queries
- `createHome`, `updateHome`, `deleteHome` mutations
- `createYard`, `updateYard`, `deleteYard` mutations
- `homes` query includes `yards` field with `YardFilter`
- Homes list page, create/edit form
- Yard management within home detail (list, add, rename)
- `pnpm codegen` run to generate updated hooks

**Done when:** "Suburban Home" and "Richmond Rental" exist with front/back yards; query `homes { yards { name location } }` returns correct data.

---

### Sprint 3 — The Map (done 2026-11-08)

**Goal:** Home map page displays base map with parcel boundary.

- `Bed` Prisma model (geometry column + migration), `Yard.beds` relation
- Pothos `Bed` type with `geometry: JSON` field using raw SQL resolver
- `importParcel` mutation (stores via `ST_GeomFromGeoJSON`, returns updated `Home`)
- MapLibre GL JS in `YardMap` component, OpenFreeMap tiles + satellite toggle
- `HomeMap` route (full-screen map)
- GeoJSON file upload UI → calls `importParcel` mutation
- `ParcelLayer` renders `home.parcelGeoJson` as a MapLibre fill layer
- Map sidebar scaffold with yard/bed accordion (empty)

**Done when:** Navigate to a home, upload a parcel GeoJSON, see the lot boundary on the map over real tiles.

---

### Sprint 4 — Garden Bed Drawing

**Goal:** Draw, name, and manage beds on the map per yard.

- `createBed`, `updateBed`, `deleteBed` mutations (accept GeoJSON polygon as `JSON` scalar)
- `BedComment` model + `addBedComment` mutation
- `beds(filter: BedFilter)` on `Yard` type
- `maplibre-gl-draw` integrated; "Add Bed" activates polygon draw mode
- Yard picker in "Add Bed" flow (which yard does this bed belong to?)
- Beds rendered as colored fills, color-coded by sunlight enum value
- Click bed → `BedDetailPanel` slide-over (controlled by route param)
- BedDetail: display + inline edit form using `updateBed` mutation
- Comment log in BedDetail using `addBedComment`
- BedList in sidebar grouped by yard

**Done when:** Draw "Front Rain Garden" in the Front Yard, set sunlight to `PART_SHADE`, see it on the map, open its detail panel, add a comment.

---

### Sprint 5 — Plant Catalog

**Goal:** Shared species catalog with search via `catalog` query entry point.

- `CatalogSpecies` Prisma model + migration
- Pothos `CatalogSpecies` type, `CatalogConnection` (cursor pagination)
- `catalog(filter, first, after)` root query with full-text search + filters
- `catalogSpecies(id)` root query
- `createCatalogSpecies`, `updateCatalogSpecies` mutations
- Catalog browse page: search box + sunlight/moisture/tag filters
- Cursor-based pagination (`fetchMore` with Apollo)
- Species detail page
- Seed script: 20–30 native Virginia species

**Done when:** `catalog(filter: {search: "coneflower"})` returns Echinacea purpurea with bloom time and native range; new species can be added from the UI.

---

### Sprint 6 — Plantings

**Goal:** Assign plants to beds; track purchase info, photos, and comments.

- `Planting`, `PlantingComment`, `PlantingPhoto` Prisma models + migration
- Pothos types; `beds.plantings` field with `PlantingFilter`
- `createPlanting`, `updatePlanting`, `deletePlanting` mutations
- `addPlantingComment`, `addPlantingPhoto`, `deletePlantingPhoto` mutations
- DataLoader for `plantingsByBedId` (prevent N+1 when beds list renders)
- `POST /upload` REST endpoint (multer), served at `GET /uploads/:path`
- PlantingList in BedDetail panel
- PlantingCard: species name, status badge, purchase date, price
- Photo gallery (upload + lightbox view)
- Comment thread
- Species search picker in "Add Planting" form (queries `catalog`)

**Done when:** Add "3x Echinacea purpurea, purchased from Strange's Nurseries, planted 2024-05-10, $12" to the Front Rain Garden bed, upload a photo, add a comment.

---

### Sprint 7 — Irrigation Overlay

**Goal:** Sketch irrigation annotations on the map; toggleable layer.

- `IrrigationLayer` Prisma model + migration
- `IrrigationLayer` Pothos type on `Home`
- `saveIrrigationLayer` mutation (full FeatureCollection replace)
- Irrigation edit mode (separate draw layer, does not interfere with bed drawing)
- Draw lines, points, polygons with text label properties
- Properties panel for annotation features (label, color)
- "Save" button fires `saveIrrigationLayer` mutation
- Irrigation layer toggle in map toolbar
- Distinct styling: blue/teal palette, dashed lines for pipes

**Done when:** Sketch a drip zone polygon labeled "Zone A", save, toggle off/on, reload and see it persist.

---

### Sprint 8 — Reports

**Goal:** Cross-home and cross-yard queries for planning new plantings.

- `reports` query group on root `Query` type:
  - `purchaseHistory(filter: PurchaseHistoryFilter): [Planting!]!`
  - `maintenanceCalendar(homeId: ID, month: Int): [MaintenanceItem!]!`
  - `crossHomeCandidates(sourceHomeId: ID!, targetHomeId: ID!): [CatalogSpecies!]!`
  - `bedSummary(homeId: ID!): [BedSummary!]!`
- Reports hub page
- **Purchase History**: filterable table with cost, species, source, date
- **Cross-Home Candidates**: pick source + target home → species from source matching target's sun/moisture
- **Maintenance Calendar**: monthly view of pruning/deadheading/feeding derived from `maintenanceNotes` + bloom time
- **Bed Summary**: per-bed counts and spend
- Print-friendly CSS

**Done when:** `crossHomeCandidates` returns native species from the suburban home as candidates for the Richmond rental; maintenance calendar renders for spring.

---

### Sprint 9 — Polish & Production Hardening

**Goal:** App ready for real daily use.

- Helmet.js, rate limiting on auth REST endpoints
- Apollo Server error formatting: map Prisma/validation errors to clean GraphQL errors
- Input validation: Zod on all mutation inputs (length limits, URL format on `externalLinks`)
- Frontend: toast notifications on mutation errors
- Loading states and empty states on all major views
- Mobile-responsive layout (sidebar collapses on mobile, map still usable)
- `ALLOW_REGISTRATION=false` guard confirmed in prod compose
- Full prod Docker Compose build tested end-to-end
- `README.md`: setup, env vars, seed instructions, backup procedure
- Backup: `pg_dump` via cron or compose-managed script, documented

---

## Key Technical Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| API style | GraphQL (Apollo Server 4 + Pothos) | Well-formed data graph, typed schema is the contract, field-level filtering on collections |
| Schema approach | Code-first (Pothos) | TypeScript types drive the schema; Prisma plugin eliminates resolver boilerplate |
| Client codegen | GraphQL Code Generator | Generates typed hooks from `.graphql` operation files; no runtime overhead |
| Client cache | Apollo Client `InMemoryCache` | Normalized cache means mutations auto-update all referencing queries by entity ID |
| Auth tokens | JWT (memory) + httpOnly refresh cookie | Stateless API, XSS-safe access token |
| Spatial data | PostGIS via raw SQL for geometry; Prisma for everything else | Prisma lacks spatial support; hybrid is practical |
| Map tiles | OpenFreeMap (vector) + ESRI World Imagery (satellite) | No API key required |
| UI state | Zustand | Lightweight, no Redux boilerplate; clean separation from Apollo cache |
| Irrigation model | Single JSONB FeatureCollection per home | No structured model needed; full replace on save is sufficient |
| File uploads | REST `POST /upload` + `GET /uploads/:path` | GraphQL multipart is finicky; one REST endpoint is simpler |
| Monorepo tooling | pnpm workspaces | Lightweight, no build orchestration needed at this scale |

---

## Critical Files

- `apps/api/prisma/schema.prisma` — DB source of truth; Prisma models feed into Pothos via the Prisma plugin
- `apps/api/src/schema/builder.ts` — Pothos `SchemaBuilder` instance; everything imports from this
- `apps/api/src/schema/index.ts` — assembles the full GraphQL schema; must import all type/query/mutation files to register them with Pothos
- `apps/web/src/gql/graphql.ts` — generated; never edit by hand; regenerate with `pnpm codegen` after any schema change
- `apps/web/src/components/map/YardMap.tsx` — hardest component; MapLibre instance lifecycle, source/layer management, draw control integration
- `codegen.ts` — root codegen config; points to the API schema and web operation files
- `docker-compose.yml` — PostGIS image, volume mounts, health checks; get right before building anything else
