import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { signInWithGoogle } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import TrailviewMark from "@/components/TrailviewMark";
import HeroBackground from "@/components/illustrations/HeroBackground";
import FooterBackground from "@/components/illustrations/FooterBackground";
import IllusHikePlayer from "@/components/illustrations/IllusHikePlayer";
import IllusSingleHike from "@/components/illustrations/IllusSingleHike";
import IllusAtlas from "@/components/illustrations/IllusAtlas";

// ── Feature data ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    n: "01", eyebrow: "Hike player", illus: "player" as const,
    title: "Replay every step with the stats that matter.",
    body: "Scrub through your route, watch elevation rise, and see the viewshed expand in real time. Distance, gain, and revealed area, all in one timeline.",
  },
  {
    n: "02", eyebrow: "Hike viewshed", illus: "single" as const,
    title: "See exactly what one walk earned you.",
    body: "Every hike gets its own page — a private viewshed map showing only the terrain you could see from your feet. New ridges glow on first reveal.",
  },
  {
    n: "03", eyebrow: "Lifetime atlas", illus: "atlas" as const,
    title: "Your unfogged world, all in one map.",
    body: "Every hike merges into a personal atlas. The fog recedes wherever you've walked. Watch a continent slowly come into focus, year over year.",
    bullets: ["All hikes, one viewshed", "Yearly time-lapse", "Print as a poster"],
  },
];

// ── Sections ───────────────────────────────────────────────────────────────

function Illus({ kind }: { kind: "player" | "single" | "atlas" }) {
  if (kind === "player") return <IllusHikePlayer />;
  if (kind === "single") return <IllusSingleHike />;
  return <IllusAtlas />;
}

function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100dvh - 88px)", minHeight: 560, background: "var(--cream)", overflow: "hidden" }}>
      <HeroBackground />

      {/* Foreground: headline + CTAs */}
      <div className="absolute z-[5] left-5 right-5 top-10 lg:left-20 lg:right-auto lg:top-[100px] lg:w-[580px]">
        <div className="badge rounded-full bg-base-200 border border-border-card py-3 px-3 mb-7 gap-2">
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)", display: "inline-block" }} />
          <span className="text-[12px] opacity-70">Now in early access</span>
        </div>

        <h1 className="font-medium tracking-tight" style={{ fontSize: "clamp(48px, 8vw, 92px)", margin: 0, lineHeight: 0.98 }}>
          Walk it<br />
          to <span style={{ color: "var(--green)" }}>unfog</span> it.
        </h1>

        <p className="text-[18px] opacity-65 mt-7 leading-[1.5]" style={{ maxWidth: 460 }}>
          Trail View is a hiking atlas that starts blank. The terrain you could see from your feet — only that — gets etched in. Everything else is a rumor.
        </p>

        <div className="flex flex-wrap gap-3 mt-9">
          {isAuthed ? (
            <Link href="/upload" className="btn btn-primary rounded-full px-6 h-12 text-[15px] font-medium gap-2">
              Upload your first hike <ArrowRight size={14} />
            </Link>
          ) : (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-primary rounded-full px-6 h-12 text-[15px] font-medium gap-2">
                Upload your first hike <ArrowRight size={14} />
              </button>
            </form>
          )}
          <Link href="/demo" className="btn btn-ghost rounded-full px-5 h-12 border border-border-card font-medium">
            Sample atlas
          </Link>
        </div>
      </div>

      {/* Reveal boundary annotation — desktop only */}
      <div className="hidden lg:block absolute z-[5]" style={{ left: 480, top: 110 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ width: 1, height: 60, background: "var(--green)", marginTop: 6 }} />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--green)" }}>Reveal boundary</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] mt-1 opacity-55">line-of-sight from trail</div>
          </div>
        </div>
      </div>

      {/* Bottom legend bar */}
      <div className="absolute z-[5] left-4 right-4 bottom-8 lg:left-20 lg:right-20 flex items-center justify-between gap-y-2 flex-wrap">
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-border-inner bg-base-200 px-4 py-2.5 flex items-center gap-2.5">
            <div style={{ width: 18, height: 10, borderRadius: 2, background: "var(--cream-2)", border: "1px solid var(--border-inner)" }} />
            <span className="font-mono text-[11px] opacity-80">Visible terrain</span>
          </div>
          <div className="rounded-2xl border border-border-inner bg-base-200 px-4 py-2.5 flex items-center gap-2.5">
            <div style={{ width: 18, height: 10, borderRadius: 2, backgroundImage: "repeating-linear-gradient(45deg, rgba(44,44,42,0.15) 0 1px, transparent 1px 5px)" }} />
            <span className="font-mono text-[11px] opacity-80">Unknown</span>
          </div>
          <div className="rounded-2xl border border-border-inner bg-base-200 px-4 py-2.5 flex items-center gap-2.5">
            <svg width="22" height="10" aria-hidden="true"><path d="M 1 5 L 21 5" stroke="var(--green)" strokeWidth="2" /></svg>
            <span className="font-mono text-[11px] opacity-80">Trail</span>
          </div>
        </div>
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-[0.08em] opacity-55">↓ scroll</span>
      </div>
    </div>
  );
}

