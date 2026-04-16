import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq, asc } from "drizzle-orm";
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

  const [hike] = await db
    .select()
    .from(hikes)
    .where(eq(hikes.id, id))
    .limit(1);

  if (!hike || hike.user_id !== user.id) notFound();

  const points = await db
    .select({
      lat: trackPoints.lat,
      lng: trackPoints.lng,
      elevation: trackPoints.elevation,
      timestamp: trackPoints.timestamp,
    })
    .from(trackPoints)
    .where(eq(trackPoints.hike_id, id))
    .orderBy(asc(trackPoints.seq));

  const trackPointSummaries = points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    elevation: p.elevation,
    timestamp: p.timestamp ? p.timestamp.toISOString() : null,
  }));

  return <HikeMapLoader hike={hike} trackPoints={trackPointSummaries} />;
}
