export function TopoRings({
  cx, cy,
  count = 8, baseR = 30, gap = 18,
  className = "topo-line",
}: {
  cx: number; cy: number;
  count?: number; baseR?: number; gap?: number;
  className?: string;
}) {
  const N = 64;
  const wobble = 6;
  const rings: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const r = baseR + i * gap;
    const pts: string[] = [];
    for (let k = 0; k < N; k++) {
      const t = (k / N) * Math.PI * 2;
      const n = Math.sin(t * 3 + i * 1.7) * 0.4 + Math.sin(t * 5 + i) * 0.6;
      const rr = r + n * wobble;
      pts.push((k === 0 ? "M" : "L") + (cx + Math.cos(t) * rr).toFixed(1) + " " + (cy + Math.sin(t) * rr).toFixed(1));
    }
    pts.push("Z");
    rings.push(<path key={i} d={pts.join(" ")} className={className} />);
  }
  return <g>{rings}</g>;
}

export function Marker({ cx, cy, label, accent = false, size = 8 }: {
  cx: number; cy: number; label?: string; accent?: boolean; size?: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={size + 4} fill="var(--cream-2)" stroke={accent ? "var(--green)" : "var(--ink)"} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={size / 2} fill={accent ? "var(--green)" : "var(--ink)"} />
      {label && (
        <text x={cx + size + 8} y={cy + 4} fontFamily="ui-monospace,Menlo,monospace" fontSize="10" fill="var(--ink-65)" letterSpacing="0.04em">
          {label}
        </text>
      )}
    </g>
  );
}