function FeaturesF3() {
  const atlas = FEATURES[2];
  const small = [FEATURES[0], FEATURES[1]];

  return (
    <section className="px-6 py-16 lg:px-20 lg:py-28 bg-base-100">
      {/* Header */}
      <div className="mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.08em] opacity-60 mb-3">Chapter two · features</div>
          <h2 className="text-4xl lg:text-5xl font-medium tracking-tight max-w-3xl leading-[1.05]">
            One map gets bigger every time you lace up.
          </h2>
        </div>
        <Link href="/demo" className="btn btn-ghost rounded-full border border-border-card font-medium text-sm shrink-0 self-start lg:self-auto">
          See a sample atlas →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Marquee card — Lifetime atlas */}
        <div className="lg:col-span-7 bg-base-200 border border-border-card rounded-3xl shadow-card overflow-hidden flex flex-col">
          <div className="flex-1 min-h-[240px] lg:min-h-[420px] border-b border-border-inner bg-base-100">
            <Illus kind={atlas.illus} />
          </div>
          <div className="p-6 lg:p-9">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-55">{atlas.n} · marquee</span>
              <span className="badge rounded-full bg-primary/10 text-primary border-0 font-medium">{atlas.eyebrow}</span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-medium leading-tight tracking-tight mb-4 max-w-xl">{atlas.title}</h3>
            <p className="text-base opacity-65 leading-relaxed max-w-lg mb-6">{atlas.body}</p>
            {"bullets" in atlas && atlas.bullets && (
              <div className="flex gap-2 flex-wrap">
                {atlas.bullets.map((b) => (
                  <span key={b} className="badge rounded-full bg-base-100 border border-border-inner text-[12px] py-3 px-3 font-normal">{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stacked small cards */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {small.map((f) => (
            <div key={f.n} className="bg-base-200 border border-border-card rounded-3xl shadow-card overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:flex-1">
              <div className="border-b sm:border-b-0 sm:border-r border-border-inner bg-base-100 min-h-[180px] sm:min-h-0">
                <Illus kind={f.illus} />
              </div>
              <div className="p-5 lg:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-55">{f.n}</span>
                  <span className="text-[12px] text-primary font-medium">{f.eyebrow}</span>
                </div>
                <h3 className="text-base lg:text-lg font-medium leading-snug tracking-tight mb-2">{f.title}</h3>
                <p className="text-[13px] opacity-65 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="px-6 py-16 lg:px-20 lg:py-24 bg-base-200 border-y border-border-card">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.08em] opacity-60 mb-3">Ready when you are</div>
          <h2 className="text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            Start with one hike.<br />
            Watch the fog recede.
          </h2>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          {isAuthed ? (
            <Link href="/upload" className="btn btn-primary rounded-full px-7 h-14 text-base font-medium gap-2">
              Upload your first hike <ArrowRight size={16} />
            </Link>
          ) : (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn btn-primary rounded-full px-7 h-14 text-base font-medium gap-2">
                Upload your first hike <ArrowRight size={16} />
              </button>
            </form>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-55">GPX · FIT · Strava</span>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="relative bg-base-200 border-t border-border-card overflow-hidden">
      <FooterBackground />

      {/* Foreground */}
      <div className="relative px-6 pt-16 pb-24 lg:px-20 lg:pt-24 lg:pb-40">
        <div className="flex items-center justify-between mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">Chapter ∞ · keep walking</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">colophon</span>
        </div>

        {/* Giant wordmark */}
        <div className="flex flex-col items-start gap-4 mb-2 lg:flex-row lg:items-end lg:gap-6">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-primary flex items-center justify-center text-primary-content shrink-0">
            <TrailviewMark size={56} />
          </div>
          <h2
            className="font-medium text-base-content"
            style={{ fontSize: "clamp(56px, 18vw, 280px)", letterSpacing: "-0.04em", lineHeight: 0.85 }}
          >
            Trail<span className="text-primary">View</span>
          </h2>
        </div>

        {/* Bottom meta bar */}
        <div className="border-t border-border-card mt-16 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">© 2026 Trail View · field guide v0.1</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">Made for people who&apos;d rather earn the view.</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">48.7°N · 121.8°W</span>
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function Home() {
  const user = await getCurrentUser();
  const isAuthed = !!user;
  return (
    <>
      <HeroSection isAuthed={isAuthed} />
      <FeaturesF3 />
      <ClosingCTA isAuthed={isAuthed} />
      <FooterSection />
    </>
  );
}
