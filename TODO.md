# TODO

## In Progress

### Supabase Edge Functions — Study Before Continuing
Read up on Supabase Edge Function deployment, secrets management, and local testing before
continuing viewshed work. Key areas: `supabase functions deploy`, setting secrets via the
dashboard vs. CLI, local invocation with `supabase functions serve`, and how `process.env`
resolves at runtime vs. `Deno.env.get`.

**Current state:** Viewshed is computed client-side via the manual "Compute Viewshed" button
in `HikeMapView`. This is intentional until the edge function is deployed.

Related open tasks once studied:
- Deploy `supabase/functions/compute-viewshed/index.ts` to Supabase
- Replace or supplement the manual button with server-side background computation
- Wire the polling UI in `HikeMapView` so `fogStatus` updates automatically after computation
- Design a durable DEM tile cache in Supabase Storage (currently in-memory per invocation only)
- Ensure the edge function output includes per-cell `dist` data (see `buildGeoJSON`) for the
  distance-based opacity fade to work on server-computed results

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

---

## Viewshed — Advanced Performance Options
Consider these when the app gets more technically demanding. All changes live in
`lib/viewshed.ts` and `components/MapComponents/HikeMapView.tsx`.

### Early ray termination
Once the terrain angle on a ray stops being able to beat the current horizon angle (e.g. the
remaining distance is too short to rise above it even at max plausible grade), break out of
the inner loop early. Big win on ridged terrain; negligible on flat ground.

### Elevation grid snapshot
Before ray-casting, snapshot a bounding-box elevation grid from `queryTerrainElevation` into a
`Float32Array`. Array lookups are ~10–100× faster than repeated GL state reads. Requires knowing
the spatial extent of the route up front (bbox is already stored on the hike record).

### Web Worker
Move all computation into a dedicated Web Worker so the main thread is never blocked regardless
of radius or observer count. The current `setTimeout`-chunked loop approximates this but still
runs on the main thread. A real Worker enables much larger radii without any UI jank.

### Increase numRays at long range
At 12 km, 72 rays (5° apart) leaves ~1 050 m gaps between adjacent endpoints. Bumping to
360 rays (1°) gives ~210 m gaps for sharper distant ridge detection. Pair with adaptive step
size so the extra rays don't multiply compute linearly.

### Coarse-to-fine multi-pass
First pass: 18 rays at coarse step → identify open angular sectors.
Second pass: 72–360 rays, finer step, only in open sectors.
Blocked sectors (behind ridges) get zero rays in the refine pass — large win on complex terrain.

### GPU-based computation (long-term)
Use a WebGL framebuffer or WebGPU compute shader to run all ray-casting in parallel on the GPU.
Orders of magnitude faster but high implementation complexity. Only worth it if real-time or
on-upload computation is needed for very long routes.
