import { XMLParser } from "fast-xml-parser";
import type { GPXJson, GPXPoint } from "@/types/gpx";
import type {
  GPXMetadataSummary,
  HikeStats,
  ParsedHikePayload,
  ParsedTrackPoint,
} from "@/types/hike-upload";

function parseGPXXml(text: string): GPXJson {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tagName) =>
      ["trkpt", "trkseg", "trk", "wpt", "rte", "rtept"].includes(tagName),
  });
  return parser.parse(text) as GPXJson;
}

function extractTrackPoints(gpx: GPXJson): GPXPoint[] {
  const points: GPXPoint[] = [];
  for (const track of gpx.gpx.trk ?? []) {
    for (const segment of track.trkseg ?? []) {
      points.push(...(segment.trkpt ?? []));
    }
  }
  return points;
}

function computeBbox(
  points: GPXPoint[],
): [number, number, number, number] | null {
  if (points.length === 0) return null;

  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  for (const pt of points) {
    if (pt["@_lon"] < minLng) minLng = pt["@_lon"];
    if (pt["@_lat"] < minLat) minLat = pt["@_lat"];
    if (pt["@_lon"] > maxLng) maxLng = pt["@_lon"];
    if (pt["@_lat"] > maxLat) maxLat = pt["@_lat"];
  }

  return [minLng, minLat, maxLng, maxLat];
}

function computeElevationGainM(points: GPXPoint[]): number | null {
  const withEle = points.filter((p) => p.ele !== undefined);
  if (withEle.length < 2) return null;

  let gain = 0;
  for (let i = 1; i < withEle.length; i++) {
    const delta = withEle[i].ele! - withEle[i - 1].ele!;
    if (delta > 0) gain += delta;
  }
  return gain;
}

function haversineKm(
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

function computeDistanceKm(points: GPXPoint[]): number | null {
  if (points.length < 2) return null;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1]["@_lat"],
      points[i - 1]["@_lon"],
      points[i]["@_lat"],
      points[i]["@_lon"],
    );
  }
  return total;
}

function computeDurationSeconds(points: GPXPoint[]): number | null {
  const withTime = points.filter((p) => p.time !== undefined);
  if (withTime.length < 2) return null;
  const start = new Date(withTime[0].time!).getTime();
  const end = new Date(withTime[withTime.length - 1].time!).getTime();
  const diff = (end - start) / 1000;
  return diff > 0 ? diff : null;
}

function computeStats(points: GPXPoint[], creator: string): HikeStats {
  const withTime = points.filter((p) => p.time !== undefined);
  return {
    creator,
    elevationGainM: computeElevationGainM(points),
    distanceKm: computeDistanceKm(points),
    durationSeconds: computeDurationSeconds(points),
    startTime: withTime.length > 0 ? withTime[0].time! : null,
    endTime:
      withTime.length > 1 ? withTime[withTime.length - 1].time! : null,
  };
}

export async function getGPXMetadata(file: File): Promise<GPXMetadataSummary> {
  const text = await file.text();
  const gpxJson = parseGPXXml(text);
  const points = extractTrackPoints(gpxJson);
  const gpx = gpxJson.gpx;

  const name =
    gpx.metadata?.name ??
    gpx.trk?.[0]?.name ??
    file.name.replace(/\.gpx$/i, "");

  const rawDate = gpx.metadata?.time ?? points[0]?.time;
  const date = rawDate ? new Date(rawDate).toISOString().split("T")[0] : null;

  const creator = gpx["@_creator"] ?? "Unknown";
  const stats = computeStats(points, creator);

  return {
    name,
    date,
    creator,
    trackCount: gpx.trk?.length ?? 0,
    totalPoints: points.length,
    bbox: computeBbox(points),
    elevationGainM: stats.elevationGainM,
    distanceKm: stats.distanceKm,
    durationSeconds: stats.durationSeconds,
    startTime: stats.startTime,
    endTime: stats.endTime,
  };
}

export async function buildHikePayload(file: File): Promise<ParsedHikePayload> {
  const text = await file.text();
  const gpxJson = parseGPXXml(text);
  const points = extractTrackPoints(gpxJson);
  const gpx = gpxJson.gpx;

  const name =
    gpx.metadata?.name ??
    gpx.trk?.[0]?.name ??
    file.name.replace(/\.gpx$/i, "");

  const rawDate = gpx.metadata?.time ?? points[0]?.time;
  const date = rawDate ? new Date(rawDate).toISOString().split("T")[0] : null;

  const creator = gpx["@_creator"] ?? "Unknown";

  const trackPoints: ParsedTrackPoint[] = points.map((pt) => ({
    lat: pt["@_lat"],
    lng: pt["@_lon"],
    elevation: pt.ele ?? 0,
    timestamp: pt.time ?? null,
  }));

  return {
    name,
    date,
    bbox: computeBbox(points),
    trackPoints,
    stats: computeStats(points, creator),
  };
}
