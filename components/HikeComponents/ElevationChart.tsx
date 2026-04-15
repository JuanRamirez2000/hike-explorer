"use client";

import { useId } from "react";

const CHART_H = 64;
const CHART_W = 300; // viewBox units — scales to any container width

function downsample(values: number[], max: number): number[] {
  if (values.length <= max) return values;
  const step = values.length / max;
  return Array.from({ length: max }, (_, i) => values[Math.round(i * step)]);
}

export default function ElevationChart({
  elevations,
  color = "#22c55e",
  height = 56,
}: {
  elevations: number[];
  color?: string;
  height?: number;
}) {
  const gradientId = useId();

  if (elevations.length < 2) return null;

  const pts = downsample(elevations, 200);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const xs = pts.map((_, i) => (i / (pts.length - 1)) * CHART_W);
  const ys = pts.map((e) => CHART_H - ((e - min) / range) * CHART_H);

  const linePts = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const areaPts = `0,${CHART_H} ${linePts} ${CHART_W},${CHART_H}`;

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-label="Elevation profile"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gradientId})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
