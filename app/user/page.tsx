import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import { createClient } from "@/utills/server";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HikeCard from "@/components/HikeComponents/HikeCard";

export default async function UserPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const userHikes = await db
    .select()
    .from(hikes)
    .where(eq(hikes.user_id, user.id))
    .orderBy(desc(hikes.created_at));

  const hikeIds = userHikes.map((h) => h.id);
  const elevationRows =
    hikeIds.length > 0
      ? await db
          .select({
            hike_id: trackPoints.hike_id,
            elevation: trackPoints.elevation,
          })
          .from(trackPoints)
          .where(inArray(trackPoints.hike_id, hikeIds))
          .orderBy(asc(trackPoints.hike_id), asc(trackPoints.seq))
      : [];

  const elevationsByHike = new Map<string, number[]>();
  for (const row of elevationRows) {
    const arr = elevationsByHike.get(row.hike_id) ?? [];
    arr.push(row.elevation);
    elevationsByHike.set(row.hike_id, arr);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Hikes</h1>
          <a href="/test" className="btn btn-primary btn-sm">
            + Upload Hike
          </a>
        </div>

        {userHikes.length === 0 ? (
          <div className="text-center py-20 text-base-content/50">
            No hikes yet.{" "}
            <a href="/test" className="link">
              Upload your first GPX file.
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userHikes.map((hike) => (
              <HikeCard
                key={hike.id}
                hike={hike}
                elevations={elevationsByHike.get(hike.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
