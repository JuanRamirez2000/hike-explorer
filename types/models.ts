import type { hikes, trackPoints } from "@/db/schema";

export type Hike = typeof hikes.$inferSelect;
export type TrackPoint = typeof trackPoints.$inferSelect;

// Derived from the Drizzle enum so new statuses are picked up automatically
export type FogStatus = typeof hikes.$inferSelect["fog_status"];

// Lightweight shape passed to charts and map — no DB-specific fields
export type TrackPointSummary = {
  lat: number;
  lng: number;
  elevation: number;
  timestamp: string | null;
};

export function toTrackPointSummary(p: Pick<TrackPoint, "lat" | "lng" | "elevation" | "timestamp">): TrackPointSummary {
  return {
    lat: p.lat,
    lng: p.lng,
    elevation: p.elevation,
    timestamp: p.timestamp ? p.timestamp.toISOString() : null,
  };
}
