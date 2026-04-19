import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { getCurrentUser } from "@/lib/supabase/session";
import { eq, asc, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import HikeMapLoader from "@/components/MapComponents/HikeMapLoader";

export default async function HikeMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [hikeResult, points] = await Promise.all([
    db
      .select()
      .from(hikes)
      .where(and(eq(hikes.id, id), eq(hikes.user_id, user.id)))
      .limit(1),
    db
      .select({
        lat: trackPoints.lat,
        lng: trackPoints.lng,
        elevation: trackPoints.elevation,
        timestamp: trackPoints.timestamp,
      })
      .from(trackPoints)
      .where(eq(trackPoints.hike_id, id))
      .orderBy(asc(trackPoints.seq)),
  ]);

  const [hike] = hikeResult;
  if (!hike) notFound();

  const trackPointSummaries = points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    elevation: p.elevation,
    timestamp: p.timestamp ? p.timestamp.toISOString() : null,
  }));

  return <HikeMapLoader hike={hike} trackPoints={trackPointSummaries} />;
}
