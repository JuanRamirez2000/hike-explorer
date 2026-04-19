"use server";

import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import type { ParsedHikePayload, UploadResult } from "@/types/hike-upload";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const CHUNK_SIZE = 1000;

// ── actions ───────────────────────────────────────────────────────────────────

export async function saveHike(
  payload: ParsedHikePayload,
  gpxFile?: File,
): Promise<UploadResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (payload.trackPoints.length === 0) {
    return { success: false, error: "GPX file contains no track points" };
  }

  let gpxStoragePath: string | null = null;
  if (gpxFile) {
    const storagePath = `${user.id}/${crypto.randomUUID()}.gpx`;
    const { error: storageError } = await supabase.storage
      .from("gpx-files")
      .upload(storagePath, gpxFile, { contentType: "application/gpx+xml" });
    if (storageError) {
      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}`,
      };
    }
    gpxStoragePath = storagePath;
  }

  const userId = user.id;
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
      gpx_storage_path: gpxStoragePath,
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

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insert(trackPoints).values(rows.slice(i, i + CHUNK_SIZE));
  }

  // Kick off the viewshed Edge Function now that track points are committed.
  // We await only the 202 acknowledgment — the Edge Function runs in the background.
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-viewshed`;
    await db.update(hikes).set({ fog_status: "processing" }).where(eq(hikes.id, hike.id));
    fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ hikeId: hike.id }),
    }).catch(() => {
      // Non-fatal: fog_status stays 'processing'; user can retry from the map
      db.update(hikes).set({ fog_status: "error" }).where(eq(hikes.id, hike.id));
    });
  }

  revalidatePath("/user");
  return { success: true, hikeId: hike.id };
}

export async function deleteHike(
  hikeId: string,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const [owned] = await db
    .select({ id: hikes.id, gpx_storage_path: hikes.gpx_storage_path })
    .from(hikes)
    .where(and(eq(hikes.id, hikeId), eq(hikes.user_id, user.id)))
    .limit(1);

  if (!owned) {
    return { success: false, error: "Hike not found" };
  }

  if (owned.gpx_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("gpx-files")
      .remove([owned.gpx_storage_path]);
    if (storageError) {
      return {
        success: false,
        error: `Failed to delete file: ${storageError.message}`,
      };
    }
  }

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
