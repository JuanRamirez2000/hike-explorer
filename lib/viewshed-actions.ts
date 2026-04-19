"use server";

import { db } from "@/db";
import { hikes } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { FeatureCollection } from "geojson";

export async function triggerViewshed(
  hikeId: string,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: "No active session" };

  const [owned] = await db
    .select({ id: hikes.id })
    .from(hikes)
    .where(and(eq(hikes.id, hikeId), eq(hikes.user_id, user.id)))
    .limit(1);

  if (!owned) return { success: false, error: "Hike not found" };

  await db.update(hikes).set({ fog_status: "processing" }).where(eq(hikes.id, hikeId));

  const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-viewshed`;
  const resp = await fetch(edgeFnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ hikeId }),
  });

  if (!resp.ok) {
    await db.update(hikes).set({ fog_status: "error" }).where(eq(hikes.id, hikeId));
    return { success: false, error: `Edge function error: ${resp.status}` };
  }

  revalidatePath(`/hike/${hikeId}/map`);
  return { success: true };
}

export async function saveViewshed(
  hikeId: string,
  geojson: FeatureCollection,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const [owned] = await db
    .select({ id: hikes.id })
    .from(hikes)
    .where(and(eq(hikes.id, hikeId), eq(hikes.user_id, user.id)))
    .limit(1);

  if (!owned) return { success: false, error: "Hike not found" };

  await db
    .update(hikes)
    .set({
      fog_status: "complete",
      fog_geojson: geojson as unknown as Record<string, unknown>,
    })
    .where(eq(hikes.id, hikeId));

  revalidatePath(`/hike/${hikeId}/map`);
  return { success: true };
}
