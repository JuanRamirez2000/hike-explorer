import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { getCurrentUser } from "@/lib/supabase/session";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import HikeCard from "@/components/HikeComponents/HikeCard";
import DashboardStats from "@/components/DashboardStats";
import type { TrackPointSummary } from "@/types/models";
import { CHART_MAX_POINTS } from "@/lib/chart-utils";

export default async function UserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const userHikes = await db
    .select()
    .from(hikes)
    .where(eq(hikes.user_id, user.id))
    .orderBy(desc(hikes.created_at));

  // Fetch a capped number of track points per hike in parallel — dashboard charts
  // only display CHART_MAX_POINTS points, so pulling the full track is wasteful.
  const trackPointsByHike = new Map<string, TrackPointSummary[]>();
  if (userHikes.length > 0) {
    const results = await Promise.all(
      userHikes.map(async (hike) => {
        const pts = await db
          .select({
            lat: trackPoints.lat,
            lng: trackPoints.lng,
            elevation: trackPoints.elevation,
            timestamp: trackPoints.timestamp,
          })
          .from(trackPoints)
          .where(eq(trackPoints.hike_id, hike.id))
          .orderBy(asc(trackPoints.seq))
          .limit(CHART_MAX_POINTS);
        return { hikeId: hike.id, pts };
      }),
    );

    for (const { hikeId, pts } of results) {
      trackPointsByHike.set(
        hikeId,
        pts.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          elevation: p.elevation,
          timestamp: p.timestamp ? p.timestamp.toISOString() : null,
        })),
      );
    }
  }

  const totalDistanceKm = userHikes.reduce(
    (sum, h) => sum + (h.distance_km ?? 0),
    0,
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <DashboardStats
          hikeCount={userHikes.length}
          totalDistanceKm={totalDistanceKm}
        />

        {userHikes.length === 0 ? (
          <div className="text-center py-20 text-base-content/50">
            No hikes yet.{" "}
            <Link href="/upload" className="link">
              Upload your first GPX file.
            </Link>
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
