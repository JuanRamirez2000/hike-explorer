"use client";

import dynamic from "next/dynamic";
import type { hikes } from "@/db/schema";

type Hike = typeof hikes.$inferSelect;
type TrackPoint = { lat: number; lng: number; elevation: number };

const HikeMapView = dynamic(() => import("./HikeMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ height: "calc(100vh - 4rem)" }}>
      <span className="loading loading-spinner loading-lg" />
    </div>
  ),
});

export default function HikeMapLoader({
  hike,
  trackPoints,
  elevations,
}: {
  hike: Hike;
  trackPoints: TrackPoint[];
  elevations: number[];
}) {
  return <HikeMapView hike={hike} trackPoints={trackPoints} elevations={elevations} />;
}
