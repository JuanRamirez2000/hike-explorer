"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cumulativeDistancesKm, haversineKm } from "@/lib/geo";
import { downsamplePoints, CHART_MAX_POINTS } from "@/lib/chart-utils";
import type { TrackPointSummary } from "@/types/models";
import { convertDistance, convertPace, type UnitSystem } from "@/lib/format";

const MAX_PACE_KM = 30; // min/km — discard stopped/paused segments
const SMOOTH_WINDOW = 7;

function paceLabel(v: number): string {
  const m = Math.floor(v);
  const s = Math.round((v - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function smooth(values: (number | null)[]): (number | null)[] {
  const half = Math.floor(SMOOTH_WINDOW / 2);
  return values.map((_, i) => {
    const slice = values.slice(
      Math.max(0, i - half),
      Math.min(values.length, i + half + 1),
    );
    const valid = slice.filter((v): v is number => v !== null);
    return valid.length > 0
      ? valid.reduce((a, b) => a + b, 0) / valid.length
      : null;
  });
}

interface Props {
  trackPoints: TrackPointSummary[];
  unit?: UnitSystem;
  height?: number;
}

export default function PaceChart({ trackPoints, unit = "metric", height = 100 }: Props) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const data = useMemo(() => {
    if (trackPoints.length < 2) return null;
    if (!trackPoints.some((p) => p.timestamp)) return null;

    const sampled = downsamplePoints(trackPoints, CHART_MAX_POINTS);
    const dists = cumulativeDistancesKm(sampled);
    const rawPaces: (number | null)[] = [null];

    for (let i = 1; i < sampled.length; i++) {
      const prev = sampled[i - 1];
      const curr = sampled[i];
      const segKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);

      if (prev.timestamp && curr.timestamp && segKm > 0.001) {
        const dtMin =
          (new Date(curr.timestamp).getTime() -
            new Date(prev.timestamp).getTime()) /
          60000;
        const paceKm = dtMin / segKm;
        rawPaces.push(paceKm > 0 && paceKm < MAX_PACE_KM ? paceKm : null);
      } else {
        rawPaces.push(null);
      }
    }

    const smoothed = smooth(rawPaces);
    const validPaces = smoothed.filter((v): v is number => v !== null);
    if (validPaces.length === 0) return null;

    const avgKm = validPaces.reduce((a, b) => a + b, 0) / validPaces.length;

    const points = smoothed.map((paceKm, i) => ({
      dist: parseFloat(convertDistance(dists[i], unit).toFixed(2)),
      pace: paceKm !== null ? parseFloat(convertPace(paceKm, unit).toFixed(2)) : null,
    }));

    const avg = parseFloat(convertPace(avgKm, unit).toFixed(2));

    return { points, avg };
  }, [trackPoints, unit]);

  if (!mounted || !data)
    return null;

  const distUnit = unit === "imperial" ? "mi" : "km";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data.points}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      >
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
          tickFormatter={paceLabel}
          width={32}
          reversed
        />
        <Tooltip
          formatter={(v) => [paceLabel(v as number), "Pace"]}
          labelFormatter={(l) => `${l} ${distUnit}`}
          contentStyle={{ fontSize: 11 }}
        />
        <ReferenceLine
          y={data.avg}
          stroke="#6b7280"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Line
          type="monotone"
          dataKey="pace"
          stroke="#3b82f6"
          strokeWidth={1.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
