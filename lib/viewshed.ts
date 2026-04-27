import type { FeatureCollection, Feature, Polygon, MultiPolygon, Point } from "geojson";
import turfUnion from "@turf/union";
import turfDifference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import type { TrackPointSummary } from "@/types/models";
import { haversineM, metersToDegreeLat, metersToDegreeLng } from "@/lib/geo";
import type {
  Observer,
  GetElevationFn,
  ViewshedOptions,
  ViewshedProgress,
} from "@/types/viewshed";
import { VIEWSHED_DEFAULTS } from "@/types/viewshed";

export type { Observer, GetElevationFn, ViewshedOptions, ViewshedProgress };
export { VIEWSHED_DEFAULTS };

// ── observer sampling ─────────────────────────────────────────────────────────

export function sampleObservers(
  trackPoints: TrackPointSummary[],
  intervalM = 100,
): Observer[] {
  if (trackPoints.length === 0) return [];

  const result: Observer[] = [trackPoints[0]];
  let accumulated = 0;
  let nextThreshold = intervalM;

  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];
    accumulated += haversineM(prev.lat, prev.lng, curr.lat, curr.lng);
    if (accumulated >= nextThreshold) {
      result.push(curr);
      nextThreshold += intervalM;
    }
  }

  const last = trackPoints[trackPoints.length - 1];
  const lastAdded = result[result.length - 1];
  if (lastAdded.lat !== last.lat || lastAdded.lng !== last.lng) {
    result.push(last);
  }

  return result;
}

// ── single-observer viewshed ──────────────────────────────────────────────────

// Step size grows with distance — same angular resolution throughout the ray.
// baseStep 25 m → 25 m under 1 km, 75 m to 5 km, 200 m to 12 km, 500 m to 25 km, 1 000 m beyond.
function adaptiveStep(dist: number, baseStep: number): number {
  if (dist <  1_000) return baseStep;
  if (dist <  5_000) return baseStep * 3;
  if (dist < 12_000) return baseStep * 8;
  if (dist < 25_000) return baseStep * 20;
  return baseStep * 40;
}

// Returns a map of cell key → minimum distance (meters) at which the cell was seen.
export function computeSingleObserver(
  observer: Observer,
  getElevation: GetElevationFn,
  opts: Required<ViewshedOptions>,
  refLat: number,
): Map<string, number> {
  const visible = new Map<string, number>();
  const { numRays, maxRadiusM, stepM, observerHeightM, cellSizeM } = opts;

  const observerGroundEle = getElevation(observer.lng, observer.lat) ?? observer.elevation;
  const observerEle = observerGroundEle + observerHeightM;

  const latCellSize = metersToDegreeLat(cellSizeM);
  const lngCellSize = metersToDegreeLng(cellSizeM, refLat);

  for (let r = 0; r < numRays; r++) {
    const bearingRad = ((360 / numRays) * r * Math.PI) / 180;
    let maxHorizonAngle = -Infinity;

    let dist = stepM;
    while (dist <= maxRadiusM) {
      const step = adaptiveStep(dist, stepM);

      const lat = observer.lat + metersToDegreeLat(dist * Math.cos(bearingRad));
      const lng = observer.lng + metersToDegreeLng(dist * Math.sin(bearingRad), observer.lat);

      const terrainEle = getElevation(lng, lat);
      if (terrainEle === null) { dist += step; continue; }

      const elevAngle = Math.atan2(terrainEle - observerEle, dist);

      if (elevAngle >= maxHorizonAngle) {
        maxHorizonAngle = elevAngle;
        const cellI = Math.floor(lat / latCellSize);
        const cellJ = Math.floor(lng / lngCellSize);
        const key = `${cellI},${cellJ}`;
        const existing = visible.get(key);
        if (existing === undefined || dist < existing) {
          visible.set(key, dist);
        }
        // Early termination: horizon angle implies a wall taller than any plausible terrain
        // at the remaining range — nothing beyond can be visible on this ray.
        if (maxHorizonAngle > Math.atan2(3000, dist)) break;
      }

      dist += step;
    }
  }

  return visible;
}

// ── cumulative viewshed ───────────────────────────────────────────────────────

