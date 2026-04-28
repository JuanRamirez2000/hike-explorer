import "server-only";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import type { GPXJson } from "@/types/gpx";
import type { Hike, TrackPointSummary } from "@/types/models";
import { haversineKm } from "@/lib/geo";

export function getDemoHikeData(): {
  hike: Hike;
  trackPoints: TrackPointSummary[];
} {
  const text = fs.readFileSync(
    path.join(process.cwd(), "data", "strawberry_peak.gpx"),
    "utf-8",
  );

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tagName) =>
      ["trkpt", "trkseg", "trk", "wpt", "rte", "rtept"].includes(tagName),
  });

  const gpxJson = parser.parse(text) as GPXJson;
  const gpx = gpxJson.gpx;

  // Garmin GPX encodes lat/lon with 25+ significant digits (e.g. 34.2591221630573272705078125)
  // which exceeds float64 precision, causing fast-xml-parser to leave them as strings.
  // Coerce explicitly so all downstream math uses proper numbers.
  const pts = ([] as Array<{ lat: number; lng: number; ele: number; time?: string }>);
  for (const track of gpx.trk ?? []) {
    for (const segment of track.trkseg ?? []) {
      for (const trkpt of segment.trkpt ?? []) {
        pts.push({
          lat: Number(trkpt["@_lat"]),
          lng: Number(trkpt["@_lon"]),
          ele: Number(trkpt.ele ?? 0),
          time: trkpt.time,
        });
      }
    }
  }

  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const pt of pts) {
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lng > maxLng) maxLng = pt.lng;
    if (pt.lat > maxLat) maxLat = pt.lat;
  }
  const bbox = pts.length > 0 ? [minLng, minLat, maxLng, maxLat] : null;

  let distanceKm = 0;
  for (let i = 1; i < pts.length; i++) {
    distanceKm += haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
  }

  let elevationGainM = 0;
  for (let i = 1; i < pts.length; i++) {
    const delta = pts[i].ele - pts[i - 1].ele;
    if (delta > 0) elevationGainM += delta;
  }

  const withTime = pts.filter((p) => p.time !== undefined);
  const startTimeStr = withTime.length > 0 ? withTime[0].time! : null;
  const endTimeStr =
    withTime.length > 1 ? withTime[withTime.length - 1].time! : null;
  const durationSeconds =
    startTimeStr && endTimeStr
      ? (new Date(endTimeStr).getTime() - new Date(startTimeStr).getTime()) /
        1000
      : null;

  const name =
    gpx.metadata?.name ?? gpx.trk?.[0]?.name ?? "Strawberry Peak";
  const creator = gpx["@_creator"] ?? "Unknown";

  const rawDate = gpx.metadata?.time ?? withTime[0]?.time;
  const dateStr = rawDate
    ? new Date(rawDate).toISOString().split("T")[0]
    : null;

  const hike: Hike = {
    id: "demo",
    user_id: "demo",
    name,
    date: dateStr,
    bbox,
    creator,
    distance_km: pts.length > 1 ? distanceKm : null,
    elevation_gain_m: elevationGainM > 0 ? elevationGainM : null,
    duration_seconds: durationSeconds,
    start_time: startTimeStr ? new Date(startTimeStr) : null,
    end_time: endTimeStr ? new Date(endTimeStr) : null,
    gpx_storage_path: null,
    extra: null,
    fog_status: "pending",
    fog_geojson: null,
    created_at: new Date(),
  };

  const trackPoints: TrackPointSummary[] = pts.map((pt) => ({
    lat: pt.lat,
    lng: pt.lng,
    elevation: pt.ele,
    timestamp: pt.time ?? null,
  }));

  return { hike, trackPoints };
}
