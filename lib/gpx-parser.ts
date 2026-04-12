import { XMLParser } from "fast-xml-parser";
import type { GPXJson, GPXPoint } from "@/types/gpx";
import type {
  GPXMetadataSummary,
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

  return {
    name,
    date,
    creator: gpx["@_creator"] ?? "Unknown",
    trackCount: gpx.trk?.length ?? 0,
    totalPoints: points.length,
    bbox: computeBbox(points),
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
  };
}
