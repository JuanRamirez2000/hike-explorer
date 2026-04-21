"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cumulativeDistancesKm } from "@/lib/geo";
import { downsamplePoints, CHART_MAX_POINTS } from "@/lib/chart-utils";
import type { TrackPointSummary } from "@/types/models";
import { convertDistance, convertElevation, type UnitSystem } from "@/lib/format";

interface Props {
  trackPoints: TrackPointSummary[];
  unit?: UnitSystem;
  height?: number;
}

export default function ElevationProfileChart({
  trackPoints,
  unit = "metric",
  height = 120,
}: Props) {
  const gradId = useId();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const { data, minElev, maxElev } = useMemo(() => {
    if (trackPoints.length < 2) return { data: [], minElev: 0, maxElev: 100 };
    const sampled = downsamplePoints(trackPoints, CHART_MAX_POINTS);
    const cumKms = cumulativeDistancesKm(sampled);
    const pts = sampled.map((pt, i) => ({
      dist: parseFloat(convertDistance(cumKms[i], unit).toFixed(2)),
      elev: Math.round(convertElevation(pt.elevation, unit)),
    }));
    const elevs = pts.map((p) => p.elev);
    return { data: pts, minElev: Math.min(...elevs), maxElev: Math.max(...elevs) };
  }, [trackPoints, unit]);

  if (!mounted || data.length < 2)
    return (
      <div
        className="w-full rounded bg-base-200/40 animate-pulse"
        style={{ height }}
      />
    );

  const distUnit = unit === "imperial" ? "mi" : "km";
  const elevUnit = unit === "imperial" ? "ft" : "m";
  const elevPad  = Math.max(10, Math.round((maxElev - minElev) * 0.05));
  const yDomain: [number, number] = [minElev - elevPad, maxElev + elevPad];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          {/* gradient: red at top (high elevation) → blue at bottom (low) */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
            <stop offset="40%" stopColor="#eab308" stopOpacity={0.65} />
            <stop offset="75%" stopColor="#22c55e" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
        <XAxis
          dataKey="dist"
          tick={{ fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}${distUnit}`}
          height={18}
        />
        <YAxis
          tick={{ fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}${elevUnit}`}
          width={38}
          domain={yDomain}
        />
        <Tooltip
          formatter={(v) => [`${v} ${elevUnit}`, "Elevation"]}
          labelFormatter={(l) => `${l} ${distUnit}`}
          contentStyle={{ fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="elev"
          stroke="#f97316"
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
