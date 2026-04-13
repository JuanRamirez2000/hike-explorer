"use server";

import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import type { ParsedHikePayload, UploadResult } from "@/types/hike-upload";

export async function saveHike(
  payload: ParsedHikePayload,
  userId: string,
): Promise<UploadResult> {
  if (payload.trackPoints.length === 0) {
    return { success: false, error: "GPX file contains no track points" };
  }

  const { stats } = payload;

  const [hike] = await db
    .insert(hikes)
    .values({
      user_id: userId,
      name: payload.name,
      date: payload.date ?? undefined,
      bbox: payload.bbox ?? undefined,
      creator: stats.creator || undefined,
      distance_km: stats.distanceKm ?? undefined,
      elevation_gain_m: stats.elevationGainM ?? undefined,
      duration_seconds: stats.durationSeconds ?? undefined,
      start_time: stats.startTime ? new Date(stats.startTime) : undefined,
      end_time: stats.endTime ? new Date(stats.endTime) : undefined,
    })
    .returning({ id: hikes.id });

  const rows = payload.trackPoints.map((pt, seq) => ({
    hike_id: hike.id,
    seq,
    lat: pt.lat,
    lng: pt.lng,
    elevation: pt.elevation,
    timestamp: pt.timestamp ? new Date(pt.timestamp) : null,
  }));

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insert(trackPoints).values(rows.slice(i, i + CHUNK_SIZE));
  }

  return { success: true, hikeId: hike.id };
}
