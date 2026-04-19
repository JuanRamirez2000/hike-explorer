import type { hikes, trackPoints } from "@/db/schema";

export type Hike = typeof hikes.$inferSelect;
export type TrackPoint = typeof trackPoints.$inferSelect;

// Lightweight shape passed to charts and map — no DB-specific fields
export type TrackPointSummary = {
  lat: number;
  lng: number;
  elevation: number;
  timestamp: string | null;
};
