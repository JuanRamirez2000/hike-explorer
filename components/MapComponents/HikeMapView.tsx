"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMap, { type MapRef } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { MapViewState } from "@deck.gl/core";
import type { FeatureCollection, Polygon } from "geojson";
import type { Hike, TrackPointSummary } from "@/types/models";
import { haversineKm, cumulativeDistancesKm, rdpDecimate } from "@/lib/geo";
import { lerpColor } from "@/lib/display-utils";
import { MI_TO_KM, fmtElevation, type UnitSystem } from "@/lib/format";
import {
  buildGeoJSON,
  buildPointGeoJSON,
  polygonGeoJSONToPoints,
  computeSingleObserver,
  sampleObservers,
  VIEWSHED_DEFAULTS,
} from "@/lib/viewshed";
import type { ViewshedProgress } from "@/lib/viewshed";
import type { ViewshedStatus } from "@/types/viewshed";
import { saveViewshed } from "@/lib/viewshed-actions";
import HikeInfoCard from "./HikeInfoCard";
import MapControlsPanel from "./MapControlsPanel";

import "mapbox-gl/dist/mapbox-gl.css";

// ── constants ─────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TERRAIN_EXAGGERATION_DEFAULT = 1.5;
const VIEWSHED_CHUNK = 5; // observers processed per setTimeout tick

const MAP_STYLES: Record<string, string> = {
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
};

const ELEVATION_GRADIENT: [number, number, number][] = [
  [59, 130, 246], // blue  – low
  [34, 197, 94], // green
  [234, 179, 8], // yellow
  [239, 68, 68], // red   – high
];

const PACE_GRADIENT: [number, number, number][] = [
  [34, 197, 94], // green  – fast
  [234, 179, 8], // yellow
  [239, 68, 68], // red    – slow
];

const PACE_MIN_KM = 3; // min/km  – clamp fast end
const PACE_MAX_KM = 20; // min/km  – clamp slow end
const MAX_PACE_SEGMENT = 30; // discard stopped segments

// ── viewshed presets ──────────────────────────────────────────────────────────

type ViewshedPreset = "canyon" | "trail" | "peak";

const VIEWSHED_PRESETS: Record<ViewshedPreset, { maxRadiusM: number; observerIntervalM: number }> = {
  canyon: { maxRadiusM:  5_000, observerIntervalM: 150 },
  trail:  { maxRadiusM: 20_000, observerIntervalM: 400 },
  peak:   { maxRadiusM: 50_000, observerIntervalM: 600 },
};

function defaultPreset(hike: Hike): ViewshedPreset {
  const gainPerKm = (hike.elevation_gain_m ?? 0) / (hike.distance_km ?? 1);
  if (gainPerKm > 200) return "peak";
  if (gainPerKm > 50)  return "trail";
  return "canyon";
}

// ── helpers ───────────────────────────────────────────────────────────────────

type MapStyle = "outdoors" | "satellite" | "hybrid";
type ColorMode = "default" | "elevation" | "pace";

function initialViewState(hike: Hike): MapViewState {
  if (hike.bbox) {
    const [minLng, minLat, maxLng, maxLat] = hike.bbox;
    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 12,
      pitch: 45,
      bearing: 0,
    };
  }
  return {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
  };
}

function buildPins(pts: TrackPointSummary[], unit: UnitSystem) {
  if (pts.length === 0) return [];
  let hi = 0,
    lo = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].elevation > pts[hi].elevation) hi = i;
    if (pts[i].elevation < pts[lo].elevation) lo = i;
  }
  return [
    { id: "start", pt: pts[0], label: "Start" },
    { id: "end", pt: pts[pts.length - 1], label: "End" },
    {
      id: "highest",
      pt: pts[hi],
      label: `▲ ${fmtElevation(pts[hi].elevation, unit)}`,
    },
    {
      id: "lowest",
      pt: pts[lo],
      label: `▼ ${fmtElevation(pts[lo].elevation, unit)}`,
    },
  ];
}

const PIN_COLORS: Record<string, [number, number, number]> = {
  start: [34, 197, 94],
  end: [239, 68, 68],
  highest: [168, 85, 247],
  lowest: [234, 179, 8],
};

function buildElevationColors(
  pts: TrackPointSummary[],
): [number, number, number][] {
  const elevs = pts.map((p) => p.elevation);
  const min = Math.min(...elevs);
  const max = Math.max(...elevs);
  const range = max - min || 1;
  return elevs.map((e) => lerpColor(ELEVATION_GRADIENT, (e - min) / range));
}

