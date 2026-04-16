"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { type MapRef } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { MapViewState } from "@deck.gl/core";
import type { Hike, TrackPointSummary } from "@/types/models";
import { haversineKm, lerpColor } from "@/lib/geo";
import { MI_TO_KM, type UnitSystem } from "@/lib/format";
import HikeInfoCard from "./HikeInfoCard";

import "mapbox-gl/dist/mapbox-gl.css";

// ── constants ─────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TERRAIN_EXAGGERATION_DEFAULT = 1.5;

const MAP_STYLES: Record<string, string> = {
  outdoors:  "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  hybrid:    "mapbox://styles/mapbox/satellite-streets-v12",
};

const ELEVATION_GRADIENT: [number, number, number][] = [
  [59,  130, 246],   // blue  – low
  [34,  197,  94],   // green
  [234, 179,   8],   // yellow
  [239,  68,  68],   // red   – high
];

const PACE_GRADIENT: [number, number, number][] = [
  [34,  197,  94],   // green  – fast
  [234, 179,   8],   // yellow
  [239,  68,  68],   // red    – slow
];

const PACE_MIN_KM = 3;   // min/km  – clamp fast end
const PACE_MAX_KM = 20;  // min/km  – clamp slow end
const MAX_PACE_SEGMENT = 30; // discard stopped segments

// ── helpers ───────────────────────────────────────────────────────────────────

type MapStyle  = "outdoors" | "satellite" | "hybrid";
type ColorMode = "default" | "elevation" | "pace";

function initialViewState(hike: Hike): MapViewState {
  if (hike.bbox) {
    const [minLng, minLat, maxLng, maxLat] = hike.bbox;
    return { longitude: (minLng + maxLng) / 2, latitude: (minLat + maxLat) / 2, zoom: 12, pitch: 45, bearing: 0 };
  }
  return { longitude: -98.5795, latitude: 39.8283, zoom: 3.5, pitch: 0, bearing: 0 };
}

function buildPins(pts: TrackPointSummary[]) {
  if (pts.length === 0) return [];
  let hi = 0, lo = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].elevation > pts[hi].elevation) hi = i;
    if (pts[i].elevation < pts[lo].elevation) lo = i;
  }
  return [
    { id: "start",   pt: pts[0],       label: "Start" },
    { id: "end",     pt: pts[pts.length - 1], label: "End" },
    { id: "highest", pt: pts[hi], label: `▲ ${Math.round(pts[hi].elevation)} m` },
    { id: "lowest",  pt: pts[lo], label: `▼ ${Math.round(pts[lo].elevation)} m` },
  ];
}

const PIN_COLORS: Record<string, [number, number, number]> = {
  start:   [34,  197,  94],
  end:     [239,  68,  68],
  highest: [168,  85, 247],
  lowest:  [234, 179,   8],
};

function buildElevationColors(pts: TrackPointSummary[]): [number, number, number][] {
  const elevs = pts.map((p) => p.elevation);
  const min = Math.min(...elevs);
  const max = Math.max(...elevs);
  const range = max - min || 1;
  return elevs.map((e) => lerpColor(ELEVATION_GRADIENT, (e - min) / range));
}

