export default function TrailviewMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "block" }}>
      <g stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16"   cy="16"   r="11"  opacity="0.35" />
        <circle cx="16.4" cy="15.6" r="7.5" opacity="0.55" />
        <circle cx="16.8" cy="15.2" r="4"   opacity="0.85" />
        <path d="M 4 22 C 9 19, 11 14, 16 13 C 21 12, 24 9, 28 7" strokeWidth="1.6" />
        <circle cx="16.8" cy="15.2" r="1.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
