"use client";

// Intentional thin wrapper: keeps `ssr: false` and the loading skeleton co-located
// with the import boundary, so the page RSC stays clean.
import dynamic from "next/dynamic";
import type { Hike, TrackPointSummary } from "@/types/models";

const HikeMapView = dynamic(() => import("./HikeMapView"), {
  ssr: false,
  loading: () => (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      <span className="loading loading-spinner loading-lg" />
    </div>
  ),
});

export default function HikeMapLoader({
  hike,
  trackPoints,
}: {
  hike: Hike;
  trackPoints: TrackPointSummary[];
}) {
  return <HikeMapView hike={hike} trackPoints={trackPoints} />;
}
