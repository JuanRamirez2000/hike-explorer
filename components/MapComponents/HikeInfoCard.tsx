import { fmtDistance, fmtDuration, fmtElevation } from "@/lib/format";
import type { hikes } from "@/db/schema";
import ElevationChart from "@/components/HikeComponents/ElevationChart";

type Hike = typeof hikes.$inferSelect;

export default function HikeInfoCard({
  hike,
  elevations = [],
}: {
  hike: Hike;
  elevations?: number[];
}) {
  return (
    <div className="absolute top-4 left-4 z-10 card bg-base-100 shadow-xl w-72">
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
                  ? fmtDistance(hike.distance_km)
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-base-content/60 pl-0">Elev. gain</td>
              <td className="text-right pr-0 font-medium">
                {hike.elevation_gain_m !== null
                  ? fmtElevation(hike.elevation_gain_m)
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-base-content/60 pl-0">Duration</td>
              <td className="text-right pr-0 font-medium">
                {hike.duration_seconds !== null
                  ? fmtDuration(hike.duration_seconds)
                  : "—"}
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

        {elevations.length >= 2 && (
          <>
            <div className="divider my-0" />
            <div>
              <p className="text-xs text-base-content/50 mb-1">Elevation</p>
              <ElevationChart elevations={elevations} color="#22c55e" height={96} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
