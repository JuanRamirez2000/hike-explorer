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

// ── degree/meter conversions ──────────────────────────────────────────────────

export function metersToDegreeLat(m: number): number {
  return m / 111_320;
}

export function metersToDegreeLng(m: number, lat: number): number {
  return m / (111_320 * Math.cos((lat * Math.PI) / 180));
}

// ── RDP decimation ────────────────────────────────────────────────────────────

function perpendicularDistanceM(
  pt: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const cosLat = Math.cos((a.lat * Math.PI) / 180);
  const px = (pt.lng - a.lng) * 111_320 * cosLat;
  const py = (pt.lat - a.lat) * 111_320;
  const dx = (b.lng - a.lng) * 111_320 * cosLat;
  const dy = (b.lat - a.lat) * 111_320;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt(px * px + py * py);
  return Math.abs(px * dy - py * dx) / Math.sqrt(len2);
}

export function rdpDecimate<T extends { lat: number; lng: number }>(
  pts: T[],
  toleranceM = 10,
): T[] {
  if (pts.length <= 2) return pts;
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDistanceM(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > toleranceM) {
    const left  = rdpDecimate(pts.slice(0, maxIdx + 1), toleranceM);
    const right = rdpDecimate(pts.slice(maxIdx),         toleranceM);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

// ── chart helpers ─────────────────────────────────────────────────────────────

// Maximum data points passed to recharts — keeps render fast for long hikes
export const CHART_MAX_POINTS = 300;

export function cumulativeDistancesKm(pts: { lat: number; lng: number }[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    result.push(result[i - 1] + haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng));
  }
  return result;
}

export function downsamplePoints<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)]);
}

// ── color interpolation ───────────────────────────────────────────────────────

// t is clamped to [0, 1]
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
