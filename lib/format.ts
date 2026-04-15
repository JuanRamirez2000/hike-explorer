export type UnitSystem = "metric" | "imperial";

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function fmtDistance(km: number, unit: UnitSystem = "metric"): string {
  if (unit === "imperial") {
    return `${(km * 0.621371).toFixed(2)} mi`;
  }
  return `${km.toFixed(2)} km`;
}

export function fmtElevation(m: number, unit: UnitSystem = "metric"): string {
  if (unit === "imperial") {
    return `${Math.round(m * 3.28084)} ft`;
  }
  return `${Math.round(m)} m`;
}
