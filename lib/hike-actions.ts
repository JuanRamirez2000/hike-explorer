"use server";

import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import type { ParsedHikePayload, UploadResult } from "@/types/hike-upload";
import { createClient } from "@/utills/server";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ── helpers ───────────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ── actions ───────────────────────────────────────────────────────────────────

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

  revalidatePath("/user");
  return { success: true, hikeId: hike.id };
}

export async function deleteHike(
  hikeId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify ownership before deleting anything
  const owned = await db
    .select({ id: hikes.id })
    .from(hikes)
    .where(and(eq(hikes.id, hikeId), eq(hikes.user_id, user.id)))
    .limit(1);

  if (owned.length === 0) {
    return { success: false, error: "Hike not found" };
  }

  // Delete child rows first — guard against DB constraints that lack ON DELETE CASCADE
  await db.delete(trackPoints).where(eq(trackPoints.hike_id, hikeId));

  await db.delete(hikes).where(eq(hikes.id, hikeId));

  revalidatePath("/user");
  return { success: true };
}

export async function updateHike(
  hikeId: string,
  fields: { name: string; date: string | null; creator: string },
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const updated = await db
    .update(hikes)
    .set({
      name: fields.name,
      date: fields.date ?? undefined,
      creator: fields.creator || undefined,
    })
    .where(and(eq(hikes.id, hikeId), eq(hikes.user_id, user.id)))
    .returning({ id: hikes.id });

  if (updated.length === 0) {
    return { success: false, error: "Hike not found" };
  }

  revalidatePath("/user");
  return { success: true };
}
