"use client";

import { useState } from "react";
import Map from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import type { MapViewState } from "@deck.gl/core";

import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
};

export default function MapView() {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 4rem)" }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as MapViewState)
        }
        controller
        layers={[]}
        style={{ position: "relative" }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          projection="mercator"
          reuseMaps
        />
      </DeckGL>
    </div>
  );
}
