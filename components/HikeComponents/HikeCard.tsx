"use client";

import { deleteHike, updateHike } from "@/lib/hike-actions";
import type { hikes } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeleteHikeModal from "@/components/HikeComponents/DeleteHikeModal";
import StatRow from "@/components/StatRow";
import ElevationChart from "@/components/HikeComponents/ElevationChart";

type Hike = typeof hikes.$inferSelect;

function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HikeCard({
  hike,
  elevations = [],
}: {
  hike: Hike;
  elevations?: number[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // edit form state seeded from hike
  const [name, setName] = useState(hike.name);
  const [date, setDate] = useState(hike.date ?? "");
  const [creator, setCreator] = useState(hike.creator ?? "");

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

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateHike(hike.id, {
      name: name.trim(),
      date: date || null,
      creator: creator.trim(),
    });
    if (result.success) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Update failed");
    }
    setBusy(false);
  }

  function handleCancelEdit() {
    setName(hike.name);
    setDate(hike.date ?? "");
    setCreator(hike.creator ?? "");
    setError(null);
    setEditing(false);
  }

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body gap-3 p-5">
        {editing ? (
          /* ── edit form ── */
          <div className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text text-xs text-base-content/60 mb-1">
                Name
              </span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-xs text-base-content/60 mb-1">
                Date
              </span>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-xs text-base-content/60 mb-1">
                Creator / Device
              </span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
              />
            </label>

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                className="btn btn-primary btn-sm flex-1"
                onClick={handleSave}
                disabled={busy}
              >
                {busy && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Save
              </button>
              <button
                className="btn btn-ghost btn-sm flex-1"
                onClick={handleCancelEdit}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── display mode ── */
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
                      ? `${hike.distance_km.toFixed(2)} km`
                      : "—"
                  }
                />
                <StatRow
                  label="Elev. gain"
                  value={
                    hike.elevation_gain_m !== null
                      ? `${Math.round(hike.elevation_gain_m)} m`
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

            {elevations.length >= 2 && (
              <div>
                <p className="text-xs text-base-content/50 mb-1">Elevation</p>
                <ElevationChart elevations={elevations} />
              </div>
            )}

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="card-actions justify-end pt-1">
              <a
                href={`/hike/${hike.id}/map`}
                className="btn btn-primary btn-sm"
              >
                View on Map
              </a>
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
