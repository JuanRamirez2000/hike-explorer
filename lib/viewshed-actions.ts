"use server";

import { db } from "@/db";
import { hikes } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { FeatureCollection } from "geojson";

const EDGE_FN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-viewshed`;

// Fire-and-forget dispatch to the Edge Function.
// Sets fog_status = 'processing' before firing, 'error' if the request throws.
export async function fireViewshed(hikeId: string, accessToken: string): Promise<void> {
  await db.update(hikes).set({ fog_status: "processing" }).where(eq(hikes.id, hikeId));
  fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ hikeId }),
  }).catch(() => {
    db.update(hikes).set({ fog_status: "error" }).where(eq(hikes.id, hikeId));
  });
}

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

  await fireViewshed(hikeId, session.access_token);

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
