import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import TrailviewMark from "@/components/TrailviewMark";

export default async function Navbar() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-5 pb-2 pointer-events-none">
      <nav className="navbar bg-base-200 border border-border-card rounded-2xl px-4 py-2 shadow-card pointer-events-auto">
        <div className="flex-1 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-content shrink-0">
              <TrailviewMark size={22} />
            </div>
            <span className="font-medium tracking-tight text-[17px]">Trail View</span>
          </Link>
          <span className="hidden lg:inline text-xs uppercase tracking-[0.08em] font-mono opacity-60 ml-3">
            Field guide v0.1
          </span>
        </div>

        <div className="flex-none flex items-center gap-2">
          {user ? (
            <>
              <Link href="/user" className="btn btn-ghost btn-sm rounded-full px-4 font-medium">
                Dashboard
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="btn btn-sm rounded-full px-4 bg-base-300 border border-border-card hover:bg-base-100 font-medium"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-primary btn-sm rounded-full px-5 font-medium gap-1.5">
                Get started
                <ArrowRight size={12} />
              </button>
            </form>
          )}
        </div>
      </nav>
    </div>
  );
}
