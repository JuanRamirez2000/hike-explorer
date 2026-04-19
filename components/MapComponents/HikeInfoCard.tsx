import { fmtDistance, fmtDuration, fmtElevation, type UnitSystem } from "@/lib/format";
import type { Hike, TrackPointSummary } from "@/types/models";
import StatRow from "@/components/StatRow";
import HikeCharts from "@/components/HikeComponents/HikeCharts";

export default function HikeInfoCard({
  hike,
  trackPoints = [],
  unit = "metric",
}: {
  hike: Hike;
  trackPoints?: TrackPointSummary[];
  unit?: UnitSystem;
}) {
  return (
    <div
      className="absolute top-4 left-4 z-10 card bg-base-100 shadow-xl w-72 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 6rem)" }}
    >
      <div className="card-body gap-3 p-5">
        <div>
          <h2 className="card-title text-base leading-tight">{hike.name}</h2>
          <p className="text-sm text-base-content/50">
            {hike.date ?? "No date"} · {hike.creator ?? "Unknown device"}
          </p>
        </div>

        <table className="table table-xs w-full">
          <tbody>
            <StatRow
              label="Distance"
              value={hike.distance_km !== null ? fmtDistance(hike.distance_km, unit) : "—"}
            />
            <StatRow
              label="Elev. gain"
              value={hike.elevation_gain_m !== null ? fmtElevation(hike.elevation_gain_m, unit) : "—"}
            />
            <StatRow label="Duration" value={fmtDuration(hike.duration_seconds)} />
            <StatRow
              label="Start"
              value={hike.start_time ? new Date(hike.start_time).toLocaleString() : "—"}
            />
          </tbody>
        </table>

        {trackPoints.length >= 2 && (
          <>
            <div className="divider my-0" />
            <HikeCharts trackPoints={trackPoints} unit={unit} elevationHeight={90} paceHeight={80} />
          </>
        )}
      </div>
    </div>
  );
}
