import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { signInWithGoogle } from "@/lib/auth";
import { Eye, Layers, Sparkles, Check } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-14 md:py-20">
      <div className="flex flex-col items-center text-center gap-7">

        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 bg-base-100 border border-base-300 px-3.5 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-primary">Fog of war for hikers</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-medium leading-[1.0] tracking-tight">
          See every ridge<br />you&apos;ve ever seen.
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-base-content/65 max-w-md leading-relaxed">
          Upload a GPX file. Trailview computes what was physically visible from your route — and leaves the rest in fog.
        </p>

        {/* CTA row */}
        <div className="flex gap-3">
          {user ? (
            <Link href="/upload" className="btn btn-primary rounded-full btn-lg">
              Upload a GPX →
            </Link>
          ) : (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-primary rounded-full btn-lg">
                Upload a GPX →
              </button>
            </form>
          )}
          {user ? (
            <Link href="/user" className="btn btn-outline rounded-full btn-lg">
              Dashboard
            </Link>
          ) : (
            <button
              className="btn btn-outline rounded-full btn-lg cursor-not-allowed"
              disabled
              aria-disabled="true"
            >
              See an example
            </button>
          )}
        </div>

        {/* Three mini cards */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-xl">
          <div className="bg-base-100 border border-base-300 rounded-2xl px-4 py-3.5 flex items-center gap-2.5 flex-1 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye size={16} strokeWidth={1.6} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-base-content leading-tight">Ray-cast</p>
              <p className="text-[10px] text-base-content/60 mt-0.5 tracking-wide">real terrain geometry</p>
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-2xl px-4 py-3.5 flex items-center gap-2.5 flex-1 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers size={16} strokeWidth={1.6} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-base-content leading-tight">3D terrain</p>
              <p className="text-[10px] text-base-content/60 mt-0.5 tracking-wide">pitch · bearing · tilt</p>
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-2xl px-4 py-3.5 flex items-center gap-2.5 flex-1 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} strokeWidth={1.6} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-base-content leading-tight">~30 seconds</p>
              <p className="text-[10px] text-base-content/60 mt-0.5 tracking-wide">from upload to fog</p>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex items-center gap-3.5 text-xs font-medium text-base-content/50 flex-wrap justify-center">
          <span className="flex items-center gap-1.5">
            <Check size={12} strokeWidth={1.6} aria-hidden="true" />
            No signup required
          </span>
          <div className="w-[3px] h-[3px] rounded-full bg-base-content/30" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            <Check size={12} strokeWidth={1.6} aria-hidden="true" />
            Open source
          </span>
          <div className="w-[3px] h-[3px] rounded-full bg-base-content/30" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            <Check size={12} strokeWidth={1.6} aria-hidden="true" />
            Your data stays yours
          </span>
        </div>

      </div>
    </main>
  );
}
