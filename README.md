# Hike Explorer

A Next.js app for uploading GPX files and visualising hikes in 3D with a cumulative viewshed overlay.

## Getting Started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- GPX upload with live stats preview
- 3D map with terrain exaggeration (Mapbox GL + deck.gl)
- Elevation profile and pace chart
- **Cumulative viewshed** — highlights every patch of terrain visible from any point on the route

---

## Cumulative Viewshed Pipeline

### What it does

For every sampled point along the hike, the system computes which terrain cells are visible
(radial ray-casting against a DEM). All per-observer viewsheds are unioned into one cumulative
polygon showing the total area the hiker could see. The result is stored in `hikes.fog_geojson`
and rendered as a dark-blue semi-transparent overlay on the map.

### Trigger

Viewshed computation is kicked off **automatically when a hike is saved** (`saveHike` server
action). It is also retriggerable from the map page via the "Compute Viewshed" / "Recompute"
button.

Both paths call the same Supabase Edge Function:

```
POST {SUPABASE_URL}/functions/v1/compute-viewshed
Authorization: Bearer <user-jwt>
Body: { "hikeId": "<uuid>" }
```

The function returns **202 Accepted** immediately and runs the computation in the background
via `EdgeRuntime.waitUntil`. The hike's `fog_status` transitions:

```
pending → processing  (set by server action before fetch)
processing → complete (set by Edge Function on success)
processing → error    (set by Edge Function on failure)
```

### Edge Function — `supabase/functions/compute-viewshed/index.ts`

| Step | Detail |
|------|--------|
| Runtime | Deno (Supabase Edge Functions) |
| DEM source | Mapbox Terrain-RGB tiles (`mapbox.terrain-rgb`, zoom 14) |
| Tile decode | `npm:pngjs`; formula: `elevation = -10000 + (R×65536 + G×256 + B) × 0.1` |
| Decimation | **RDP at 10 m tolerance** before any ray-casting (required — never cast raw GPS) |
| Sampling | One observer every 100 m along the decimated track |
| Algorithm | Radial ray-casting: 72 rays × 60 steps × 25 m/step = 1 500 m radius |
| Cell grid | 25 m cells; all observers share one reference latitude for aligned cell keys |
| Output | GeoJSON `FeatureCollection` of visible 25 m square polygons |
| Storage | `hikes.fog_geojson` (JSONB), `hikes.fog_status` = `'complete'` |

### ⚠️ Open Task — DEM Tile Cache

The in-memory `Map<tileKey, Float32Array>` cache in the Edge Function lives for **one
invocation only**. Tiles are not reused across separate function calls or hikes with
overlapping areas. A durable cache (e.g. Supabase Storage) must be designed before
production to control Mapbox tile-fetch costs.

### Frontend State

Three independent state variables — never conflate them:

| Variable | Tracks |
|----------|--------|
| `uploadStatus` | GPX file upload pipeline |
| `fogStatus` | Viewshed computation pipeline |
| `fogGeoJson` | Rendered polygon from `hikes.fog_geojson` |

### Required Environment Variables

```
NEXT_PUBLIC_MAPBOX_TOKEN       # Mapbox GL public token
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
DATABASE_URL                   # Postgres connection string (Drizzle)

# Edge Function only (Supabase dashboard → Settings → Edge Functions)
MAPBOX_TOKEN                   # Server-side token for Terrain-RGB tile fetching
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Map**: react-map-gl / Mapbox GL JS / deck.gl
- **Database**: Supabase (Postgres) via Drizzle ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (GPX files)
- **Viewshed compute**: Supabase Edge Functions (Deno)
- **DEM data**: Mapbox Terrain-RGB raster tiles
