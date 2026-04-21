export type UnitSystem = "metric" | "imperial";

export const KM_TO_MI = 0.621371;
export const M_TO_FT = 3.28084;
export const MI_TO_KM = 1.60934;

// ── unit conversion helpers ───────────────────────────────────────────────────

export function convertDistance(km: number, unit: UnitSystem): number {
  return unit === "imperial" ? km * KM_TO_MI : km;
}

export function convertElevation(m: number, unit: UnitSystem): number {
  return unit === "imperial" ? m * M_TO_FT : m;
}

/** pace is stored internally as min/km; converts to min/mi for imperial */
export function convertPace(minPerKm: number, unit: UnitSystem): number {
  return unit === "imperial" ? minPerKm * MI_TO_KM : minPerKm;
}

// ── formatters ────────────────────────────────────────────────────────────────

export function fmtPace(minPerKm: number | null, unit: UnitSystem = "metric"): string {
  if (minPerKm === null) return "—";
  const v = convertPace(minPerKm, unit);
  const m = Math.floor(v);
  const s = Math.round((v - m) * 60);
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
    ? `${convertDistance(km, unit).toFixed(2)} mi`
    : `${km.toFixed(2)} km`;
}

export function fmtElevation(m: number, unit: UnitSystem = "metric"): string {
  return unit === "imperial"
    ? `${Math.round(convertElevation(m, unit))} ft`
    : `${Math.round(m)} m`;
}

export function fmtAvgPace(
  durationSeconds: number | null,
  distanceKm: number | null,
  unit: UnitSystem,
): string {
  if (durationSeconds === null || distanceKm === null || distanceKm === 0) return "—";
  const minPerKm = durationSeconds / 60 / distanceKm;
  const pace = unit === "imperial" ? minPerKm * MI_TO_KM : minPerKm;
  const totalSeconds = Math.round(pace * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /${unit === "imperial" ? "mi" : "km"}`;
}
