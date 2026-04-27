import { TopoRings } from "./primitives";

export default function IllusSingleHike() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full block">
      <defs>
        <pattern id="hatchFB" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(44,44,42,0.10)" strokeWidth="1" />
        </pattern>
        <pattern id="dotsFB" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="2" cy="2" r="0.6" fill="rgba(44,44,42,0.20)" />
        </pattern>
        <clipPath id="revealFB">
          <path d="M 80 90 C 50 70, 70 40, 130 50 C 190 60, 230 40, 260 80 C 290 120, 250 160, 200 160 C 150 160, 110 150, 90 130 C 70 115, 60 100, 80 90 Z" />
        </clipPath>
      </defs>
      <rect width="320" height="200" fill="url(#dotsFB)" />
      <rect width="320" height="200" fill="url(#hatchFB)" />
      <g clipPath="url(#revealFB)">
        <rect width="320" height="200" fill="var(--cream-2)" />
        <TopoRings cx={150} cy={100} count={6} baseR={12} gap={11} />
        <TopoRings cx={220} cy={120} count={5} baseR={10} gap={11} />
        <TopoRings cx={150} cy={100} count={2} baseR={12} gap={11} className="topo-line green" />
      </g>
      <path d="M 80 90 C 50 70, 70 40, 130 50 C 190 60, 230 40, 260 80 C 290 120, 250 160, 200 160 C 150 160, 110 150, 90 130 C 70 115, 60 100, 80 90 Z"
        fill="none" stroke="var(--green)" strokeWidth="1.3" strokeDasharray="5 4" opacity="0.85" />
      <path d="M 100 140 C 130 120, 150 100, 180 100 C 210 100, 220 80, 240 70"
        fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="140" r="4" fill="var(--cream-2)" stroke="var(--green)" strokeWidth="1.4" />
      <circle cx="240" cy="70"  r="4" fill="var(--cream-2)" stroke="var(--green)" strokeWidth="1.4" />
    </svg>
  );
}
