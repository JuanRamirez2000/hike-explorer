// Supabase Edge Function — Deno runtime
// Computes cumulative viewshed for a hike from Mapbox Terrain-RGB tiles.
// Returns 202 immediately; computation continues via EdgeRuntime.waitUntil.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PNG } from "npm:pngjs";

// ── env ───────────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN         = process.env.MAPBOX_TOKEN ?? "";
const SUPABASE_URL         = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ── types and geo helpers (inlined — forced by Deno runtime) ─────────────────
// The Deno runtime cannot resolve Next.js @/ path aliases, so the geo helpers
// from lib/geo.ts and viewshed types from types/viewshed.ts are duplicated here.
// If you change haversine, rdpDecimate, metersToDegreeLat/Lng, or the Observer
// type in either canonical file, mirror the change here.
// Longer-term fix: copy lib/geo.ts → supabase/functions/_shared/geo.ts via a
// build step so both runtimes share source without a full monorepo package.

type TrackPoint = { lat: number; lng: number; elevation: number };
type Observer   = TrackPoint;

// ── RDP decimation ────────────────────────────────────────────────────────────

function perpDistM(pt: TrackPoint, a: TrackPoint, b: TrackPoint): number {
  const cosLat = Math.cos((a.lat * Math.PI) / 180);
  const px = (pt.lng - a.lng) * 111_320 * cosLat;
  const py = (pt.lat - a.lat) * 111_320;
  const dx = (b.lng - a.lng) * 111_320 * cosLat;
  const dy = (b.lat - a.lat) * 111_320;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt(px * px + py * py);
  return Math.abs(px * dy - py * dx) / Math.sqrt(len2);
}

function rdpDecimate(pts: TrackPoint[], toleranceM: number): TrackPoint[] {
  if (pts.length <= 2) return pts;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDistM(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > toleranceM) {
    const left  = rdpDecimate(pts.slice(0, maxIdx + 1), toleranceM);
    const right = rdpDecimate(pts.slice(maxIdx),         toleranceM);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

// ── observer sampling ─────────────────────────────────────────────────────────

function haversineM(a: TrackPoint, b: TrackPoint): number {
  const R = 6_371_000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function sampleObservers(pts: TrackPoint[], intervalM: number): Observer[] {
  if (pts.length === 0) return [];
  const result: Observer[] = [pts[0]];
  let accumulated = 0, next = intervalM;
  for (let i = 1; i < pts.length; i++) {
    accumulated += haversineM(pts[i - 1], pts[i]);
    if (accumulated >= next) { result.push(pts[i]); next += intervalM; }
  }
  const last = pts[pts.length - 1];
  const lastAdded = result[result.length - 1];
  if (lastAdded.lat !== last.lat || lastAdded.lng !== last.lng) result.push(last);
  return result;
}

// ── DEM tile helpers ──────────────────────────────────────────────────────────

const TILE_ZOOM = 14;
const TILE_SIZE = 512;

// ⚠️ OPEN TASK: tile cache below is in-memory per-invocation only.
// A durable cache in Supabase Storage would avoid re-fetching tiles across runs.
const tileCache = new Map<string, Float32Array>();

function lngLatToTile(lng: number, lat: number): { x: number; y: number } {
  const n = 2 ** TILE_ZOOM;
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

function lngLatToPixel(lng: number, lat: number, tx: number, ty: number): { px: number; py: number } {
  const n = 2 ** TILE_ZOOM;
  const gx = (lng + 180) / 360 * n * TILE_SIZE;
  const latRad = lat * Math.PI / 180;
  const gy = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n * TILE_SIZE;
  return {
    px: Math.max(0, Math.min(TILE_SIZE - 1, Math.floor(gx - tx * TILE_SIZE))),
    py: Math.max(0, Math.min(TILE_SIZE - 1, Math.floor(gy - ty * TILE_SIZE))),
  };
}

async function fetchTile(x: number, y: number): Promise<Float32Array | null> {
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${TILE_ZOOM}/${x}/${y}.pngraw?access_token=${MAPBOX_TOKEN}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const buf = await resp.arrayBuffer();
  const png = PNG.sync.read(Buffer.from(buf));
  const elevations = new Float32Array(png.width * png.height);
  for (let i = 0; i < png.width * png.height; i++) {
    const r = png.data[i * 4], g = png.data[i * 4 + 1], b = png.data[i * 4 + 2];
    elevations[i] = -10_000 + (r * 65_536 + g * 256 + b) * 0.1;
  }
  return elevations;
}

async function getElevation(lng: number, lat: number): Promise<number | null> {
  const { x, y } = lngLatToTile(lng, lat);
  const key = `${x}/${y}`;
  if (!tileCache.has(key)) {
    const data = await fetchTile(x, y);
    if (!data) return null;
    tileCache.set(key, data);
  }
  const { px, py } = lngLatToPixel(lng, lat, x, y);
  return tileCache.get(key)![py * TILE_SIZE + px];
}

// ── viewshed algorithm ────────────────────────────────────────────────────────

const NUM_RAYS     = 72;
// Intentionally 1.5 km — this edge function is a server-side draft/preview pass.
// The client-side computation (VIEWSHED_DEFAULTS.maxRadiusM = 50_000) runs the
// full 50 km pass locally. Until the two are reconciled the stored fog_geojson
// reflects only the 1.5 km radius; do not compare the two results directly.
const MAX_RADIUS_M = 1_500;
const STEP_M       = 25;
const OBSERVER_H   = 1.7;
const CELL_SIZE_M  = 25;

function metersToDegreeLat(m: number) { return m / 111_320; }
function metersToDegreeLng(m: number, lat: number) { return m / (111_320 * Math.cos(lat * Math.PI / 180)); }

async function computeSingleObserver(
  observer: Observer,
  refLat: number,
): Promise<Set<string>> {
  const visible = new Set<string>();
  const latCell = metersToDegreeLat(CELL_SIZE_M);
  const lngCell = metersToDegreeLng(CELL_SIZE_M, refLat);

  const groundEle = (await getElevation(observer.lng, observer.lat)) ?? observer.elevation;
  const observerEle = groundEle + OBSERVER_H;

  for (let r = 0; r < NUM_RAYS; r++) {
    const bearing = ((360 / NUM_RAYS) * r * Math.PI) / 180;
    let maxHorizon = -Infinity;
    for (let dist = STEP_M; dist <= MAX_RADIUS_M; dist += STEP_M) {
      const lat = observer.lat + metersToDegreeLat(dist * Math.cos(bearing));
      const lng = observer.lng + metersToDegreeLng(dist * Math.sin(bearing), observer.lat);
      const terrainEle = await getElevation(lng, lat);
      if (terrainEle === null) continue;
      const elevAngle = Math.atan2(terrainEle - observerEle, dist);
      if (elevAngle >= maxHorizon) {
        maxHorizon = elevAngle;
        visible.add(`${Math.floor(lat / latCell)},${Math.floor(lng / lngCell)}`);
      }
    }
  }
  return visible;
}

// ── GeoJSON output ────────────────────────────────────────────────────────────

function buildGeoJSON(cells: Set<string>, refLat: number): object {
  const latCell = metersToDegreeLat(CELL_SIZE_M);
  const lngCell = metersToDegreeLng(CELL_SIZE_M, refLat);
  const features = [];
  for (const key of cells) {
    const comma = key.indexOf(",");
    const ci = parseInt(key.slice(0, comma), 10);
    const cj = parseInt(key.slice(comma + 1), 10);
    const minLat = ci * latCell, maxLat = (ci + 1) * latCell;
    const minLng = cj * lngCell, maxLng = (cj + 1) * lngCell;
    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]] },
      properties: {},
    });
  }
  return { type: "FeatureCollection", features };
}