function buildPaceColors(pts: TrackPointSummary[]): [number, number, number][] | null {
  if (!pts.some((p) => p.timestamp)) return null;

  // Compute per-segment pace, then assign per-vertex (average of adjacent segments)
  const segPaces: (number | null)[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    if (!p1.timestamp || !p2.timestamp) { segPaces.push(null); continue; }
    const dtMin = (new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime()) / 60000;
    const dist  = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng);
    if (dist < 0.001 || dtMin <= 0) { segPaces.push(null); continue; }
    const pace = dtMin / dist;
    segPaces.push(pace < MAX_PACE_SEGMENT ? pace : null);
  }

  const vertPaces = pts.map((_, i) => {
    const a = i > 0               ? segPaces[i - 1] : null;
    const b = i < segPaces.length ? segPaces[i]     : null;
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

function buildDistanceMarkers(pts: TrackPointSummary[], unit: UnitSystem) {
  if (pts.length === 0) return [];
  const intervalKm = unit === "imperial" ? MI_TO_KM : 1;
  const suffix     = unit === "imperial" ? "mi" : "km";
  const markers: { pt: TrackPointSummary; label: string }[] = [];
  let cumDist = 0;
  let next = intervalKm;
  let idx  = 1;

  for (let i = 1; i < pts.length; i++) {
    cumDist += haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    if (cumDist >= next) {
      markers.push({ pt: pts[i], label: `${idx} ${suffix}` });
      next += intervalKm;
      idx++;
    }
  }
  return markers;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function HikeMapView({
  hike,
  trackPoints,
}: {
  hike: Hike;
  trackPoints: TrackPointSummary[];
}) {
  const [viewState, setViewState] = useState<MapViewState>(initialViewState(hike));
  const [mapStyle, setMapStyle]               = useState<MapStyle>("outdoors");
  const [terrainExp, setTerrainExp]           = useState(TERRAIN_EXAGGERATION_DEFAULT);
  const [colorMode, setColorMode]             = useState<ColorMode>("default");
  const [unit, setUnit]                       = useState<UnitSystem>("metric");

  const mapRef          = useRef<MapRef>(null);
  const terrainExpRef   = useRef(terrainExp);
  // Sync ref outside render so callbacks always see the latest value
  useEffect(() => { terrainExpRef.current = terrainExp; });

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
    map.setTerrain({ source: "mapbox-dem", exaggeration: terrainExpRef.current });
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

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    setupTerrain(map);
    // Re-apply after style changes (style change resets all sources/layers)
    map.on("style.load", () => {
      const m = mapRef.current?.getMap();
      if (m) setupTerrain(m);
    });
  }, [setupTerrain]);

  // Live-update terrain exaggeration without waiting for a style reload
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getSource("mapbox-dem")) return;
    map.setTerrain({ source: "mapbox-dem", exaggeration: terrainExp });
  }, [terrainExp]);

  // ── fit route ────────────────────────────────────────────────────────────

  function handleFitRoute() {
    const map = mapRef.current?.getMap();
    if (!map || !hike.bbox) return;
    const [minLng, minLat, maxLng, maxLat] = hike.bbox;
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 80,
      duration: 1000,
      pitch: 45,
    });
  }

  // ── pre-computed color arrays ─────────────────────────────────────────────

  const elevationColors = useMemo(() => buildElevationColors(trackPoints), [trackPoints]);
  const paceColors      = useMemo(() => buildPaceColors(trackPoints),      [trackPoints]);
  const hasPace         = paceColors !== null;

  // ── pins & markers ────────────────────────────────────────────────────────

  const pins            = useMemo(() => buildPins(trackPoints),                  [trackPoints]);
  const distMarkers     = useMemo(() => buildDistanceMarkers(trackPoints, unit), [trackPoints, unit]);

  // ── deck.gl layers ────────────────────────────────────────────────────────

  const layers = useMemo(() => {
    const te = terrainExp;

    const pathColors: [number, number, number] | [number, number, number][] =
      colorMode === "elevation" ? elevationColors
      : colorMode === "pace" && paceColors ? paceColors
      : [234, 88, 12];

    return [
      // track
      new PathLayer({
        id:           "hike-track",
        data:         [{ path: trackPoints.map((p) => [p.lng, p.lat, p.elevation * te]) }],
        getPath:      (d) => d.path,
        getColor:     pathColors as never,  // per-vertex array or single color both accepted
        getWidth:     4,
        widthUnits:   "pixels",
        capRounded:   true,
        jointRounded: true,
      }),

      // distance markers — dots
      new ScatterplotLayer({
        id:           "dist-dots",
        data:         distMarkers,
        getPosition:  (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getFillColor: [255, 255, 255],
        getLineColor: [80, 80, 80],
        getRadius:    5,
        radiusUnits:  "pixels",
        stroked:      true,
        lineWidthUnits: "pixels",
        getLineWidth: 1,
        updateTriggers: { getPosition: te },
      }),

      // distance markers — labels
      new TextLayer({
        id:                   "dist-labels",
        data:                 distMarkers,
        getPosition:          (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText:              (d) => d.label,
        getColor:             [255, 255, 255],
        getSize:              11,
        getPixelOffset:       [0, -14],
        getTextAnchor:        "middle",
        getAlignmentBaseline: "bottom",
        background:           true,
        getBackgroundColor:   [40, 40, 40, 200] as [number, number, number, number],
        backgroundPadding:    [3, 1, 3, 1],
        updateTriggers: { getPosition: te },
      }),

      // pins — dots
      new ScatterplotLayer({
        id:           "pin-dots",
        data:         pins,
        getPosition:  (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getFillColor: (d) => PIN_COLORS[d.id],
        getLineColor: [255, 255, 255],
        getRadius:    8,
        radiusUnits:  "pixels",
        stroked:      true,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        updateTriggers: { getPosition: te },
      }),

      // pins — labels
      new TextLayer({
        id:                   "pin-labels",
        data:                 pins,
        getPosition:          (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText:              (d) => d.label,
        getColor:             [255, 255, 255],
        getSize:              12,
        getPixelOffset:       [0, -18],
        getTextAnchor:        "middle",
        getAlignmentBaseline: "bottom",
        background:           true,
        getBackgroundColor:   (d) => [...PIN_COLORS[d.id], 210] as [number, number, number, number],
        backgroundPadding:    [4, 2, 4, 2],
        updateTriggers: { getPosition: te },
      }),
    ];
  }, [trackPoints, terrainExp, colorMode, elevationColors, paceColors, pins, distMarkers]);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 4rem)" }}>
      <HikeInfoCard hike={hike} trackPoints={trackPoints} unit={unit} />

      {/* ── controls panel ── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">

        {/* map style */}
        <div className="join shadow-lg">
          {(["outdoors", "satellite", "hybrid"] as const).map((s) => (
            <button
              key={s}
              className={`join-item btn btn-xs ${mapStyle === s ? "btn-neutral" : "btn-ghost bg-base-100/90"}`}
              onClick={() => setMapStyle(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* path color mode */}
        <div className="join shadow-lg">
          {(["default", "elevation", "pace"] as const).map((m) => (
            <button
              key={m}
              className={`join-item btn btn-xs ${colorMode === m ? "btn-neutral" : "btn-ghost bg-base-100/90"}`}
              onClick={() => setColorMode(m)}
              disabled={m === "pace" && !hasPace}
              title={m === "pace" && !hasPace ? "No timestamps in GPX" : undefined}
            >
              {m === "default" ? "Track" : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* unit toggle + fit */}
        <div className="flex gap-2">
          <div className="join shadow-lg flex-1">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                className={`join-item btn btn-xs flex-1 ${unit === u ? "btn-neutral" : "btn-ghost bg-base-100/90"}`}
                onClick={() => setUnit(u)}
              >
                {u === "metric" ? "km" : "mi"}
              </button>
            ))}
          </div>
          <button
            className="btn btn-xs bg-base-100/90 shadow-lg"
            onClick={handleFitRoute}
            title="Fit route"
          >
            Fit
          </button>
        </div>

        {/* terrain exaggeration slider */}
        <div className="flex items-center gap-2 bg-base-100/90 shadow-lg rounded-lg px-3 py-2">
          <span className="text-xs text-base-content/60 shrink-0">3D</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={terrainExp}
            onChange={(e) => setTerrainExp(Number(e.target.value))}
            className="range range-xs flex-1"
          />
          <span className="text-xs text-base-content/60 w-7 shrink-0 text-right">
            {terrainExp.toFixed(1)}×
          </span>
        </div>
      </div>

      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
        controller
        layers={layers}
        style={{ position: "relative" }}
      >
        <Map
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
