# Data Model

[Docs home](../index.md) · [Architecture](index.md)

## Entity hierarchy

```
Home → Yard → Bed → Planting → CatalogSpecies
```

A `Home` is a property (e.g., "Suburban Home", "Richmond Rental"). Each home has one or more `Yard`s (front, back, side). Each yard has `Bed`s, the primary organizational unit — a bed is a drawn polygon with sunlight/moisture attributes. Each bed holds `Planting`s, which are instances of a shared `CatalogSpecies` (e.g., "Purple Coneflower / *Echinacea purpurea*"). The catalog is shared across all homes and users, so a planting that thrived at one property is an easy candidate to suggest at another.

**Built today:** `User`, `Home`, `HomeMember`, `Yard`, and `Bed`. Everything below them is planned schema for future sprints — see the [roadmap](../../plan.md#3-database-schema) for the section this is drawn from and when each entity lands.

## Entities

### User *(implemented)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| displayName | TEXT | shown on comments |
| passwordHash | TEXT | bcrypt, never exposed via GraphQL |
| createdAt / updatedAt | TIMESTAMPTZ | |

### Home *(implemented)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | |
| address | TEXT | |
| notes | TEXT | nullable |
| parcelGeometry | geometry(MultiPolygon,4326) | via raw SQL, nullable; for spatial queries |
| parcelGeoJson | JSONB | the same boundary as a GeoJSON MultiPolygon, nullable; used for rendering |
| ownerId | UUID FK → User | |

### HomeMember *(implemented)*
Join table granting a `User` a `role` (`OWNER` / `EDITOR` / `VIEWER`) on a `Home`. Unique per (home, user). Creating a home also creates an `OWNER` membership for its creator; access checks always go through this table, not `Home.ownerId`.

### Yard *(implemented)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| homeId | UUID FK → Home | |
| name | TEXT | "Front Yard", "Back Yard" |
| location | ENUM | `FRONT` / `BACK` / `SIDE_LEFT` / `SIDE_RIGHT` / `OTHER` |
| description | TEXT | nullable |
| sortOrder | INT | display order within the home; new yards go last |

Deleting a home cascades to its memberships, yards, and beds.

On import, the uploaded file is reduced to one 2D MultiPolygon (all polygons in the file, other geometry ignored), repaired with `ST_MakeValid`, and written to both parcel columns together, so they always match. The original file isn't kept.

### Bed *(implemented; created from the app in Sprint 4)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| yardId | UUID FK → Yard | |
| name | TEXT | |
| sunlight | ENUM | `FULL_SUN` / `PART_SHADE` / `FULL_SHADE` |
| moisture | ENUM | `DRY` / `AVERAGE` / `MOIST` / `WET` |
| description | TEXT | nullable |
| geometry | geometry(Polygon,4326) | via raw SQL, nullable |
| sortOrder | INT | |

`BedComment` attaches a timestamped, user-attributed comment log to a bed.

### CatalogSpecies *(planned)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| commonName / scientificName | TEXT | scientificName unique |
| nativeRange | TEXT | nullable |
| sunlight / moisture | ENUM (extended with `VARIABLE`) | |
| bloomMonthStart / bloomMonthEnd | INT | 1–12, nullable |
| tags | TEXT[] | |
| externalLinks | JSONB | `{label, url}[]` |

### Planting *(planned)*
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| bedId | UUID FK → Bed | |
| speciesId | UUID FK → CatalogSpecies | |
| datePurchased / datePlanted | DATE | nullable |
| source / pricePaidCents | TEXT / INT | nullable |
| status | ENUM | `PLANNED` / `PLANTED` / `REMOVED` |
| maintenanceNotes | TEXT | nullable |

`PlantingComment` and `PlantingPhoto` attach comment/photo logs, mirroring `BedComment`.

### IrrigationLayer *(planned)*
One row per home: a single JSONB `featureCollection` (full GeoJSON) that's replaced wholesale on every save. No structured model — it's an annotation layer, not tracked irrigation infrastructure.

## Indexing notes

Foreign keys (`Yard.homeId`, `Bed.yardId`, `Planting.bedId`, `Planting.speciesId`) are indexed for traversal. `CatalogSpecies` gets a `gin` full-text index over `scientificName`/`commonName` for search. `Bed.geometry` and `Home.parcelGeometry` get `gist` spatial indexes.

## Conventions

- All primary keys are UUID strings (`gen_random_uuid()`), matching the GraphQL `ID` scalar.
- SRID 4326 (WGS 84) throughout — matches GeoJSON and MapLibre defaults.
- Photos are stored as file paths/keys; the database holds metadata only, not file contents.
