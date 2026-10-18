# User Guide

[Docs home](../index.md)

## What works today

Hamadryad is early in development — the only end-user-facing functionality right now is signing in:

1. Navigate to the app; you're redirected to `/login` if you don't have a valid session.
2. Sign in with the email/password for your account (an administrator provisions accounts — there is no public sign-up).
3. On success you land on `/homes`, currently a placeholder page confirming you're signed in.
4. Your session refreshes automatically in the background; you generally don't need to log in again unless the refresh token itself expires (30 days by default) or you explicitly sign out on a device.

## What's coming

The planned application lets you:

- Manage multiple properties ("homes"), each broken into yards (front/back/side).
- Import a property's lot boundary and draw garden beds on a real map.
- Track individual plantings within each bed — purchase info, photos, and a comment log — against a shared plant species catalog.
- Sketch an irrigation annotation layer over the map.
- Run cross-property reports (e.g., "what did well at home A that might work at home B?").

See the [product concept](../../concept.md) for the full vision and the [roadmap](../../plan.md) for delivery order. This page will grow section by section as each sprint ships.
