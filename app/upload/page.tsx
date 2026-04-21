"use client";

import { buildHikePayload, getGPXMetadata } from "@/lib/gpx-parser";
import { saveHike } from "@/lib/hike-actions";
import { fmtDuration, fmtDistance, fmtElevation, type UnitSystem } from "@/lib/format";
import type { GPXMetadataSummary, ParsedHikePayload } from "@/types/hike-upload";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StatRow from "@/components/StatRow";
import HikeFieldsForm from "@/components/HikeComponents/HikeFieldsForm";

// ── page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<GPXMetadataSummary | null>(null);
  const [payload, setPayload] = useState<ParsedHikePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // editable fields — seeded from parsed metadata
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCreator, setFormCreator] = useState("");

  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ error: string } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setMetadata(null);
    setPayload(null);
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
      const [meta, parsed] = await Promise.all([
        getGPXMetadata(selected),
        buildHikePayload(selected),
      ]);
      setMetadata(meta);
      setPayload(parsed);
      setFile(selected);
      setFormName(meta.name);
      setFormDate(meta.date ?? "");
      setFormCreator(meta.creator);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!file || !payload) return;

    setSubmitting(true);
    setSubmitResult(null);
    try {
      // apply user edits over the parsed defaults
      payload.name = formName.trim() || payload.name;
      payload.date = formDate || null;
      payload.stats.creator = formCreator.trim() || payload.stats.creator;

      const result = await saveHike(payload, file);
      if (result.success) {
        router.push("/user");
        return;
      }
      setSubmitResult({ error: result.error ?? "Failed to save hike" });
    } catch (err) {
      setSubmitResult({
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
          <h1 className="card-title text-2xl">Upload Hike</h1>

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
                <HikeFieldsForm
                  name={formName}
                  date={formDate}
                  creator={formCreator}
                  onNameChange={setFormName}
                  onDateChange={setFormDate}
                  onCreatorChange={setFormCreator}
                />
              </div>

              <div className="divider" />

              {/* ── computed stats ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Computed Stats</h2>
                  <div className="join">
                    <button
                      className={`join-item btn btn-xs ${unit === "metric" ? "btn-neutral" : "btn-ghost"}`}
                      onClick={() => setUnit("metric")}
                    >
                      km / m
                    </button>
                    <button
                      className={`join-item btn btn-xs ${unit === "imperial" ? "btn-neutral" : "btn-ghost"}`}
                      onClick={() => setUnit("imperial")}
                    >
                      mi / ft
                    </button>
                  </div>
                </div>
                <table className="table table-sm w-full">
                  <tbody>
                    <StatRow wide
                      label="Distance"
                      value={
                        metadata.distanceKm !== null
                          ? fmtDistance(metadata.distanceKm, unit)
                          : "—"
                      }
                    />
                    <StatRow wide
                      label="Elevation gain"
                      value={
                        metadata.elevationGainM !== null
                          ? fmtElevation(metadata.elevationGainM, unit)
                          : "—"
                      }
                    />
                    <StatRow wide
                      label="Duration"
                      value={
                        metadata.durationSeconds !== null
                          ? fmtDuration(metadata.durationSeconds)
                          : "—"
                      }
                    />
                    <StatRow wide
                      label="Start time"
                      value={
                        metadata.startTime
                          ? new Date(metadata.startTime).toLocaleString()
                          : "—"
                      }
                    />
                    <StatRow wide
                      label="End time"
                      value={
                        metadata.endTime
                          ? new Date(metadata.endTime).toLocaleString()
                          : "—"
                      }
                    />
                    <StatRow wide label="Track points" value={metadata.totalPoints.toLocaleString()} />
                    <StatRow wide label="Tracks" value={String(metadata.trackCount)} />
                  </tbody>
                </table>
              </div>

              {/* ── submit ── */}
              {submitResult ? (
                <div role="alert" className="alert alert-error">
                  <span>{submitResult.error}</span>
                </div>
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

