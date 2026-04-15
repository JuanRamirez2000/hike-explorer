"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg" />
    </div>
  ),
});

export default function MapLoader() {
  return <MapView />;
}
