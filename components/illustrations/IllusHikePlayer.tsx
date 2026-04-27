export default function IllusHikePlayer() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full block">
      <rect width="320" height="200" fill="var(--cream)" />
      <rect x="18" y="22" width="284" height="156" rx="14" fill="var(--cream-2)" stroke="var(--border-inner)" />
      <path d="M 36 140 C 70 130, 90 100, 120 90 C 150 80, 170 60, 200 70 C 230 80, 260 60, 284 50"
        fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
      <path d="M 36 140 C 70 130, 90 100, 120 90 C 150 80, 170 60, 200 70 C 230 80, 260 60, 284 50 L 284 158 L 36 158 Z"
        fill="var(--color-primary-soft)" opacity="0.6" />
      <line x1="36" y1="158" x2="284" y2="158" stroke="var(--ink-15)" strokeWidth="1" />
      <g fontFamily="ui-monospace,Menlo,monospace" fontSize="9" fill="var(--ink-65)" letterSpacing="0.04em">
        <text x="36" y="42">DISTANCE</text>
        <text x="36" y="56" fontSize="13" fill="var(--ink)" fontFamily="-apple-system,system-ui,sans-serif" fontWeight="500">11.4 mi</text>
        <text x="130" y="42">GAIN</text>
        <text x="130" y="56" fontSize="13" fill="var(--ink)" fontFamily="-apple-system,system-ui,sans-serif" fontWeight="500">3,210 ft</text>
        <text x="220" y="42">REVEALED</text>
        <text x="220" y="56" fontSize="13" fill="var(--green)" fontFamily="-apple-system,system-ui,sans-serif" fontWeight="500">+ 84 km²</text>
      </g>
      <circle cx="170" cy="65" r="4" fill="var(--green)" />
      <line x1="170" y1="32" x2="170" y2="158" stroke="var(--green)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
    </svg>
  );
}
