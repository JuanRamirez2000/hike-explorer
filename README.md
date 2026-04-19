# Hike Explorer

A full-stack web application for uploading, analysing, and visualising GPX hiking tracks in interactive 3D. Built with Next.js App Router, Supabase, Mapbox GL, and deck.gl.

---

## Overview

Hike Explorer turns a raw `.gpx` file into a rich, interactive experience. Upload a hike, immediately see computed stats (distance, elevation gain, pace), then open the 3D map view to fly around the route in terrain mode. The application also computes a **cumulative viewshed** — a geometric calculation of every patch of land the hiker could see from any point on the route — rendered as a semi-transparent overlay draped on the terrain mesh.

The project is designed to showcase full-stack engineering: data modelling and schema design, server-side computation via a Supabase Edge Function, Row-Level Security, clean component architecture, and original algorithm implementation.

---

## Features

### Implemented

| Feature | Detail |
|---------|--------|
| **GPX Upload** | Parse `.gpx` files client-side; preview computed stats before saving |
| **Editable Metadata** | Override name, date, and device/creator before or after save |
| **3D Terrain Map** | Mapbox GL + deck.gl; terrain exaggeration, pitch, bearing controls |
| **Route Visualisation** | GPX track rendered as a 3D `PathLayer` colour-coded by elevation using a red → yellow → green gradient |
| **Elevation Profile Chart** | Recharts `AreaChart` with a matching red–green–blue gradient fill; metric / imperial toggle |
| **Pace Chart** | Smoothed `LineChart` with a rolling average reference line; segments with no timestamp or unrealistic pace are filtered |
| **Hike Management** | Edit metadata inline, delete with confirmation modal, navigate directly to map |
| **Secure File Storage** | Raw `.gpx` stored in Supabase Storage under a per-user path; Row-Level Security prevents cross-user access |
| **Cumulative Viewshed** | Server-side ray-casting computes every terrain cell visible from the route; result stored in DB and rendered as a dark-blue terrain-draped fill layer |
| **Auto-trigger on Save** | Viewshed computation starts immediately when a hike is saved, before the user visits the map |
| **Recompute / Retry** | Map page exposes a viewshed control panel to trigger recomputation or retry after an error |

### Planned

- **Dashboard search / filter** — filter hike list by name client-side
- **Chart ↔ Map sync** — hovering a chart point highlights the corresponding GPS coordinate on the map path
- **GPX waypoints** — render `<wpt>` elements (summits, campsites) as a separate icon layer
- **Duplicate detection** — warn before saving a hike with a matching start time and distance
- **CSV / JSON export** — download track points as a file from any hike card
- **Stats banner** — aggregate totals (distance, elevation, time) across all hikes

---

## Technical Architecture

### Request Flow

```
Browser
  │
  ├─ /user (server page)
  │    └─ Drizzle query → hikes + track points → renders HikeCard grid
  │
  ├─ /upload (client page)
  │    ├─ GPX parser (client-side, Web APIs only)
  │    └─ saveHike() server action
  │         ├─ Supabase Storage upload (raw GPX)
  │         ├─ Drizzle insert (hike row + track point rows, chunked)
  │         └─ fetch → Supabase Edge Function (fire-and-forget, awaits 202)
  │
  └─ /hike/[id]/map (server page)
       └─ Drizzle query → hike + track points → HikeMapLoader → HikeMapView
            ├─ Mapbox GL (terrain, base layer)
            ├─ deck.gl PathLayer (route)
            ├─ Mapbox native fill layer (viewshed — terrain-draped)
            └─ triggerViewshed() server action → Edge Function on demand
```

### Viewshed Pipeline

The most technically involved feature. Runs server-side in a Supabase Edge Function:

```
Track points (raw GPS)
  │
  ▼
RDP decimation (10 m tolerance)       ← must run first; never ray-cast raw GPS
  │
  ▼
Observer sampling (every 100 m)
  │
  ▼
For each observer:
  ├─ Fetch Mapbox Terrain-RGB tiles (zoom 14, cached per invocation)
  ├─ Decode RGBA → elevation grid  [formula: -10000 + (R×65536 + G×256 + B) × 0.1]
  └─ Cast 72 rays × 60 steps × 25 m  (1 500 m radius)
       └─ horizon-angle test: cell is visible if elevation angle ≥ max seen so far
  │
  ▼
Union all visible cell sets (25 m grid, aligned to shared refLat)
  │
  ▼
Build GeoJSON FeatureCollection of visible polygons
  │
  ▼
UPDATE hikes SET fog_geojson = …, fog_status = 'complete'
```

The function returns **202 Accepted** immediately and uses `EdgeRuntime.waitUntil` so the heavy computation continues after the HTTP response. The client UI polls `fog_status` and renders the overlay when `'complete'`.

### Key Design Decisions

**RDP before ray-casting** — Ramer-Douglas-Peucker decimation (10 m tolerance) reduces a 5 000-point GPS track to ~200 points before any geometry is touched. Without this, the Edge Function would time out and Mapbox tile costs would be prohibitive.

