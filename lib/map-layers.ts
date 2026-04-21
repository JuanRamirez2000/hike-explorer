import type { FeatureCollection, Polygon } from "geojson";
import type { TrackPointSummary } from "@/types/models";
import { haversineKm, cumulativeDistancesKm } from "@/lib/geo";
import { lerpColor } from "@/lib/chart-utils";
import { MI_TO_KM, fmtElevation, type UnitSystem } from "@/lib/format";

// ── color gradients ───────────────────────────────────────────────────────────

export const ELEVATION_GRADIENT: [number, number, number][] = [
  [59, 130, 246],
  [34, 197, 94],
  [234, 179, 8],
  [239, 68, 68],
];

export const PACE_GRADIENT: [number, number, number][] = [
  [34, 197, 94],
  [234, 179, 8],
  [239, 68, 68],
];

const PACE_MIN_KM = 3;
const PACE_MAX_KM = 20;
const MAX_PACE_SEGMENT = 30;

export const PIN_COLORS: Record<string, [number, number, number]> = {
  start: [34, 197, 94],
  end: [239, 68, 68],
  highest: [168, 85, 247],
  lowest: [234, 179, 8],
};

// ── layer data builders ───────────────────────────────────────────────────────

export function buildPins(pts: TrackPointSummary[], unit: UnitSystem) {
  if (pts.length === 0) return [];
  let hi = 0, lo = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].elevation > pts[hi].elevation) hi = i;
    if (pts[i].elevation < pts[lo].elevation) lo = i;
  }
  return [
    { id: "start", pt: pts[0], label: "Start" },
    { id: "end", pt: pts[pts.length - 1], label: "End" },
    { id: "highest", pt: pts[hi], label: `▲ ${fmtElevation(pts[hi].elevation, unit)}` },
    { id: "lowest", pt: pts[lo], label: `▼ ${fmtElevation(pts[lo].elevation, unit)}` },
  ];
}

export function buildElevationColors(pts: TrackPointSummary[]): [number, number, number][] {
  const elevs = pts.map((p) => p.elevation);
  const min = Math.min(...elevs);
  const max = Math.max(...elevs);
  const range = max - min || 1;
  return elevs.map((e) => lerpColor(ELEVATION_GRADIENT, (e - min) / range));
}

export function buildPaceColors(pts: TrackPointSummary[]): [number, number, number][] | null {
  if (!pts.some((p) => p.timestamp)) return null;

  const segPaces: (number | null)[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    if (!p1.timestamp || !p2.timestamp) { segPaces.push(null); continue; }
    const dtMin = (new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime()) / 60000;
    const dist = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng);
    if (dist < 0.001 || dtMin <= 0) { segPaces.push(null); continue; }
    const pace = dtMin / dist;
    segPaces.push(pace < MAX_PACE_SEGMENT ? pace : null);
  }

  const vertPaces = pts.map((_, i) => {
    const a = i > 0 ? segPaces[i - 1] : null;
    const b = i < segPaces.length ? segPaces[i] : null;
    const vals = [a, b].filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  });

  const valid = vertPaces.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;

  const range = PACE_MAX_KM - PACE_MIN_KM;
  return vertPaces.map((p) => {
    const t = p !== null ? Math.max(0, Math.min(1, (p - PACE_MIN_KM) / range)) : 0.5;
    return lerpColor(PACE_GRADIENT, t);
  });
}

export function buildDistanceMarkers(pts: TrackPointSummary[], unit: UnitSystem) {
  if (pts.length === 0) return [];
  const intervalKm = unit === "imperial" ? MI_TO_KM : 1;
  const suffix = unit === "imperial" ? "mi" : "km";
  const cumDists = cumulativeDistancesKm(pts);
  const markers: { pt: TrackPointSummary; label: string }[] = [];
  let next = intervalKm;
  let idx = 1;
  for (let i = 1; i < pts.length; i++) {
    if (cumDists[i] >= next) {
      markers.push({ pt: pts[i], label: `${idx} ${suffix}` });
      next += intervalKm;
      idx++;
    }
  }
  return markers;
}

// Shoelace area for a GeoJSON FeatureCollection of Polygons, returns km²
export function geojsonAreaKm2(fc: FeatureCollection): number {
  let totalM2 = 0;
  for (const feature of fc.features) {
    const geom = feature.geometry;
    if (geom.type !== "Polygon") continue;
    for (const ring of (geom as Polygon).coordinates) {
      const midLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      const latM = 111_320;
      const lngM = 111_320 * Math.cos((midLat * Math.PI) / 180);
      let a = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        a += ring[j][0] * lngM * (ring[i][1] * latM);
        a -= ring[i][0] * lngM * (ring[j][1] * latM);
      }
      totalM2 += Math.abs(a) / 2;
    }
  }
  return totalM2 / 1_000_000;
}
