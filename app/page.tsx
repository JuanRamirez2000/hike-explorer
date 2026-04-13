import Link from "next/link";

export default function Home() {
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

        <Link href="/test" className="btn btn-primary btn-lg px-10">
          Generate Your First Graphic →
        </Link>

        {/*
          PLACEHOLDER GRAPHIC — replace this entire <svg> with a real hike
          infographic component once the design is ready. The graphic should
          show actual user hike data pulled from the GPX parser output.

          Current contents are hardcoded stand-ins:
            - Elevation polyline: fake mountain silhouette points
            - Stat labels: Miles / Elev. Gain / Time with dummy values
            - Route dot: represents the trailhead marker
        */}
        <svg
          viewBox="0 0 400 200"
          className="w-full max-w-sm mt-4"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Sample hike graphic"
        >
          {/* Background */}
          <rect width="400" height="200" rx="16" fill="oklch(97% 0.02 145)" />

          {/* Hike name + meta */}
          <text x="24" y="36" fontFamily="inherit" fontSize="14" fontWeight="700" fill="oklch(30% 0.05 145)">
            Yosemite Valley Loop
          </text>
          <text x="24" y="54" fontFamily="inherit" fontSize="11" fill="oklch(60% 0.03 145)">
            Oct 12, 2023 · Completed
          </text>

          {/* Elevation silhouette — fake mountain curve */}
          <polyline
            points="24,140 80,100 130,115 180,70 230,85 280,60 330,90 376,120"
            fill="none"
            stroke="oklch(65% 0.18 145)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Fill under the elevation line */}
          <polygon
            points="24,140 80,100 130,115 180,70 230,85 280,60 330,90 376,120 376,155 24,155"
            fill="oklch(65% 0.18 145)"
            opacity="0.15"
          />

          {/* Summit dot */}
          <circle cx="280" cy="60" r="4" fill="oklch(65% 0.18 145)" />

          {/* Divider */}
          <line x1="24" y1="163" x2="376" y2="163" stroke="oklch(85% 0.03 145)" strokeWidth="1" />

          {/* Stat: Miles */}
          <text x="75" y="183" fontFamily="inherit" fontSize="16" fontWeight="700" textAnchor="middle" fill="oklch(30% 0.05 145)">
            11.5
          </text>
          <text x="75" y="196" fontFamily="inherit" fontSize="10" textAnchor="middle" fill="oklch(60% 0.03 145)">
            Miles
          </text>

          {/* Stat dividers */}
          <line x1="160" y1="168" x2="160" y2="198" stroke="oklch(85% 0.03 145)" strokeWidth="1" />
          <line x1="240" y1="168" x2="240" y2="198" stroke="oklch(85% 0.03 145)" strokeWidth="1" />

          {/* Stat: Elev. Gain */}
          <text x="200" y="183" fontFamily="inherit" fontSize="16" fontWeight="700" textAnchor="middle" fill="oklch(30% 0.05 145)">
            2,300
          </text>
          <text x="200" y="196" fontFamily="inherit" fontSize="10" textAnchor="middle" fill="oklch(60% 0.03 145)">
            Elev. Gain
          </text>

          {/* Stat: Time */}
          <text x="325" y="183" fontFamily="inherit" fontSize="16" fontWeight="700" textAnchor="middle" fill="oklch(30% 0.05 145)">
            4h 20m
          </text>
          <text x="325" y="196" fontFamily="inherit" fontSize="10" textAnchor="middle" fill="oklch(60% 0.03 145)">
            Time
          </text>
        </svg>
      </div>
    </main>
  );
}