**Mapbox fill layer, not deck.gl** — The viewshed overlay is added as a Mapbox native `fill` layer, not a deck.gl `GeoJsonLayer`. Mapbox fill layers are automatically draped on the terrain mesh; deck.gl layers render at Z=0 and get occluded by the terrain.

**Chunked track point inserts** — Track points are inserted in batches of 1 000 to stay within Postgres parameter limits and avoid large single transactions.

**`useSyncExternalStore` for SSR guard** — Recharts does not support SSR. Instead of `useEffect(() => setMounted(true), [])` (which triggers cascading renders), the charts use `useSyncExternalStore` with a `() => false` server snapshot and `() => true` client snapshot — the React-recommended pattern for hydration guards.

**Independent fog state variables** — `uploadStatus`, `fogStatus`, and `fogGeoJson` are never conflated. The viewshed pipeline has its own lifecycle (`pending → processing → complete | error`) fully separate from the upload pipeline.

**Cell grid alignment** — All observers in a single viewshed run share one `refLat` (midpoint of the observer bbox) so that cell keys from different observers land on the same grid. Without this, cell edges shift per-observer and the union produces overlapping polygons.

---

## Data Model

```
users
  id            uuid PK
  email         text

hikes
  id            uuid PK
  user_id       uuid FK → users
  name          text
  date          date
  creator       text              -- device / app (e.g. "Garmin Connect")
  bbox          real[4]           -- [minLng, minLat, maxLng, maxLat]
  distance_km   float8
  elevation_gain_m float8
  duration_seconds float8
  start_time    timestamptz
  end_time      timestamptz
  gpx_storage_path text           -- path in Supabase Storage bucket
  fog_status    fog_status_enum   -- pending | processing | complete | error
  fog_geojson   jsonb             -- GeoJSON FeatureCollection of visible cells
  extra         jsonb             -- reserved for future unstructured metadata
  created_at    timestamptz

track_points
  id            bigserial PK
  hike_id       uuid FK → hikes  (ON DELETE CASCADE)
  seq           int               -- original GPS order
  lat           float8
  lng           float8
  elevation     float8
  timestamp     timestamptz

user_preferences
  user_id       uuid PK FK → users
  viz_preferences jsonb
```

Row-Level Security is enabled. Every table has a policy restricting reads and writes to `auth.uid() = user_id`.

---

## Directory Structure

```
app/
  layout.tsx                  root layout, navbar
  page.tsx                    landing / login
  upload/page.tsx             GPX upload flow
  user/page.tsx               hike dashboard
  hike/[id]/map/page.tsx      3D map view

components/
  HikeComponents/
    HikeCard.tsx              dashboard card (stats + charts + edit/delete)
    HikeCharts.tsx            shared elevation + pace chart pair
    HikeFieldsForm.tsx        shared name / date / creator inputs
    EditHikeForm.tsx          inline edit wrapper
    DeleteHikeModal.tsx       confirmation dialog
    ElevationProfileChart.tsx recharts AreaChart
    PaceChart.tsx             recharts LineChart with smoothing
  MapComponents/
    HikeMapView.tsx           Mapbox GL + deck.gl map, viewshed controls
    HikeMapLoader.tsx         dynamic import wrapper (disables SSR)
    HikeInfoCard.tsx          floating stats panel on map
  StatRow.tsx                 reusable table row
  Navbar.tsx

lib/
  geo.ts                      haversine, RDP decimation, degree/meter conversions,
                              cumulative distance, downsampling, colour interpolation
  format.ts                   unit conversion helpers, display formatters
  viewshed.ts                 observer sampling, ray-casting, GeoJSON builder
  hike-actions.ts             server actions (save, delete, update, triggerViewshed)
  gpx-parser.ts               client-side GPX → payload
  session.ts                  getCurrentUser() helper

types/
  models.ts                   Drizzle inferred types + TrackPointSummary
  viewshed.ts                 Observer, ViewshedOptions, ViewshedProgress
  hike-upload.ts              GPXMetadataSummary, ParsedHikePayload, UploadResult

db/
  index.ts                    Drizzle client
  schema.ts                   table and enum definitions

supabase/
  functions/
    compute-viewshed/
      index.ts                Edge Function — full viewshed pipeline
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, server components, server actions) |
| Language | TypeScript |
| Styling | Tailwind CSS + DaisyUI |
| Map | Mapbox GL JS + react-map-gl + deck.gl |
| Charts | Recharts |
| Database | Supabase (Postgres) via Drizzle ORM |
| Auth | Supabase Auth (JWT, Row-Level Security) |
| File Storage | Supabase Storage |
| Server Compute | Supabase Edge Functions (Deno) |
| DEM Data | Mapbox Terrain-RGB raster tiles |
| Package Manager | pnpm |

---

## Environment Variables

```bash
# Next.js (.env.local)
NEXT_PUBLIC_MAPBOX_TOKEN        # Mapbox GL public token
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key
DATABASE_URL                    # Postgres connection string (Drizzle)

# Edge Function (Supabase dashboard → Settings → Edge Functions → Secrets)
MAPBOX_TOKEN                    # Server-side token for Terrain-RGB tile fetches
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. Upload any `.gpx` file to get started.
