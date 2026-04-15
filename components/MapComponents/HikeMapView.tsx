"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, { type MapRef } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { PathLayer } from "@deck.gl/layers";
import type { MapViewState } from "@deck.gl/core";
import type { hikes } from "@/db/schema";
import HikeInfoCard from "./HikeInfoCard";

import "mapbox-gl/dist/mapbox-gl.css";

type Hike = typeof hikes.$inferSelect;
type TrackPoint = { lat: number; lng: number; elevation: number };

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TERRAIN_EXAGGERATION = 1.5;

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

export default function HikeMapView({
  hike,
  trackPoints,
  elevations,
}: {
  hike: Hike;
  trackPoints: TrackPoint[];
  elevations: number[];
}) {
  const [viewState, setViewState] = useState<MapViewState>(
    initialViewState(hike)
  );
  const mapRef = useRef<MapRef>(null);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: TERRAIN_EXAGGERATION });
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 90.0],
        "sky-atmosphere-sun-intensity": 15,
      },
    });
  }, []);

  const layers = useMemo(
    () => [
      new PathLayer({
        id: "hike-track",
        data: [{ path: trackPoints.map((p) => [p.lng, p.lat, p.elevation * TERRAIN_EXAGGERATION]) }],
        getPath: (d) => d.path,
        getColor: [234, 88, 12],
        getWidth: 4,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
      }),
    ],
    [trackPoints]
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 4rem)" }}>
      <HikeInfoCard hike={hike} elevations={elevations} />
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as MapViewState)
        }
        controller
        layers={layers}
        style={{ position: "relative" }}
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          projection="mercator"
          reuseMaps
          onLoad={onMapLoad}
        />
      </DeckGL>
    </div>
  );
}
