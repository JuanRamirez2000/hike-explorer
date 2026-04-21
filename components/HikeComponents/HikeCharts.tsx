"use client";

import type { TrackPointSummary } from "@/types/models";
import type { UnitSystem } from "@/lib/format";
import ElevationProfileChart from "@/components/HikeComponents/ElevationProfileChart";
import PaceChart from "@/components/HikeComponents/PaceChart";

interface Props {
  trackPoints: TrackPointSummary[];
  unit: UnitSystem;
  elevationHeight?: number;
  paceHeight?: number;
}

export default function HikeCharts({
  trackPoints,
  unit,
  elevationHeight = 110,
  paceHeight = 90,
}: Props) {
  if (trackPoints.length < 2) return null;

  return (
    <>
      <div>
        <p className="text-xs text-base-content/50 mb-1">Elevation</p>
        <ElevationProfileChart trackPoints={trackPoints} unit={unit} height={elevationHeight} />
      </div>
      {paceHeight > 0 && (
        <div>
          <p className="text-xs text-base-content/50 mb-1">Pace</p>
          <PaceChart trackPoints={trackPoints} unit={unit} height={paceHeight} />
        </div>
      )}
    </>
  );
}
