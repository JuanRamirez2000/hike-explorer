import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import HikeCard from "@/components/HikeComponents/HikeCard";
import type { TrackPointSummary } from "@/types/models";

export default async function UserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const userHikes = await db
    .select()
    .from(hikes)
    .where(eq(hikes.user_id, user.id))
    .orderBy(desc(hikes.created_at));

  const hikeIds = userHikes.map((h) => h.id);
  const tpRows =
    hikeIds.length > 0
      ? await db
          .select({
            hike_id: trackPoints.hike_id,
            lat: trackPoints.lat,
            lng: trackPoints.lng,
            elevation: trackPoints.elevation,
            timestamp: trackPoints.timestamp,
          })
          .from(trackPoints)
          .where(inArray(trackPoints.hike_id, hikeIds))
          .orderBy(asc(trackPoints.hike_id), asc(trackPoints.seq))
      : [];

  const trackPointsByHike = new Map<string, TrackPointSummary[]>();
  for (const row of tpRows) {
    const arr = trackPointsByHike.get(row.hike_id) ?? [];
    arr.push({
      lat: row.lat,
      lng: row.lng,
      elevation: row.elevation,
      timestamp: row.timestamp ? row.timestamp.toISOString() : null,
    });
    trackPointsByHike.set(row.hike_id, arr);
  }

  const totalDistanceKm = userHikes.reduce(
    (sum, h) => sum + (h.distance_km ?? 0),
    0,
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Hikes</h1>
            {userHikes.length > 0 && (
              <p className="text-sm text-base-content/50 mt-1">
                {userHikes.length} hike{userHikes.length !== 1 ? "s" : ""} ·{" "}
                {totalDistanceKm.toFixed(1)} km total
              </p>
            )}
          </div>
          <a href="/upload" className="btn btn-primary btn-sm">
            + Upload Hike
          </a>
        </div>

        {userHikes.length === 0 ? (
          <div className="text-center py-20 text-base-content/50">
            No hikes yet.{" "}
            <a href="/upload" className="link">
              Upload your first GPX file.
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userHikes.map((hike) => (
              <HikeCard
                key={hike.id}
                hike={hike}
                trackPoints={trackPointsByHike.get(hike.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
