import { TopoRings, Marker } from "./primitives";

export default function HeroBackground() {
  return (
    <svg
      viewBox="0 0 1440 820"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="hatchHC" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(44,44,42,0.09)" strokeWidth="1" />
        </pattern>
        <pattern id="dotsHC" patternUnits="userSpaceOnUse" width="16" height="16">
          <circle cx="2" cy="2" r="0.8" fill="rgba(44,44,42,0.18)" />
        </pattern>
        <pattern id="gridHC" patternUnits="userSpaceOnUse" width="120" height="120">
          <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(44,44,42,0.07)" strokeWidth="1" />
        </pattern>
        <clipPath id="revealHC">
          <path d="M 540 180 C 460 140, 460 90, 580 70 C 720 50, 880 40, 1020 70 C 1180 110, 1340 180, 1380 340 C 1410 460, 1340 580, 1200 650 C 1060 720, 880 740, 720 710 C 600 690, 520 640, 480 560 C 440 480, 420 410, 460 340 C 480 280, 500 220, 540 180 Z" />
        </clipPath>
      </defs>

      <rect width="1440" height="820" fill="var(--cream)" />
      <rect width="1440" height="820" fill="url(#gridHC)" />
      <rect width="1440" height="820" fill="url(#dotsHC)" />
      <rect width="1440" height="820" fill="url(#hatchHC)" />

      <g opacity="0.3">
        <TopoRings cx={150} cy={620} count={5} baseR={22} gap={22} />
        <TopoRings cx={280} cy={730} count={3} baseR={18} gap={20} />
      </g>

      <g clipPath="url(#revealHC)">
        <rect width="1440" height="820" fill="var(--cream-2)" />
        <TopoRings cx={780}  cy={310} count={11} baseR={26} gap={16} />
        <TopoRings cx={1080} cy={460} count={9}  baseR={22} gap={16} />
        <TopoRings cx={620}  cy={510} count={7}  baseR={18} gap={14} />
        <TopoRings cx={1220} cy={270} count={6}  baseR={18} gap={14} />
        <TopoRings cx={780}  cy={310} count={3}  baseR={26} gap={16} className="topo-line green" />
      </g>

      <path
        d="M 540 180 C 460 140, 460 90, 580 70 C 720 50, 880 40, 1020 70 C 1180 110, 1340 180, 1380 340 C 1410 460, 1340 580, 1200 650 C 1060 720, 880 740, 720 710 C 600 690, 520 640, 480 560 C 440 480, 420 410, 460 340 C 480 280, 500 220, 540 180 Z"
        fill="none" stroke="var(--green)" strokeWidth="1.5" strokeDasharray="7 6" opacity="0.9"
      />

      <path
        d="M 580 640 C 640 580, 660 520, 720 470 C 780 420, 760 380, 800 340 C 840 300, 880 280, 940 240 C 1000 200, 1050 190, 1120 200"
        fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round"
      />
      <Marker cx={580}  cy={640} accent label="Trailhead · 0.0 mi" size={9} />
      <Marker cx={1120} cy={200} accent label="Summit · 11.4 mi"   size={9} />

      <text x="40"   y="40"  fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--ink-65)">N 47.6062°</text>
      <text x="1340" y="40"  fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--ink-65)">W 122.3321°</text>
      <text x="40"   y="800" fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--ink-65)">N 47.5800°</text>
      <text x="1340" y="800" fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--ink-65)">W 122.2800°</text>
    </svg>
  );
}
