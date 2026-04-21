"use client";

import { deleteHike, updateHike } from "@/lib/hike-actions";
import type { Hike, TrackPointSummary } from "@/types/models";
import { fmtDuration, fmtDistance, fmtElevation, fmtAvgPace, type UnitSystem } from "@/lib/format";
import { IconShare, IconEdit, IconDelete } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteHikeModal from "@/components/HikeComponents/DeleteHikeModal";
import EditHikeForm from "@/components/HikeComponents/EditHikeForm";
import HikeCharts from "@/components/HikeComponents/HikeCharts";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

function buildMinimapUrl(
  trackPoints: TrackPointSummary[],
  bbox: number[] | null,
  width = 600,
  height = 320,
): string {
  if (!MAPBOX_TOKEN) return "";
  const base = "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static";

  if (trackPoints.length >= 2) {
    const step = Math.max(1, Math.floor(trackPoints.length / 60));
    const pts = trackPoints.filter((_, i) => i % step === 0);
    if (pts[pts.length - 1] !== trackPoints[trackPoints.length - 1]) {
      pts.push(trackPoints[trackPoints.length - 1]);
    }
    const geojson = JSON.stringify({
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts.map((p) => [p.lng, p.lat]) },
      properties: { stroke: "#f97316", "stroke-width": 3, "stroke-opacity": 0.9 },
    });
    return `${base}/geojson(${encodeURIComponent(geojson)})/auto/${width}x${height}?padding=30&access_token=${MAPBOX_TOKEN}`;
  }

  if (bbox && bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const lng = ((minLng + maxLng) / 2).toFixed(4);
    const lat = ((minLat + maxLat) / 2).toFixed(4);
    return `${base}/${lng},${lat},10,0/${width}x${height}?access_token=${MAPBOX_TOKEN}`;
  }

  return "";
}


export default function HikeCard({
  hike,
  trackPoints = [],
}: {
  hike: Hike;
  trackPoints?: TrackPointSummary[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unit, setUnit] = useState<UnitSystem>("metric");

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteHike(hike.id);
    if (result.success) {
      router.refresh();
    } else {
      setShowDeleteModal(false);
      setError(result.error ?? "Delete failed");
      setBusy(false);
    }
  }

  async function handleSave(data: {
    name: string;
    date: string;
    creator: string;
  }) {
    setBusy(true);
    setError(null);
    const result = await updateHike(hike.id, {
      name: data.name,
      date: data.date || null,
      creator: data.creator,
    });
    if (result.success) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Update failed");
    }
    setBusy(false);
  }

  const minimapUrl = buildMinimapUrl(trackPoints, hike.bbox);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
      {/* TODO: Map thumbnail — render a static mini-map preview using a Mapbox Static Image
          API URL (bbox from hike.bbox). Requires exposing NEXT_PUBLIC_MAPBOX_TOKEN client-side
          and deciding on image dimensions. Deferred: needs Static Images API integration. */}
      {minimapUrl && !editing && (
        <div className="relative w-full" style={{ height: 160 }}>
          <Image
            src={minimapUrl}
            alt={`Map thumbnail for ${hike.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="card-body gap-3 p-5">
        {editing ? (
          <EditHikeForm
            initialName={hike.name}
            initialDate={hike.date ?? ""}
            initialCreator={hike.creator ?? ""}
            busy={busy}
            error={error}
            onSave={handleSave}
            onCancel={() => {
              setError(null);
              setEditing(false);
            }}
          />
        ) : (
          <>
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              {/* TODO: Difficulty badge — auto-compute from elevation_gain_m / distance_km ratio.
                  Deferred: needs an agreed difficulty scale and thresholds defined. */}
              {/* TODO: Route type badge (out-and-back vs loop) — compare start/end track point
                  proximity. Deferred: requires trackPoints being passed to the card. */}
              {/* TODO: Fog coverage pill — show "XX% explored" badge derived from fog_geojson area
                  vs hike bbox area. Deferred: requires a client-side area computation (turf.js) and
                  fog_geojson being passed down to this card. */}
            </div>

            {/* Hike name + subtitle */}
            <div>
              <h2 className="card-title text-base leading-tight">{hike.name}</h2>
              <p className="text-sm text-base-content/50">
                {hike.date ?? "No date"} · {hike.creator ?? "Unknown device"}
              </p>
            </div>

            {/* 2×2 stat grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-base-content/50">Distance</p>
                <p className="text-sm font-medium">
                  {hike.distance_km !== null ? fmtDistance(hike.distance_km, unit) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Elev. gain</p>
                <p className="text-sm font-medium">
                  {hike.elevation_gain_m !== null ? fmtElevation(hike.elevation_gain_m, unit) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Duration</p>
                <p className="text-sm font-medium">{fmtDuration(hike.duration_seconds)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Avg pace</p>
                <p className="text-sm font-medium">
                  {fmtAvgPace(hike.duration_seconds, hike.distance_km, unit)}
                </p>
              </div>
            </div>

            {/* Elevation sparkline */}
            {trackPoints.length >= 2 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-base-content/50">Elevation</p>
                  <div className="join">
                    <button
                      className={`join-item btn btn-xs ${unit === "metric" ? "btn-neutral" : "btn-ghost"}`}
                      onClick={() => setUnit("metric")}
                    >
                      km
                    </button>
                    <button
                      className={`join-item btn btn-xs ${unit === "imperial" ? "btn-neutral" : "btn-ghost"}`}
                      onClick={() => setUnit("imperial")}
                    >
                      mi
                    </button>
                  </div>
                </div>
                <HikeCharts
                  trackPoints={trackPoints}
                  unit={unit}
                  elevationHeight={56}
                  paceHeight={0}
                />
              </div>
            )}

            {error && <p className="text-error text-sm">{error}</p>}

            {/* Action row */}
            <div className="flex items-center gap-1 pt-1">
              <Link
                href={`/hike/${hike.id}/map`}
                className="btn btn-primary btn-sm flex-1"
              >
                Open map
              </Link>

              {/* TODO: Share button — generate a shareable link or export modal.
                  Deferred: sharing feature not yet designed. */}
              <button
                className="btn btn-ghost btn-square btn-sm"
                title="Share"
                disabled
              >
                <IconShare />
              </button>

              <button
                className="btn btn-ghost btn-square btn-sm"
                title="Edit"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                <IconEdit />
              </button>

              <button
                className="btn btn-ghost btn-square btn-sm text-error"
                title="Delete"
                onClick={() => setShowDeleteModal(true)}
                disabled={busy}
              >
                <IconDelete />
              </button>
            </div>
          </>
        )}
      </div>

      <DeleteHikeModal
        hikeName={hike.name}
        open={showDeleteModal}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
