export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Maximum data points passed to recharts — keeps render fast for long hikes
export const CHART_MAX_POINTS = 300;

export function downsamplePoints<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)]);
}

// Interpolate along a multi-stop color gradient.
// t is clamped to [0, 1].
export function lerpColor(
  gradient: [number, number, number][],
  t: number,
): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const seg = (gradient.length - 1) * t;
  const i = Math.min(Math.floor(seg), gradient.length - 2);
  const f = seg - i;
  return gradient[i].map((c, j) =>
    Math.round(c + f * (gradient[i + 1][j] - c)),
  ) as [number, number, number];
}
