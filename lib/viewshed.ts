import type { FeatureCollection, Feature, Polygon } from "geojson";
import type { TrackPointSummary } from "@/types/models";
import { haversineM, metersToDegreeLat, metersToDegreeLng } from "@/lib/geo";

// ── types ─────────────────────────────────────────────────────────────────────

export type Observer = { lat: number; lng: number; elevation: number };

export type GetElevationFn = (lng: number, lat: number) => number | null;

export type ViewshedOptions = {
  numRays?: number;
  maxRadiusM?: number;
  stepM?: number;
  observerHeightM?: number;
  cellSizeM?: number;
};

export type ViewshedProgress = {
  processed: number;
  total: number;
  pct: number;
};

export const VIEWSHED_DEFAULTS: Required<ViewshedOptions> = {
  numRays: 72,
  maxRadiusM: 1500,
  stepM: 25,
  observerHeightM: 1.7,
  cellSizeM: 25,
};

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

export function computeSingleObserver(
  observer: Observer,
  getElevation: GetElevationFn,
  opts: Required<ViewshedOptions>,
  refLat: number,
): Set<string> {
  const visible = new Set<string>();
  const { numRays, maxRadiusM, stepM, observerHeightM, cellSizeM } = opts;

  const observerGroundEle = getElevation(observer.lng, observer.lat) ?? observer.elevation;
  const observerEle = observerGroundEle + observerHeightM;

  const latCellSize = metersToDegreeLat(cellSizeM);
  const lngCellSize = metersToDegreeLng(cellSizeM, refLat);

  for (let r = 0; r < numRays; r++) {
    const bearingRad = ((360 / numRays) * r * Math.PI) / 180;
    let maxHorizonAngle = -Infinity;

    for (let dist = stepM; dist <= maxRadiusM; dist += stepM) {
      const lat = observer.lat + metersToDegreeLat(dist * Math.cos(bearingRad));
      const lng = observer.lng + metersToDegreeLng(dist * Math.sin(bearingRad), observer.lat);

      const terrainEle = getElevation(lng, lat);
      if (terrainEle === null) continue;

      const elevAngle = Math.atan2(terrainEle - observerEle, dist);

      if (elevAngle >= maxHorizonAngle) {
        maxHorizonAngle = elevAngle;
        const cellI = Math.floor(lat / latCellSize);
        const cellJ = Math.floor(lng / lngCellSize);
        visible.add(`${cellI},${cellJ}`);
      }
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
): { cells: Set<string>; refLat: number } {
  if (observers.length === 0) return { cells: new Set(), refLat: 0 };

  const refLat = observers.reduce((s, o) => s + o.lat, 0) / observers.length;
  const allVisible = new Set<string>();

  for (let i = 0; i < observers.length; i++) {
    const visible = computeSingleObserver(observers[i], getElevation, opts, refLat);
    for (const key of visible) allVisible.add(key);
    onProgress?.({ processed: i + 1, total: observers.length, pct: ((i + 1) / observers.length) * 100 });
  }

  return { cells: allVisible, refLat };
}

// ── GeoJSON output ────────────────────────────────────────────────────────────

export function buildGeoJSON(
  cells: Set<string>,
  opts: Required<ViewshedOptions>,
  refLat: number,
): FeatureCollection {
  const latCellSize = metersToDegreeLat(opts.cellSizeM);
  const lngCellSize = metersToDegreeLng(opts.cellSizeM, refLat);

  const features: Feature<Polygon>[] = [];

  for (const key of cells) {
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
      properties: {},
    });
  }

  return { type: "FeatureCollection", features };
}
