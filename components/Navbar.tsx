import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "@/lib/auth";

export default async function Navbar() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="navbar border-b border-base-200 bg-base-100 px-6 sticky top-0 z-50">
      <div className="flex-1">
        <Link
          href="/"
          className="text-base font-bold tracking-tight flex items-center gap-2"
        >
          <span className="text-primary">🥾</span> Hike Explorer
        </Link>
      </div>
      <div className="flex-1 flex justify-end gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            <form action={signOut}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
            <Link href="/user" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Log In
              </button>
            </form>
            <Link href="/upload" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
