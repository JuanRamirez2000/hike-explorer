"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import type { Hike, TrackPointSummary } from "@/types/models";
import { rdpDecimate } from "@/lib/geo";
import {
  buildGeoJSON,
  buildPointGeoJSON,
  polygonGeoJSONToPoints,
  computeSingleObserver,
  sampleObservers,
  VIEWSHED_DEFAULTS,
} from "@/lib/viewshed";
import type { ViewshedProgress, ViewshedStatus } from "@/types/viewshed";
import { saveViewshed } from "@/lib/viewshed-actions";

// ── constants ─────────────────────────────────────────────────────────────────

const VIEWSHED_CHUNK = 5;

export type ViewshedPreset = "canyon" | "trail" | "peak";

export const VIEWSHED_PRESETS: Record<ViewshedPreset, { maxRadiusM: number; observerIntervalM: number }> = {
  canyon: { maxRadiusM:  5_000, observerIntervalM: 150 },
  trail:  { maxRadiusM: 20_000, observerIntervalM: 400 },
  peak:   { maxRadiusM: 50_000, observerIntervalM: 600 },
};

export function defaultViewshedPreset(hike: Hike): ViewshedPreset {
  const gainPerKm = (hike.elevation_gain_m ?? 0) / (hike.distance_km ?? 1);
  if (gainPerKm > 200) return "peak";
  if (gainPerKm > 50)  return "trail";
  return "canyon";
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useViewshed({
  hike,
  trackPoints,
  mapRef,
  fogVisibleRef,
  fogOpacityRef,
}: {
  hike: Hike;
  trackPoints: TrackPointSummary[];
  mapRef: React.RefObject<MapRef | null>;
  fogVisibleRef: React.MutableRefObject<boolean>;
  fogOpacityRef: React.MutableRefObject<number>;
}) {
  const [viewshedData, setViewshedData] = useState<FeatureCollection | null>(null);
  const [viewshedStatus, setViewshedStatus] = useState<ViewshedStatus>("idle");
  const [viewshedVisible, setViewshedVisible] = useState(false);
  const [viewshedSmooth, setViewshedSmooth] = useState(false);
  const [viewshedPreset, setViewshedPreset] = useState<ViewshedPreset>(() => defaultViewshedPreset(hike));
  const [viewshedProgress, setViewshedProgress] = useState<ViewshedProgress>({
    processed: 0,
    total: 0,
    pct: 0,
  });
  const [fogObserverCount, setFogObserverCount] = useState<number | null>(null);

  const computeAbortRef = useRef(false);
  // In-memory cells from the most recent computation (not persisted — used for smooth toggle)
  const viewshedCellsRef = useRef<Map<string, number> | null>(null);
  const viewshedRefLatRef = useRef<number>(0);

  // Refs so style.load callback (created once) always sees current viewshed state
  const viewshedDataRef = useRef(viewshedData);
  const viewshedVisibleRef = useRef(viewshedVisible);
  const viewshedSmoothRef = useRef(viewshedSmooth);
  useLayoutEffect(() => {
    viewshedDataRef.current = viewshedData;
    viewshedVisibleRef.current = viewshedVisible;
    viewshedSmoothRef.current = viewshedSmooth;
  });

  // Cancel any in-flight computation when the component unmounts
  useEffect(
    () => () => {
      computeAbortRef.current = true;
      const map = mapRef.current?.getMap();
      if (map?.isStyleLoaded()) {
        if (map.getLayer("viewshed-fill")) map.removeLayer("viewshed-fill");
        if (map.getSource("viewshed")) map.removeSource("viewshed");
      }
    },
    [mapRef],
  );

  // Manage the Mapbox native fill/heatmap layer that drapes on terrain.
  // A Mapbox fill layer is used instead of deck.gl because Mapbox automatically
  // projects fill layers onto the terrain mesh surface.
  const syncViewshedLayer = useCallback(
    (map: ReturnType<MapRef["getMap"]>) => {
      if (!map) return;
      if (map.getLayer("viewshed-fill")) map.removeLayer("viewshed-fill");
      if (map.getLayer("viewshed-heat")) map.removeLayer("viewshed-heat");
      if (map.getSource("viewshed")) map.removeSource("viewshed");
      if (!viewshedVisibleRef.current || !viewshedDataRef.current) return;

      const smooth = viewshedSmoothRef.current;
      const cells = viewshedCellsRef.current;

      if (smooth) {
        const pointData = cells
          ? buildPointGeoJSON(cells, VIEWSHED_DEFAULTS, viewshedRefLatRef.current)
          : polygonGeoJSONToPoints(viewshedDataRef.current!);
        map.addSource("viewshed", { type: "geojson", data: pointData });
        map.addLayer({
          id: "viewshed-heat",
          type: "heatmap",
          source: "viewshed",
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": 0.9,
            "heatmap-radius": 22,
            "heatmap-opacity": 0.72,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0,   "rgba(0,0,0,0)",
              0.2, "rgba(10,40,120,0.35)",
              0.5, "rgba(20,60,160,0.65)",
              1,   "rgba(30,64,175,0.9)",
            ],
          },
        });
      } else {
        // Grid fill layer with distance-based opacity fade (terrain-draped)
        map.addSource("viewshed", { type: "geojson", data: viewshedDataRef.current });
        map.addLayer({
          id: "viewshed-fill",
          type: "fill",
          source: "viewshed",
          paint: {
            "fill-color": "#1e3a8a",
            "fill-opacity": fogVisibleRef.current ? fogOpacityRef.current : 0,
          },
        });
      }
    },
    [fogVisibleRef, fogOpacityRef],
  );

  const handleComputeViewshed = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map || trackPoints.length === 0) return;

    setViewshedStatus("computing");
    computeAbortRef.current = false;

    // Zoom out to load terrain tiles across the full radius before ray-casting.
    // queryTerrainElevation only returns data for currently-loaded tiles, so at
    // zoom 12 the effective range is ~15 km; at zoom 9 it covers ~100 km.
    const mid = trackPoints[Math.floor(trackPoints.length / 2)];
    map.jumpTo({ center: [mid.lng, mid.lat], zoom: 9 });
    await new Promise<void>((resolve) => map.once("idle", () => resolve()));

    if (computeAbortRef.current) return;

    const getElevation = (lng: number, lat: number): number | null =>
      map.queryTerrainElevation([lng, lat]) ?? null;

    const preset = VIEWSHED_PRESETS[viewshedPreset];
    const opts = { ...VIEWSHED_DEFAULTS, maxRadiusM: preset.maxRadiusM };
    // Use bbox center as fixed reference latitude so all observers share the same cell grid
    const refLat = hike.bbox
      ? (hike.bbox[1] + hike.bbox[3]) / 2
      : trackPoints[Math.floor(trackPoints.length / 2)].lat;

    // RDP decimation MUST precede ray-casting — never cast all raw GPS points
    const decimated = rdpDecimate(trackPoints, 10);
    const observers = sampleObservers(decimated, preset.observerIntervalM);
    setViewshedProgress({ processed: 0, total: observers.length, pct: 0 });

    const allVisible = new Map<string, number>();

    await new Promise<void>((resolve, reject) => {
      let i = 0;
      function step() {
        if (computeAbortRef.current) { reject(new Error("cancelled")); return; }
        const end = Math.min(i + VIEWSHED_CHUNK, observers.length);
        for (; i < end; i++) {
          for (const [key, dist] of computeSingleObserver(observers[i], getElevation, opts, refLat)) {
            const existing = allVisible.get(key);
            if (existing === undefined || dist < existing) allVisible.set(key, dist);
          }
        }
        setViewshedProgress({
          processed: i,
          total: observers.length,
          pct: (i / observers.length) * 100,
        });
        if (i < observers.length) setTimeout(step, 0);
        else resolve();
      }
      setTimeout(step, 0);
    }).catch(() => {
      /* cancelled — do nothing */
    });

    if (computeAbortRef.current) return;

    viewshedCellsRef.current = allVisible;
    viewshedRefLatRef.current = refLat;
    const geojson = buildGeoJSON(allVisible, opts, refLat);
    setViewshedData(geojson);
    setViewshedStatus("done");
    setViewshedVisible(true);
    setFogObserverCount(observers.length);

    // Persist in the background — don't block the UI
    saveViewshed(hike.id, geojson).catch(console.error);
  }, [hike, trackPoints, viewshedPreset, mapRef]);

  return {
    viewshedData,
    viewshedStatus,
    viewshedVisible, setViewshedVisible,
    viewshedSmooth, setViewshedSmooth,
    viewshedPreset, setViewshedPreset,
    viewshedProgress,
    fogObserverCount,
    handleComputeViewshed,
    syncViewshedLayer,
  };
}
