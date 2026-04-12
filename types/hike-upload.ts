export interface GPXMetadataSummary {
  name: string;
  date: string | null;
  creator: string;
  trackCount: number;
  totalPoints: number;
  bbox: [number, number, number, number] | null;
}

export interface ParsedTrackPoint {
  lat: number;
  lng: number;
  elevation: number;
  timestamp: string | null;
}

export interface ParsedHikePayload {
  name: string;
  date: string | null;
  bbox: [number, number, number, number] | null;
  trackPoints: ParsedTrackPoint[];
}

export type UploadResult =
  | { success: true; hikeId: string }
  | { success: false; error: string };
