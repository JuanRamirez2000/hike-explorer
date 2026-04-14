"use client";

import { buildHikePayload, getGPXMetadata } from "@/lib/gpx-parser";
import { saveHike } from "@/lib/hike-actions";
import type { GPXMetadataSummary } from "@/types/hike-upload";
import { createClient } from "@/utills/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDistance(km: number): string {
  return `${km.toFixed(2)} km`;
}

function fmtElevation(m: number): string {
  return `${Math.round(m)} m`;
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TestPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<GPXMetadataSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // editable fields — seeded from parsed metadata
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCreator, setFormCreator] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<
    { success: true; hikeId: string } | { success: false; error: string } | null
  >(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setMetadata(null);
    setError(null);
    setSubmitResult(null);
    setFile(null);

    if (!selected) return;
    if (!selected.name.endsWith(".gpx")) {
      setError("Please select a .gpx file");
      return;
    }

    setLoading(true);
    try {
      const result = await getGPXMetadata(selected);
      setMetadata(result);
      setFile(selected);
      setFormName(result.name);
      setFormDate(result.date ?? "");
      setFormCreator(result.creator);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!file) return;

    setSubmitting(true);
    setSubmitResult(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitResult({
          success: false,
          error: "You must be signed in to save a hike",
        });
        return;
      }

      const payload = await buildHikePayload(file);
      // apply user edits over the parsed defaults
      payload.name = formName.trim() || payload.name;
      payload.date = formDate || null;
      payload.stats.creator = formCreator.trim() || payload.stats.creator;

      const result = await saveHike(payload, user.id);
      setSubmitResult(result);
      if (result.success) {
        router.push("/user");
        return;
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        error: err instanceof Error ? err.message : "Failed to save hike",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body gap-6">
          <h1 className="card-title text-2xl">GPX Parser Test</h1>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">GPX File</legend>
            <input
              type="file"
              accept=".gpx"
              className="file-input file-input-bordered w-full"
              onChange={handleFile}
            />
          </fieldset>

          {loading && (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {metadata && (
            <div className="space-y-5">

              {/* ── editable fields ── */}
              <div className="space-y-3">
                <h2 className="font-semibold text-lg">Hike Details</h2>

                <label className="form-control w-full">
                  <span className="label-text text-base-content/60 text-sm mb-1">Name</span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text text-base-content/60 text-sm mb-1">Date</span>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text text-base-content/60 text-sm mb-1">Creator / Device</span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formCreator}
                    onChange={(e) => setFormCreator(e.target.value)}
                  />
                </label>
              </div>

              <div className="divider" />

              {/* ── computed stats ── */}
              <div className="space-y-3">
                <h2 className="font-semibold text-lg">Computed Stats</h2>
                <table className="table table-sm w-full">
                  <tbody>
                    <Row
                      label="Distance"
                      value={
                        metadata.distanceKm !== null
                          ? fmtDistance(metadata.distanceKm)
                          : "—"
                      }
                    />
                    <Row
                      label="Elevation gain"
                      value={
                        metadata.elevationGainM !== null
                          ? fmtElevation(metadata.elevationGainM)
                          : "—"
                      }
                    />
                    <Row
                      label="Duration"
                      value={
                        metadata.durationSeconds !== null
                          ? fmtDuration(metadata.durationSeconds)
                          : "—"
                      }
                    />
                    <Row
                      label="Start time"
                      value={
                        metadata.startTime
                          ? new Date(metadata.startTime).toLocaleString()
                          : "—"
                      }
                    />
                    <Row
                      label="End time"
                      value={
                        metadata.endTime
                          ? new Date(metadata.endTime).toLocaleString()
                          : "—"
                      }
                    />
                    <Row label="Track points" value={metadata.totalPoints.toLocaleString()} />
                    <Row label="Tracks" value={String(metadata.trackCount)} />
                  </tbody>
                </table>
              </div>

              {/* ── submit ── */}
              {submitResult ? (
                submitResult.success ? (
                  <div role="alert" className="alert alert-success">
                    <span>Hike saved! ID: {submitResult.hikeId}</span>
                  </div>
                ) : (
                  <div role="alert" className="alert alert-error">
                    <span>{submitResult.error}</span>
                  </div>
                )
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  {submitting ? "Saving…" : "Submit Hike"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="text-base-content/60 w-40">{label}</td>
      <td className="font-mono">{value}</td>
    </tr>
  );
}
