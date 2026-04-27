"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactMap, { type MapRef } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { MapViewState } from "@deck.gl/core";
import type { Hike, TrackPointSummary } from "@/types/models";
import { type UnitSystem } from "@/lib/format";
import {
  buildPins, buildElevationColors, buildPaceColors, buildDistanceMarkers,
  geojsonAreaKm2, PIN_COLORS,
} from "@/lib/map-layers";
import { buildUnexploredMask } from "@/lib/viewshed";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import type { MapStyle, ColorMode } from "@/types/map";
import { useViewshed } from "@/hooks/useViewshed";
import HikeInfoCard from "./HikeInfoCard";
import MapControlsPanel from "./MapControlsPanel";

import "mapbox-gl/dist/mapbox-gl.css";

// ── constants ─────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MAP_STYLES: Record<string, string> = {
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
};

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── component ─────────────────────────────────────────────────────────────────

export default function HikeMapView({
  hike,
  trackPoints,
}: {
  hike: Hike;
  trackPoints: TrackPointSummary[];
}) {
  const [viewState, setViewState] = useState<MapViewState>(initialViewState(hike));
  const [mapStyle, setMapStyle] = useState<MapStyle>("outdoors");
  const [terrainExp, setTerrainExp] = useState(1.5);
  const [colorMode, setColorMode] = useState<ColorMode>("default");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [fogVisible, setFogVisible] = useState(true);
  const [fogOpacity, setFogOpacity] = useState(0.65);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [unexploredOpacity, setUnexploredOpacity] = useState(0);
  const [showDistMarkers, setShowDistMarkers] = useState(true);
  const [showPins, setShowPins] = useState(true);

  const mapRef = useRef<MapRef>(null);
  const terrainExpRef = useRef(terrainExp);
  const fogVisibleRef = useRef(fogVisible);
  const fogOpacityRef = useRef(fogOpacity);
  const terrainEnabledRef = useRef(terrainEnabled);
  const unexploredOpacityRef = useRef(unexploredOpacity);
  const unexploredMaskRef = useRef<Feature<Polygon | MultiPolygon> | null>(null);
  useLayoutEffect(() => {
    terrainExpRef.current = terrainExp;
    fogVisibleRef.current = fogVisible;
    fogOpacityRef.current = fogOpacity;
    terrainEnabledRef.current = terrainEnabled;
    unexploredOpacityRef.current = unexploredOpacity;
  });

  // ── viewshed ─────────────────────────────────────────────────────────────

  const {
    viewshedData,
    viewshedStatus,
    viewshedVisible, setViewshedVisible,
    viewshedSmooth, setViewshedSmooth,
    viewshedProgress,
    fogObserverCount,
    handleComputeViewshed,
    syncViewshedLayer,
  } = useViewshed({ hike, trackPoints, mapRef, fogVisibleRef, fogOpacityRef });

  // ── unexplored overlay ───────────────────────────────────────────────────

  const syncUnexploredLayer = useCallback((map: ReturnType<MapRef["getMap"]>) => {
    if (!map) return;
    if (map.getLayer("unexplored-fill")) map.removeLayer("unexplored-fill");
    if (map.getSource("unexplored"))     map.removeSource("unexplored");
    if (!unexploredMaskRef.current) return;
    map.addSource("unexplored", { type: "geojson", data: unexploredMaskRef.current as GeoJSON.GeoJSON });
    map.addLayer({
      id: "unexplored-fill",
      type: "fill",
      source: "unexplored",
      paint: {
        "fill-color": "#111111",
        "fill-opacity": unexploredOpacityRef.current,
      },
    });
  }, []);

  // Compute the unexplored mask once the viewshed data is ready
  useEffect(() => {
    if (!viewshedData) return;
    buildUnexploredMask(viewshedData).then((mask) => {
      unexploredMaskRef.current = mask;
      const map = mapRef.current?.getMap();
      if (map?.isStyleLoaded()) syncUnexploredLayer(map);
    });
  }, [viewshedData, syncUnexploredLayer]);

  // Live-update unexplored fill-opacity without rebuilding the layer
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getLayer("unexplored-fill")) return;
    map.setPaintProperty("unexplored-fill", "fill-opacity", unexploredOpacity);
  }, [unexploredOpacity]);

  // Cleanup unexplored layer on unmount
  useEffect(() => () => {
    const map = mapRef.current?.getMap();
    if (map?.isStyleLoaded()) {
      if (map.getLayer("unexplored-fill")) map.removeLayer("unexplored-fill");
      if (map.getSource("unexplored"))     map.removeSource("unexplored");
    }
  }, []);

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
      syncUnexploredLayer(m);
    });
  }, [setupTerrain, syncViewshedLayer, syncUnexploredLayer]);

  // Sync viewshed layer whenever data, visibility, or render mode changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    syncViewshedLayer(map);
  }, [viewshedData, viewshedVisible, viewshedSmooth, syncViewshedLayer]);

  // Live-update fill-opacity without re-building the layer (efficient for slider).
  // When the unexplored overlay is active it provides the boundary contrast,
  // so the blue viewshed fill is suppressed to avoid double-layering.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getLayer("viewshed-fill")) return;
    const effective = unexploredOpacity > 0 ? 0 : (fogVisible ? fogOpacity : 0);
    map.setPaintProperty("viewshed-fill", "fill-opacity", effective);
  }, [fogVisible, fogOpacity, unexploredOpacity]);

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

  // ── pre-computed color arrays ─────────────────────────────────────────────

  const elevationColors = useMemo(() => buildElevationColors(trackPoints), [trackPoints]);
  const paceColors = useMemo(() => buildPaceColors(trackPoints), [trackPoints]);

  // ── pins & markers ────────────────────────────────────────────────────────

  const pins = useMemo(() => buildPins(trackPoints, unit), [trackPoints, unit]);
  const distMarkers = useMemo(() => buildDistanceMarkers(trackPoints, unit), [trackPoints, unit]);

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
      new PathLayer({
        id: "hike-track",
        data: [{ path: trackPoints.map((p) => [p.lng, p.lat, p.elevation * te]) }],
        getPath: (d) => d.path,
        getColor: pathColors as never,
        getWidth: 4,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
      }),
      new ScatterplotLayer({
        id: "dist-dots",
        data: showDistMarkers ? distMarkers : [],
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
      new TextLayer({
        id: "dist-labels",
        data: showDistMarkers ? distMarkers : [],
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText: (d) => d.label,
        getColor: [255, 255, 255],
        getSize: 11,
        getPixelOffset: [0, -14],
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        background: true,
        getBackgroundColor: [40, 40, 40, 200] as [number, number, number, number],
        backgroundPadding: [3, 1, 3, 1],
        updateTriggers: { getPosition: te },
      }),
      new ScatterplotLayer({
        id: "pin-dots",
        data: showPins ? pins : [],
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
      new TextLayer({
        id: "pin-labels",
        data: showPins ? pins : [],
        getPosition: (d) => [d.pt.lng, d.pt.lat, d.pt.elevation * te],
        getText: (d) => d.label,
        getColor: [255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -18],
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        background: true,
        getBackgroundColor: (d) => [...PIN_COLORS[d.id], 210] as [number, number, number, number],
        backgroundPadding: [4, 2, 4, 2],
        updateTriggers: { getPosition: te },
      }),
    ];
  }, [trackPoints, terrainExp, colorMode, elevationColors, paceColors, pins, distMarkers, showDistMarkers, showPins]);

  // ── derived values for child components ─────────────────────────────────

  const fogAreaKm2 = viewshedData !== null ? geojsonAreaKm2(viewshedData) : null;

  const fogStatus: "pending" | "processing" | "complete" | "error" | null =
    viewshedStatus === "idle"      ? null
    : viewshedStatus === "computing" ? "processing"
    : viewshedStatus === "done"      ? "complete"
    : "error";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
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
        unit={unit}
        onUnitChange={setUnit}
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
        fogRenderStyle={viewshedSmooth ? "smooth" : "grid"}
        onFogRenderStyleChange={(s) => setViewshedSmooth(s === "smooth")}
        fogAreaKm2={fogAreaKm2}
        fogObserverCount={fogObserverCount}
        unexploredOpacity={unexploredOpacity}
        onUnexploredOpacityChange={(v) => setUnexploredOpacity(Math.min(v, 0.8))}
        showDistMarkers={showDistMarkers}
        onShowDistMarkersChange={setShowDistMarkers}
        showPins={showPins}
        onShowPinsChange={setShowPins}
      />

      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
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
