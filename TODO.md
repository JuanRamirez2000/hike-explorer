# TODO

## In Progress

### Supabase Edge Functions — Study Before Continuing
Read up on Supabase Edge Function deployment, secrets management, and local testing before
continuing viewshed work. Key areas: `supabase functions deploy`, setting secrets via the
dashboard vs. CLI, local invocation with `supabase functions serve`, and how `process.env`
resolves at runtime vs. `Deno.env.get`.

Related open tasks once studied:
- Deploy `supabase/functions/compute-viewshed/index.ts` to Supabase
- Wire the polling UI in `HikeMapView` so `fogStatus` updates automatically after computation
- Design a durable DEM tile cache in Supabase Storage (currently in-memory per invocation only)

---

## Upcoming

### Search / Filter on Dashboard
Add a client-side search input at the top of `/user` to filter hikes by name. All data is
already fetched — needs a controlled input + `.filter()` on `userHikes`. Requires either
converting the page to a client component or extracting a `HikeGrid` client component that
receives the hike list as props.

### Hover Tooltip — Chart ↔ Map Sync
When hovering over the elevation or pace chart (in `HikeInfoCard` or `HikeCard`), highlight
the corresponding point on the map path, and vice versa. Requires lifting hover index state
to a shared parent between `HikeInfoCard` and the deck.gl layers, plus wiring recharts
`onMouseMove` to a shared callback.

### GPX Waypoints on Map
If the uploaded GPX contains `<wpt>` elements (campsites, summits, photo spots), render them
as a distinct marker layer on the map. The parser already traverses `gpx.gpx.wpt` — just
needs to surface that data alongside track points and add an `IconLayer` or `ScatterplotLayer`
in `HikeMapView`.

---

## Backlog

### Duplicate Detection on Upload
Before `saveHike()` commits, query for an existing hike with the same `start_time` and
`distance_km`. If a match is found, surface a warning on the upload page so the user can
decide whether to proceed.

### CSV / JSON Export per Hike
Add an export button to each `HikeCard` that serializes the hike's track points into a
`.csv` or `.json` blob and triggers a browser download. No new API routes needed — track
points are in the DB and accessible via a server action.

### Total Stats Banner
Show a summary banner at the top of the `/user` dashboard with cumulative stats: total hikes,
total distance, total elevation gain, total time. Pure frontend aggregation over the
already-fetched `userHikes` array.
