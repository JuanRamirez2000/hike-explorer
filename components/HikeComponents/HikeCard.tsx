"use client";

import { deleteHike, updateHike } from "@/lib/hike-actions";
import type { Hike, TrackPointSummary } from "@/types/models";
import { fmtDuration, fmtDistance, fmtElevation, type UnitSystem } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteHikeModal from "@/components/HikeComponents/DeleteHikeModal";
import EditHikeForm from "@/components/HikeComponents/EditHikeForm";
import StatRow from "@/components/StatRow";
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
            <div>
              <h2 className="card-title text-base leading-tight">
                {hike.name}
              </h2>
              <p className="text-sm text-base-content/50">
                {hike.date ?? "No date"} · {hike.creator ?? "Unknown device"}
              </p>
            </div>

            <table className="table table-xs w-full">
              <tbody>
                <StatRow
                  label="Distance"
                  value={
                    hike.distance_km !== null
                      ? fmtDistance(hike.distance_km, unit)
                      : "—"
                  }
                />
                <StatRow
                  label="Elev. gain"
                  value={
                    hike.elevation_gain_m !== null
                      ? fmtElevation(hike.elevation_gain_m, unit)
                      : "—"
                  }
                />
                <StatRow
                  label="Duration"
                  value={fmtDuration(hike.duration_seconds)}
                />
                <StatRow
                  label="Start"
                  value={
                    hike.start_time
                      ? new Date(hike.start_time).toLocaleString()
                      : "—"
                  }
                />
              </tbody>
            </table>

            {trackPoints.length >= 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-base-content/50">Charts</p>
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
                <HikeCharts trackPoints={trackPoints} unit={unit} />
              </div>
            )}

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="card-actions justify-end pt-1">
              <Link
                href={`/hike/${hike.id}/map`}
                className="btn btn-primary btn-sm"
              >
                View on Map
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                Edit
              </button>
              <button
                className="btn btn-error btn-sm btn-outline"
                onClick={() => setShowDeleteModal(true)}
                disabled={busy}
              >
                Delete
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
