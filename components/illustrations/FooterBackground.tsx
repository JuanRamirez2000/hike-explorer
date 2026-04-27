import { TopoRings } from "./primitives";

export default function FooterBackground() {
  return (
    <svg
      viewBox="0 0 1440 560"
      className="absolute inset-0 w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="footHatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(44,44,42,0.07)" strokeWidth="1" />
        </pattern>
        <pattern id="footDots" patternUnits="userSpaceOnUse" width="16" height="16">
          <circle cx="2" cy="2" r="0.7" fill="rgba(44,44,42,0.14)" />
        </pattern>
        <pattern id="footGrid" patternUnits="userSpaceOnUse" width="120" height="120">
          <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(44,44,42,0.06)" strokeWidth="1" />
        </pattern>
        <clipPath id="footReveal">
          <path d="M 120 360 C 60 320, 80 240, 220 220 C 380 200, 560 180, 720 200 C 880 220, 1080 200, 1240 230 C 1380 255, 1430 320, 1380 400 C 1320 470, 1100 480, 900 470 C 700 460, 480 470, 320 460 C 180 452, 90 420, 120 360 Z" />
        </clipPath>
      </defs>

      <rect width="1440" height="560" fill="var(--cream-2)" />
      <rect width="1440" height="560" fill="url(#footGrid)" />
      <rect width="1440" height="560" fill="url(#footDots)" />
      <rect width="1440" height="560" fill="url(#footHatch)" />

      <g opacity="0.35">
        <TopoRings cx={140}  cy={120} count={4} baseR={20} gap={20} />
        <TopoRings cx={1320} cy={140} count={4} baseR={18} gap={20} />
        <TopoRings cx={1380} cy={500} count={3} baseR={16} gap={18} />
        <TopoRings cx={80}   cy={500} count={3} baseR={16} gap={18} />
      </g>

      <g clipPath="url(#footReveal)">
        <rect width="1440" height="560" fill="var(--cream)" />
        <TopoRings cx={360}  cy={340} count={9}  baseR={22} gap={14} />
        <TopoRings cx={720}  cy={300} count={11} baseR={26} gap={14} />
        <TopoRings cx={1080} cy={350} count={9}  baseR={22} gap={14} />
        <TopoRings cx={720}  cy={300} count={3}  baseR={26} gap={14} className="topo-line green" />
      </g>

      <path
        d="M 120 360 C 60 320, 80 240, 220 220 C 380 200, 560 180, 720 200 C 880 220, 1080 200, 1240 230 C 1380 255, 1430 320, 1380 400 C 1320 470, 1100 480, 900 470 C 700 460, 480 470, 320 460 C 180 452, 90 420, 120 360 Z"
        fill="none" stroke="var(--green)" strokeWidth="1.5" strokeDasharray="7 6" opacity="0.7"
      />
      <path
        d="M 80 460 C 220 420, 340 360, 480 340 C 620 320, 760 300, 880 290 C 1020 280, 1180 320, 1360 300"
        fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" opacity="0.8"
      />

      <g fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--ink-65)">
        <text x="40"   y="40">N 47.6062°</text>
        <text x="1300" y="40">W 122.3321°</text>
        <text x="40"   y="535">↳ continue west</text>
        <text x="1240" y="535">end of guide</text>
      </g>
    </svg>
  );
}
