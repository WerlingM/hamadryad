# Hamadryad — Application Concept

> Working title; may change.

## Overview

A full-stack web application for planning, visualizing, and tracking residential landscaping across multiple properties. Primary use cases are the owner's suburban Virginia home (native plant focus, reduced turf) and a Richmond, VA rental property (larger yard, old-growth trees, vegetable gardens). The app replaces notebooks and spreadsheets with a shareable, queryable, visual tool.

## Properties & Multi-Tenancy

- The app supports **multiple properties**, each with their own yards and garden beds.
- Plant queries can scope to a single property or **span all properties** — useful for finding plants that work in one location and might work in another.

## Visual Yard Map (Core Feature)

The map is the primary interface. Design reference: the narrative, section-by-section style of [Wild Ones Richmond native garden designs](https://nativegardendesigns.wildones.org/richmond-va/) — a top-down yard view with labeled garden beds and per-bed plant lists.

### Lot / Parcel Import
- Import parcel boundary via **GeoJSON upload** (e.g., from county GIS)
- Import from **Google Maps** (geocode/search for the address; user selects the property)
- The parcel boundary gives the overall lot shape; satellite/aerial imagery provides context for structures, driveways, and fixed elements

### Map Tile Source
- **MapLibre GL JS** for the map rendering library (open source, no API key)
- **OpenStreetMap** or free/open satellite tile source — no Google Maps API dependency

### Garden Beds
- Users **draw bed polygons** on the map (freehand or point-by-point)
- Each bed has: name, description, sunlight (full sun / part shade / full shade), moisture level, and a comment log
- Beds are the primary organizational unit; plants belong to beds
- Large single-specimen plants (e.g., a mature Oak) are modeled as a bed with one plant

## Plant Catalog & Plantings

### Shared Catalog
- A **species-level catalog** (e.g., "Purple Coneflower / *Echinacea purpurea*") with general care info, native range, and reference links
- Catalog entries are shared across all properties and users

### Individual Plantings
Each planting is an instance of a catalog species assigned to a bed, tracking:
- Date purchased, date planted
- Purchase source and price
- Comment log (timestamped, attributed to user)
- Photos over time (planting progression)
- Maintenance instructions (pruning, deadheading, feeding schedules)
- Links to external references

## Irrigation Overlay

A **visual annotation layer** on the map — no structured data model required. Users can draw lines, shapes, and place labeled markers (e.g., "drip zone A", "rain barrel", "sprinkler head"). No throughput, sizing, or range tracking.

## Reporting & Queries

- Query plantings by property, bed, species, purchase date, bloom time, etc.
- Cross-property queries to identify plants that succeeded in one location as candidates for another
- Specific report views TBD (e.g., seasonal maintenance calendar, purchase history, by sun/moisture zone)

## Authentication

- Simple **username/password** auth managed within the application stack
- Small fixed user list (family members); comments and edits are attributed to the logged-in user
- Future: migrate to external OAuth provider (Google, etc.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (TypeScript) |
| Map | MapLibre GL JS + OpenStreetMap / free satellite tiles |
| Backend | Node.js / TypeScript |
| Database | PostgreSQL + PostGIS |
| Migrations | Prisma (or equivalent TypeScript-native migration tool) |
| Containerization | Docker Compose (full stack for production; dev runs frontend + backend locally, DB via Compose with persistent volume) |

## Development Approach

- **Incremental, agile** — small units of complete, testable, deployable functionality
- **MVP first**: get the map + bed drawing + basic plant tracking working before irrigation, reports, or advanced catalog features
- Suggested build order:
  1. Project scaffolding (Docker Compose, DB, auth, basic routing)
  2. Property management (CRUD)
  3. Map display + parcel import
  4. Garden bed drawing and editing
  5. Plant catalog
  6. Plant instances per bed (photos, comments, links)
  7. Irrigation overlay
  8. Reporting views

## Browser Support

- Modern browsers: **Firefox, Chrome, Brave** (primary targets)
- IE/Edge compatibility: nice-to-have, not required

## Deployment

- Self-hosted on local network **or** cloud-hosted (AWS)
- Docker Compose packaging makes both straightforward