export function computeCumulativeViewshed(
  observers: Observer[],
  getElevation: GetElevationFn,
  opts: Required<ViewshedOptions>,
  onProgress?: (p: ViewshedProgress) => void,
): { cells: Map<string, number>; refLat: number } {
  if (observers.length === 0) return { cells: new Map(), refLat: 0 };

  const refLat = observers.reduce((s, o) => s + o.lat, 0) / observers.length;
  const allVisible = new Map<string, number>();

  for (let i = 0; i < observers.length; i++) {
    const visible = computeSingleObserver(observers[i], getElevation, opts, refLat);
    for (const [key, dist] of visible) {
      const existing = allVisible.get(key);
      if (existing === undefined || dist < existing) {
        allVisible.set(key, dist);
      }
    }
    onProgress?.({ processed: i + 1, total: observers.length, pct: ((i + 1) / observers.length) * 100 });
  }

  return { cells: allVisible, refLat };
}

// ── GeoJSON output (grid / polygon mode) ─────────────────────────────────────

// Each feature carries a `dist` property (nearest observer distance in meters)
// used for distance-based opacity fade in Mapbox.
export function buildGeoJSON(
  cells: Map<string, number>,
  opts: Required<ViewshedOptions>,
  refLat: number,
): FeatureCollection {
  const latCellSize = metersToDegreeLat(opts.cellSizeM);
  const lngCellSize = metersToDegreeLng(opts.cellSizeM, refLat);

  const features: Feature<Polygon>[] = [];

  for (const [key, dist] of cells) {
    const comma = key.indexOf(",");
    const cellI = parseInt(key.slice(0, comma), 10);
    const cellJ = parseInt(key.slice(comma + 1), 10);

    const minLat = cellI * latCellSize;
    const maxLat = (cellI + 1) * latCellSize;
    const minLng = cellJ * lngCellSize;
    const maxLng = (cellJ + 1) * lngCellSize;

    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]],
      },
      properties: { dist },
    });
  }

  return { type: "FeatureCollection", features };
}

// ── GeoJSON output (smooth / heatmap mode) ────────────────────────────────────

// Emits cell centres as Point features for use with a Mapbox heatmap layer.
export function buildPointGeoJSON(
  cells: Map<string, number>,
  opts: Required<ViewshedOptions>,
  refLat: number,
): FeatureCollection {
  const latCellSize = metersToDegreeLat(opts.cellSizeM);
  const lngCellSize = metersToDegreeLng(opts.cellSizeM, refLat);

  const features: Feature<Point>[] = [];

  for (const [key, dist] of cells) {
    const comma = key.indexOf(",");
    const cellI = parseInt(key.slice(0, comma), 10);
    const cellJ = parseInt(key.slice(comma + 1), 10);

    const centerLat = (cellI + 0.5) * latCellSize;
    const centerLng = (cellJ + 0.5) * lngCellSize;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [centerLng, centerLat] },
      properties: { dist },
    });
  }

  return { type: "FeatureCollection", features } as FeatureCollection;
}

// Builds a world-covering polygon with the viewshed union punched out as a hole.
// Used to render a dark "unexplored area" overlay outside the viewshed boundary.
// Uses tree-reduction union (pairs → pairs-of-pairs) so intermediate polygons stay small.
export async function buildUnexploredMask(
  viewshedData: FeatureCollection,
): Promise<Feature<Polygon | MultiPolygon> | null> {
  if (viewshedData.features.length === 0) return null;

  let current = [...viewshedData.features] as Feature<Polygon | MultiPolygon>[];

  while (current.length > 1) {
    const next: typeof current = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        const merged = turfUnion({
          type: "FeatureCollection",
          features: [current[i], current[i + 1]],
        } as FeatureCollection<Polygon | MultiPolygon>);
        if (merged) next.push(merged);
      } else {
        next.push(current[i]);
      }
    }
    current = next;
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  if (current.length === 0) return null;

  const world = bboxPolygon([-180, -85, 180, 85]);
  return turfDifference({
    type: "FeatureCollection",
    features: [world, current[0] as Feature<Polygon | MultiPolygon>],
  } as FeatureCollection<Polygon | MultiPolygon>);
}

// Derives point features from a cached polygon FeatureCollection (no cells Map available).
export function polygonGeoJSONToPoints(fc: FeatureCollection): FeatureCollection {
  const features = fc.features.map((f) => {
    const coords = (f.geometry as Polygon).coordinates[0];
    const lngs = coords.map((c) => c[0]);
    const lats  = coords.map((c) => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats))  / 2;
    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [centerLng, centerLat] },
      properties: f.properties,
    };
  });
  return { type: "FeatureCollection", features } as FeatureCollection;
}
