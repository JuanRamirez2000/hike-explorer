import { db } from "@/db";
import { hikes } from "@/db/schema";
import { createClient } from "@/utills/server";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HikeCard from "./HikeCard";

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
              <HikeCard key={hike.id} hike={hike} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
