import { TopoRings } from "./primitives";

export default function IllusAtlas() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full block">
      <defs>
        <pattern id="hatchFC" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(44,44,42,0.10)" strokeWidth="1" />
        </pattern>
        <pattern id="dotsFC" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="2" cy="2" r="0.6" fill="rgba(44,44,42,0.20)" />
        </pattern>
        <pattern id="gridFC" patternUnits="userSpaceOnUse" width="40" height="40">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(44,44,42,0.06)" strokeWidth="1" />
        </pattern>
        <clipPath id="reveal1"><ellipse cx="70"  cy="70"  rx="38" ry="28" /></clipPath>
        <clipPath id="reveal2"><ellipse cx="180" cy="100" rx="48" ry="34" transform="rotate(-12 180 100)" /></clipPath>
        <clipPath id="reveal3"><ellipse cx="250" cy="150" rx="32" ry="22" /></clipPath>
      </defs>
      <rect width="320" height="200" fill="var(--cream)" />
      <rect width="320" height="200" fill="url(#gridFC)" />
      <rect width="320" height="200" fill="url(#dotsFC)" />
      <rect width="320" height="200" fill="url(#hatchFC)" />
      <g clipPath="url(#reveal1)">
        <rect width="320" height="200" fill="var(--cream-2)" />
        <TopoRings cx={70} cy={70} count={5} baseR={8} gap={8} />
      </g>
      <g clipPath="url(#reveal2)">
        <rect width="320" height="200" fill="var(--cream-2)" />
        <TopoRings cx={170} cy={95}  count={5} baseR={8} gap={9} />
        <TopoRings cx={200} cy={110} count={4} baseR={7} gap={8} />
      </g>
      <g clipPath="url(#reveal3)">
        <rect width="320" height="200" fill="var(--cream-2)" />
        <TopoRings cx={250} cy={150} count={4} baseR={6} gap={7} />
      </g>
      <ellipse cx="70"  cy="70"  rx="38" ry="28" fill="none" stroke="var(--green)" strokeDasharray="4 3" strokeWidth="1.1" opacity="0.8" />
      <ellipse cx="180" cy="100" rx="48" ry="34" transform="rotate(-12 180 100)" fill="none" stroke="var(--green)" strokeDasharray="4 3" strokeWidth="1.1" opacity="0.8" />
      <ellipse cx="250" cy="150" rx="32" ry="22" fill="none" stroke="var(--green)" strokeDasharray="4 3" strokeWidth="1.1" opacity="0.8" />
      <circle cx="70"  cy="70"  r="3" fill="var(--green)" />
      <circle cx="180" cy="100" r="3" fill="var(--green)" />
      <circle cx="250" cy="150" r="3" fill="var(--green)" />
    </svg>
  );
}
