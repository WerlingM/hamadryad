# User Guide

[Docs home](../index.md)

## What works today

### Signing in

1. Navigate to the app; you're redirected to the login page if you don't have a valid session.
2. Sign in with the email/password for your account (an administrator provisions accounts — there is no public sign-up).
3. Your session refreshes automatically in the background; you generally don't need to log in again unless 30 days pass without using the app.

### Homes

After signing in you land on **Your homes**, a list of every property you have access to, with its address and yards.

- **Add a home:** click **Add home**, enter a name and address (notes are optional), and click **Create home**. You become its owner.
- **Open a home:** click it in the list to open its map, with the home's details and yards in the panel on the left.
- **Edit a home:** in the panel, click **Edit** to change its name, address, or notes.
- **Delete a home:** in the panel, click **Delete**. This also deletes all of its yards and can't be undone. Only the home's owner can do this.

### The home map

The map shows the area around the home. Use the **Map** / **Satellite** buttons at the top left to switch between a street map and aerial imagery, and the controls at the top right to zoom and rotate (drag with the right mouse button, or two fingers, to tilt or turn).

**Importing your lot boundary:** click **Import lot boundary** and choose a GeoJSON file (`.geojson` or `.json`) of your property. Many county GIS websites let you download a parcel this way. The map zooms to the lot and outlines it in yellow. To fix a wrong boundary, click **Replace lot boundary** and pick another file.

If the import is rejected:
- *"Coordinates don't look like longitude/latitude"* or *"uses coordinate system …"* — the file is in a local survey coordinate system. Look for a download option labelled WGS 84, EPSG:4326, or "latitude/longitude", or convert the file with a free tool such as QGIS or mapshaper.org.
- *"No polygon boundary was found"* — the file holds points or lines, not an area.

### Yards

Each home is divided into yards, such as the front yard and back yard. They're listed on the home's page.

- **See a yard's beds:** click the yard's name to expand it. Drawing beds on the map arrives in a later update.
- **Add a yard:** fill in the **Add a yard** form with a name and location (front, back, left side, right side, or other) and an optional description.
- **Rename or change a yard:** click **Edit** next to the yard, change it, and click **Save**.
- **Delete a yard:** click **Delete** next to the yard.

People with view-only access to a home can see it and its yards but won't see the edit and delete buttons.

## What's coming

The planned application lets you:

- Manage multiple properties ("homes"), each broken into yards (front/back/side).
- Import a property's lot boundary and draw garden beds on a real map.
- Track individual plantings within each bed — purchase info, photos, and a comment log — against a shared plant species catalog.
- Sketch an irrigation annotation layer over the map.
- Run cross-property reports (e.g., "what did well at home A that might work at home B?").

See the [product concept](../../concept.md) for the full vision and the [roadmap](../../plan.md) for delivery order. This page will grow section by section as each sprint ships.
