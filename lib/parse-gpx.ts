"use server";

import { XMLParser } from "fast-xml-parser";
import { db } from "@/db";
import { hikes, trackPoints } from "@/db/schema";
import type { GPXJson, GPXPoint } from "@/types/gpx";

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

export interface GPXMetadataSummary {
  name: string;
  date: string | null;
  creator: string;
  trackCount: number;
  totalPoints: number;
  bbox: [number, number, number, number] | null;
}

export async function getGPXMetadata(
  file: File,
): Promise<GPXMetadataSummary> {
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

type UploadResult =
  | { success: true; hikeId: string }
  | { success: false; error: string };

export async function parseGPXFile(
  file: File | null,
  userId: string,
): Promise<UploadResult> {
  if (!file) return { success: false, error: "No file provided" };

  const text = await file.text();
  const gpxJson = parseGPXXml(text);
  const points = extractTrackPoints(gpxJson);

  if (points.length === 0) {
    return { success: false, error: "GPX file contains no track points" };
  }

  const gpxRoot = gpxJson.gpx;
  const name =
    gpxRoot.metadata?.name ??
    gpxRoot.trk?.[0]?.name ??
    file.name.replace(/\.gpx$/i, "");

  const rawDate = gpxRoot.metadata?.time ?? points[0]?.time;
  const date = rawDate ? new Date(rawDate).toISOString().split("T")[0] : null;

  const bbox = computeBbox(points);

  const [hike] = await db
    .insert(hikes)
    .values({
      user_id: userId,
      name,
      date: date ?? undefined,
      bbox: bbox ?? undefined,
    })
    .returning({ id: hikes.id });

  const trackPointRows = points.map((pt, seq) => ({
    hike_id: hike.id,
    seq,
    lat: pt["@_lat"],
    lng: pt["@_lon"],
    elevation: pt.ele ?? 0,
    timestamp: pt.time ? new Date(pt.time) : null,
  }));

  // Insert in chunks to avoid hitting query size limits
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < trackPointRows.length; i += CHUNK_SIZE) {
    await db
      .insert(trackPoints)
      .values(trackPointRows.slice(i, i + CHUNK_SIZE));
  }

  return { success: true, hikeId: hike.id };
}
