"use client";

import { getGPXMetadata } from "@/lib/gpx-parser";
import type { GPXMetadataSummary } from "@/types/hike-upload";
import { useState } from "react";

export default function TestPage() {
  const [metadata, setMetadata] = useState<GPXMetadataSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setMetadata(null);
    setError(null);

    if (!file) return;
    if (!file.name.endsWith(".gpx")) {
      setError("Please select a .gpx file");
      return;
    }

    setLoading(true);
    try {
      const result = await getGPXMetadata(file);
      setMetadata(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
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
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Parsed Metadata</h2>
              <table className="table table-sm w-full">
                <tbody>
                  <Row label="Name" value={metadata.name} />
                  <Row label="Date" value={metadata.date ?? "—"} />
                  <Row label="Creator" value={metadata.creator} />
                  <Row label="Tracks" value={String(metadata.trackCount)} />
                  <Row
                    label="Total Points"
                    value={metadata.totalPoints.toLocaleString()}
                  />
                  {/* <Row
                    label="Bounding Box"
                    value={
                      metadata.bbox
                        ? `[${metadata.bbox.map((n) => n.toFixed(5)).join(", ")}]`
                        : "—"
                    }
                  /> */}
                </tbody>
              </table>
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
      <td className="text-base-content/60 w-32">{label}</td>
      <td className="font-mono">{value}</td>
    </tr>
  );
}
