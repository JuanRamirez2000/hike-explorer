import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { signInWithGoogle } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Your hikes,{" "}
            <span className="text-primary">beautifully visualized.</span>
          </h1>
          <p className="text-base-content/60 text-lg leading-relaxed">
            Drop a GPX file. Get stunning stats, elevation profiles, and
            shareable infographics — instantly.
          </p>
        </div>

        {user ? (
          <div className="flex gap-3">
            <Link href="/user" className="btn btn-primary btn-lg px-10">
              Go to Dashboard →
            </Link>
            <Link href="/upload" className="btn btn-outline btn-lg px-8">
              Upload Hike
            </Link>
          </div>
        ) : (
          <form action={signInWithGoogle}>
            <button type="submit" className="btn btn-primary btn-lg px-10">
              Sign in to Get Started →
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
