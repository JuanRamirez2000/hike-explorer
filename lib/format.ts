export type UnitSystem = "metric" | "imperial";

export const KM_TO_MI = 0.621371;
export const M_TO_FT  = 3.28084;
export const MI_TO_KM = 1.60934;

// pace is stored internally as min/km; convert to min/mi for imperial
export function fmtPace(minPerKm: number | null, unit: UnitSystem = "metric"): string {
  if (minPerKm === null) return "—";
  const adjusted = unit === "imperial" ? minPerKm * MI_TO_KM : minPerKm;
  const m = Math.floor(adjusted);
  const s = Math.round((adjusted - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")} ${unit === "imperial" ? "/mi" : "/km"}`;
}

export function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function fmtDistance(km: number, unit: UnitSystem = "metric"): string {
  return unit === "imperial"
    ? `${(km * KM_TO_MI).toFixed(2)} mi`
    : `${km.toFixed(2)} km`;
}

export function fmtElevation(m: number, unit: UnitSystem = "metric"): string {
  return unit === "imperial"
    ? `${Math.round(m * M_TO_FT)} ft`
    : `${Math.round(m)} m`;
}
