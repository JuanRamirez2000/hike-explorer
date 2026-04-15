import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { createClient } from "@/utills/server";
import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import HikeMapLoader from "@/components/MapComponents/HikeMapLoader";

export default async function HikeMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    })
    .from(trackPoints)
    .where(eq(trackPoints.hike_id, id))
    .orderBy(asc(trackPoints.seq));

  const elevations = points.map((p) => p.elevation);

  return <HikeMapLoader hike={hike} trackPoints={points} elevations={elevations} />;
}
