import { fmtDistance, fmtDuration, fmtElevation, type UnitSystem } from "@/lib/format";
import type { Hike, TrackPointSummary } from "@/types/models";
import ElevationProfileChart from "@/components/HikeComponents/ElevationProfileChart";
import PaceChart from "@/components/HikeComponents/PaceChart";

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
            <tr>
              <td className="text-base-content/60 pl-0">Distance</td>
              <td className="text-right pr-0 font-medium">
                {hike.distance_km !== null
                  ? fmtDistance(hike.distance_km, unit)
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-base-content/60 pl-0">Elev. gain</td>
              <td className="text-right pr-0 font-medium">
                {hike.elevation_gain_m !== null
                  ? fmtElevation(hike.elevation_gain_m, unit)
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-base-content/60 pl-0">Duration</td>
              <td className="text-right pr-0 font-medium">
                {fmtDuration(hike.duration_seconds)}
              </td>
            </tr>
            <tr>
              <td className="text-base-content/60 pl-0">Start</td>
              <td className="text-right pr-0 font-medium">
                {hike.start_time
                  ? new Date(hike.start_time).toLocaleString()
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        {trackPoints.length >= 2 && (
          <>
            <div className="divider my-0" />
            <div>
              <p className="text-xs text-base-content/50 mb-1">Elevation</p>
              <ElevationProfileChart
                trackPoints={trackPoints}
                unit={unit}
                height={90}
              />
            </div>
            <div>
              <p className="text-xs text-base-content/50 mb-1">Pace</p>
              <PaceChart trackPoints={trackPoints} unit={unit} height={80} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