function buildPaceColors(
  pts: TrackPointSummary[],
): [number, number, number][] | null {
  if (!pts.some((p) => p.timestamp)) return null;

  // Compute per-segment pace, then assign per-vertex (average of adjacent segments)
  const segPaces: (number | null)[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i],
      p2 = pts[i + 1];
    if (!p1.timestamp || !p2.timestamp) {
      segPaces.push(null);
      continue;
    }
    const dtMin =
      (new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime()) /
      60000;
    const dist = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng);
    if (dist < 0.001 || dtMin <= 0) {
      segPaces.push(null);
      continue;
    }
    const pace = dtMin / dist;
    segPaces.push(pace < MAX_PACE_SEGMENT ? pace : null);
  }

  const vertPaces = pts.map((_, i) => {
    const a = i > 0 ? segPaces[i - 1] : null;
    const b = i < segPaces.length ? segPaces[i] : null;
    const vals = [a, b].filter((v): v is number => v !== null);
    return vals.length > 0
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : null;
  });

  const valid = vertPaces.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;

  const range = PACE_MAX_KM - PACE_MIN_KM;
  return vertPaces.map((p) => {
    const t =
      p !== null ? Math.max(0, Math.min(1, (p - PACE_MIN_KM) / range)) : 0.5;
    return lerpColor(PACE_GRADIENT, t);
  });
}