// ── main computation ──────────────────────────────────────────────────────────

async function runComputation(hikeId: string, adminClient: ReturnType<typeof createClient>): Promise<void> {
  try {
    const { data: points, error: ptErr } = await adminClient
      .from("track_points")
      .select("lat, lng, elevation")
      .eq("hike_id", hikeId)
      .order("seq");

    if (ptErr || !points?.length) throw new Error(ptErr?.message ?? "No track points");

    const decimated = rdpDecimate(points as TrackPoint[], 10);
    const observers = sampleObservers(decimated, 100);

    const refLat = observers.reduce((s, o) => s + o.lat, 0) / observers.length;
    const allVisible = new Set<string>();

    for (const observer of observers) {
      const cells = await computeSingleObserver(observer, refLat);
      for (const k of cells) allVisible.add(k);
    }

    const geojson = buildGeoJSON(allVisible, refLat);

    const { error: updateErr } = await adminClient
      .from("hikes")
      .update({ fog_status: "complete", fog_geojson: geojson })
      .eq("id", hikeId);

    if (updateErr) throw new Error(updateErr.message);
  } catch (err) {
    console.error("compute-viewshed error:", err);
    await adminClient.from("hikes").update({ fog_status: "error" }).eq("id", hikeId);
  }
}

// ── handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization") ?? "";

  // Verify user via anon client + their JWT
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { hikeId } = await req.json() as { hikeId: string };
  if (!hikeId) {
    return new Response(JSON.stringify({ error: "Missing hikeId" }), { status: 400 });
  }

  // Confirm ownership
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: hike } = await adminClient
    .from("hikes")
    .select("id")
    .eq("id", hikeId)
    .eq("user_id", user.id)
    .single();

  if (!hike) {
    return new Response(JSON.stringify({ error: "Hike not found" }), { status: 404 });
  }

  // Run computation after response using waitUntil (if available)
  const computePromise = runComputation(hikeId, adminClient);
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil?.(computePromise);

  return new Response(JSON.stringify({ status: "processing" }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
});