function buildDistanceMarkers(pts: TrackPointSummary[], unit: UnitSystem) {
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
function geojsonAreaKm2(fc: FeatureCollection): number {
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

// ── component ─────────────────────────────────────────────────────────────────

export default function HikeMapView({
  hike,
  trackPoints,
}: {
  hike: Hike;
  trackPoints: TrackPointSummary[];
}) {
  const [viewState, setViewState] = useState<MapViewState>(
    initialViewState(hike),
  );
  const [mapStyle, setMapStyle] = useState<MapStyle>("outdoors");
  const [terrainExp, setTerrainExp] = useState(TERRAIN_EXAGGERATION_DEFAULT);
  const [colorMode, setColorMode] = useState<ColorMode>("default");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [fogVisible, setFogVisible] = useState(true);
  const [fogOpacity, setFogOpacity] = useState(0.65);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [fogComputedAt, setFogComputedAt] = useState<Date | null>(null);
  const [fogObserverCount, setFogObserverCount] = useState<number | null>(null);

  // ── viewshed state ───────────────────────────────────────────────────────

  const [viewshedData, setViewshedData] = useState<FeatureCollection | null>(null);
  const [viewshedStatus, setViewshedStatus] = useState<ViewshedStatus>("idle");
  const [viewshedVisible, setViewshedVisible] = useState(false);
  const [viewshedSmooth,  setViewshedSmooth]  = useState(false);
  const [viewshedPreset,  setViewshedPreset]  = useState<ViewshedPreset>(() => defaultPreset(hike));
  const [viewshedProgress, setViewshedProgress] = useState<ViewshedProgress>({
    processed: 0,
    total: 0,
    pct: 0,
  });
  const [viewshedError, setViewshedError] = useState<string | null>(null);
  const computeAbortRef = useRef(false);
  // In-memory cells from the most recent computation (not persisted — used for smooth toggle)
  const viewshedCellsRef = useRef<Map<string, number> | null>(null);
  const viewshedRefLatRef = useRef<number>(0);

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
    [],
  );

  const mapRef = useRef<MapRef>(null);
  const terrainExpRef = useRef(terrainExp);
  // Refs so style.load callback (created once) always sees current viewshed state
  const viewshedDataRef = useRef(viewshedData);
  const viewshedVisibleRef = useRef(viewshedVisible);
  const viewshedSmoothRef = useRef(viewshedSmooth);
  const fogVisibleRef = useRef(fogVisible);
  const fogOpacityRef = useRef(fogOpacity);
  const terrainEnabledRef = useRef(terrainEnabled);
  useEffect(() => {
    terrainExpRef.current = terrainExp;
  });
  useEffect(() => {
    viewshedDataRef.current = viewshedData;
  });
  useEffect(() => {
    viewshedVisibleRef.current = viewshedVisible;
  });
  useEffect(() => {
    viewshedSmoothRef.current = viewshedSmooth;
  });
  useEffect(() => {
    fogVisibleRef.current = fogVisible;
  });
  useEffect(() => {
    fogOpacityRef.current = fogOpacity;
  });
  useEffect(() => {
    terrainEnabledRef.current = terrainEnabled;
  });

  // ── terrain helpers ──────────────────────────────────────────────────────

  const setupTerrain = useCallback((map: ReturnType<MapRef["getMap"]>) => {
    if (!map) return;
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }
    if (terrainEnabledRef.current) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: terrainExpRef.current });
    }
    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });
    }
  }, []);

  // Manage the Mapbox native fill/heatmap layer that drapes on terrain.
  // A Mapbox fill layer is used instead of deck.gl because Mapbox automatically
  // projects fill layers onto the terrain mesh surface.
  const syncViewshedLayer = useCallback((map: ReturnType<MapRef["getMap"]>) => {
    if (!map) return;
    if (map.getLayer("viewshed-fill")) map.removeLayer("viewshed-fill");
    if (map.getLayer("viewshed-heat")) map.removeLayer("viewshed-heat");
    if (map.getSource("viewshed")) map.removeSource("viewshed");
    if (!viewshedVisibleRef.current || !viewshedDataRef.current) return;

    const smooth = viewshedSmoothRef.current;
    const cells = viewshedCellsRef.current;

    if (smooth) {
      // Heatmap layer for smooth mode — build from in-memory cells or derive from polygons
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
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "rgba(10,40,120,0.35)",
            0.5,
            "rgba(20,60,160,0.65)",
            1,
            "rgba(30,64,175,0.9)",
          ],
        },
      });
    } else {
      // Grid fill layer with distance-based opacity fade (terrain-draped)
      map.addSource("viewshed", {
        type: "geojson",
        data: viewshedDataRef.current,
      });
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
  }, []);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    setupTerrain(map);
    // Re-apply terrain + viewshed after style changes (style change resets all sources/layers)
    map.on("style.load", () => {
      const m = mapRef.current?.getMap();
      if (!m) return;
      setupTerrain(m);
      syncViewshedLayer(m);
    });
  }, [setupTerrain, syncViewshedLayer]);

  // Sync viewshed layer whenever data, visibility, or render mode changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    syncViewshedLayer(map);
  }, [viewshedData, viewshedVisible, viewshedSmooth, syncViewshedLayer]);

  // Live-update fill-opacity without re-building the layer (efficient for slider)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getLayer("viewshed-fill")) return;
    map.setPaintProperty("viewshed-fill", "fill-opacity", fogVisible ? fogOpacity : 0);
  }, [fogVisible, fogOpacity]);

  // Live-update terrain exaggeration / enabled without waiting for a style reload
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getSource("mapbox-dem")) return;
    if (terrainEnabled) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: terrainExp });
    } else {
      map.setTerrain(null);
    }
  }, [terrainEnabled, terrainExp]);

  // ── viewshed computation ──────────────────────────────────────────────────

  const handleComputeViewshed = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map || trackPoints.length === 0) return;

    setViewshedStatus("computing");
    setViewshedError(null);
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
        if (computeAbortRef.current) {
          reject(new Error("cancelled"));
          return;
        }
        const end = Math.min(i + VIEWSHED_CHUNK, observers.length);
        for (; i < end; i++) {
          for (const [key, dist] of computeSingleObserver(
            observers[i],
            getElevation,
            opts,
            refLat,
          )) {
            const existing = allVisible.get(key);
            if (existing === undefined || dist < existing)
              allVisible.set(key, dist);
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
    setFogComputedAt(new Date());
    setFogObserverCount(observers.length);

    // Persist in the background — don't block the UI
    saveViewshed(hike.id, geojson).catch(console.error);
  }, [hike, trackPoints]);

  // ── fit route ────────────────────────────────────────────────────────────

  function handleFitRoute() {
    const map = mapRef.current?.getMap();
    if (!map || !hike.bbox) return;
    const [minLng, minLat, maxLng, maxLat] = hike.bbox;
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 80,
        duration: 1000,
        pitch: 45,
      },
    );
  }

  // ── pre-computed color arrays ─────────────────────────────────────────────

  const elevationColors = useMemo(
    () => buildElevationColors(trackPoints),
    [trackPoints],
  );
  const paceColors = useMemo(() => buildPaceColors(trackPoints), [trackPoints]);
  const hasPace = paceColors !== null;

  // ── pins & markers ────────────────────────────────────────────────────────

  const pins = useMemo(() => buildPins(trackPoints, unit), [trackPoints, unit]);
  const distMarkers = useMemo(
    () => buildDistanceMarkers(trackPoints, unit),
    [trackPoints, unit],
  );

  // ── deck.gl layers ────────────────────────────────────────────────────────

  const layers = useMemo(() => {
    const te = terrainExp;

    const pathColors: [number, number, number] | [number, number, number][] =
      colorMode === "elevation"
        ? elevationColors
        : colorMode === "pace" && paceColors
          ? paceColors
          : [234, 88, 12];

    return [
      // track
      new PathLayer({
        id: "hike-track",
        data: [
          { path: trackPoints.map((p) => [p.lng, p.lat, p.elevation * te]) },
        ],
        getPath: (d) => d.path,
        getColor: pathColors as never, // per-vertex array or single color both accepted
        getWidth: 4,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
      }),

      // distance markers — dots
      new ScatterplotLayer({
        id: "dist-dots",
        data: distMarkers,
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getFillColor: [255, 255, 255],
        getLineColor: [80, 80, 80],
        getRadius: 5,
        radiusUnits: "pixels",
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 1,
        updateTriggers: { getPosition: te },
      }),

      // distance markers — labels
      new TextLayer({
        id: "dist-labels",
        data: distMarkers,
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText: (d) => d.label,
        getColor: [255, 255, 255],
        getSize: 11,
        getPixelOffset: [0, -14],
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        background: true,
        getBackgroundColor: [40, 40, 40, 200] as [
          number,
          number,
          number,
          number,
        ],
        backgroundPadding: [3, 1, 3, 1],
        updateTriggers: { getPosition: te },
      }),

      // pins — dots
      new ScatterplotLayer({
        id: "pin-dots",
        data: pins,
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getFillColor: (d) => PIN_COLORS[d.id],
        getLineColor: [255, 255, 255],
        getRadius: 8,
        radiusUnits: "pixels",
        stroked: true,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        updateTriggers: { getPosition: te },
      }),

      // pins — labels
      new TextLayer({
        id: "pin-labels",
        data: pins,
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText: (d) => d.label,
        getColor: [255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -18],
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        background: true,
        getBackgroundColor: (d) =>
          [...PIN_COLORS[d.id], 210] as [number, number, number, number],
        backgroundPadding: [4, 2, 4, 2],
        updateTriggers: { getPosition: te },
      }),
    ];
  }, [
    trackPoints,
    terrainExp,
    colorMode,
    elevationColors,
    paceColors,
    pins,
    distMarkers,
  ]);

  // ── derived values for child components ─────────────────────────────────

  const fogAreaKm2 = viewshedData !== null ? geojsonAreaKm2(viewshedData) : null;

  const fogStatus: "pending" | "processing" | "complete" | "error" | null =
    viewshedStatus === "idle"
      ? null
      : viewshedStatus === "computing"
        ? "processing"
        : viewshedStatus === "done"
          ? "complete"
          : "error";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 4rem)",
      }}
    >
      <HikeInfoCard
        hike={hike}
        trackPoints={trackPoints}
        unit={unit}
        fogStatus={fogStatus}
        fogAreaKm2={fogAreaKm2}
      />

      <MapControlsPanel
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        hasPace={hasPace}
        unit={unit}
        onUnitChange={setUnit}
        onFitBounds={handleFitRoute}
        centerLat={viewState.latitude}
        centerLng={viewState.longitude}
        terrainEnabled={terrainEnabled}
        onTerrainEnabledChange={setTerrainEnabled}
        terrainExp={terrainExp}
        onTerrainExpChange={setTerrainExp}
        viewshedStatus={viewshedStatus}
        viewshedProgress={viewshedStatus === "computing" ? viewshedProgress : null}
        onTriggerViewshed={handleComputeViewshed}
        fogVisible={fogVisible}
        onFogVisibleChange={setFogVisible}
        fogOpacity={fogOpacity}
        onFogOpacityChange={setFogOpacity}
        fogAreaKm2={fogAreaKm2}
        fogObserverCount={fogObserverCount}
        fogComputedAt={fogComputedAt}
      />

      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as MapViewState)
        }
        controller
        layers={layers}
        style={{ position: "relative" }}
      >
        <ReactMap
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLES[mapStyle]}
          projection="mercator"
          reuseMaps
          onLoad={onMapLoad}
        />
      </DeckGL>
    </div>
  );
}
