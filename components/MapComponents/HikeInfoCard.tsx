"use client";

import { useState } from "react";
import { fmtDistance, fmtDuration, fmtElevation, MI_TO_KM, type UnitSystem } from "@/lib/format";
import type { Hike, TrackPointSummary } from "@/types/models";
import ElevationProfileChart from "@/components/HikeComponents/ElevationProfileChart";
import PaceChart from "@/components/HikeComponents/PaceChart";

// ── helpers ────────────────────────────────────────────────────────────────

function splitFmt(s: string): [string, string] {
  if (s === "—" || s === "") return [s, ""];
  const i = s.lastIndexOf(" ");
  return i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
}

function fmtAvgPace(
  durationSeconds: number | null,
  distanceKm: number | null,
  unit: UnitSystem,
): string {
  if (durationSeconds === null || distanceKm === null || distanceKm === 0) return "—";
  const minPerKm = durationSeconds / 60 / distanceKm;
  const pace = unit === "imperial" ? minPerKm * MI_TO_KM : minPerKm;
  const totalSec = Math.round(pace * 60);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")} /${unit === "imperial" ? "mi" : "km"}`;
}

// ── stat cell ──────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  unitSuffix = "",
}: {
  label: string;
  value: string;
  unitSuffix?: string;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wider text-base-content/60 font-medium uppercase mb-1 leading-none">
        {label}
      </p>
      <p className="text-xl font-medium leading-none">
        {value === "—" ? (
          <span className="text-base-content/40">—</span>
        ) : (
          <>
            {value}
            {unitSuffix && (
              <span className="text-sm font-normal text-base-content/60 ml-1">
                {unitSuffix}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}

// ── icons ──────────────────────────────────────────────────────────────────

function IconMinimize() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ── component ──────────────────────────────────────────────────────────────

export default function HikeInfoCard({
  hike,
  trackPoints = [],
  unit = "metric",
  fogStatus = null,
  fogAreaKm2 = null,
}: {
  hike: Hike;
  trackPoints?: TrackPointSummary[];
  unit?: UnitSystem;
  fogStatus?: "pending" | "processing" | "complete" | "error" | null;
  fogAreaKm2?: number | null;
}) {
  const [chartMode, setChartMode] = useState<"elevation" | "pace" | "grade">("elevation");
  const hasPace = trackPoints.some((p) => p.timestamp);

  const maxElev =
    trackPoints.length > 0
      ? Math.max(...trackPoints.map((p) => p.elevation))
      : null;

  // Avg pace mm:ss
  const [paceVal, paceSuffix] = splitFmt(
    fmtAvgPace(hike.duration_seconds, hike.distance_km, unit),
  );

  // Distance and elevation splits
  const [distVal, distUnit] = splitFmt(
    hike.distance_km !== null ? fmtDistance(hike.distance_km, unit) : "—",
  );
  const [gainVal, gainUnit] = splitFmt(
    hike.elevation_gain_m !== null ? fmtElevation(hike.elevation_gain_m, unit) : "—",
  );
  const [maxElevVal, maxElevUnit] = splitFmt(
    maxElev !== null ? fmtElevation(maxElev, unit) : "—",
  );

  const startTimeLabel = hike.start_time
    ? new Date(hike.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div
      className="absolute top-4 left-4 z-10 bg-base-100 border border-base-300 shadow-lg rounded-3xl w-[340px] flex flex-col"
      style={{ maxHeight: "calc(100vh - 6rem)" }}
    >
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1">

        {/* ── 1. Header row ────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-medium leading-tight truncate">{hike.name}</h2>
            <p className="text-xs text-base-content/60 mt-0.5">
              {hike.date ?? "No date"} · {startTimeLabel}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {/* TODO: Minimize / close — collapse card to a title bar or hide.
                Deferred: needs controlled open/closed state lifted to HikeMapView. */}
            <button className="btn btn-ghost btn-circle btn-sm" title="Minimize" disabled>
              <IconMinimize />
            </button>
            <button className="btn btn-ghost btn-circle btn-sm" title="Close" disabled>
              <IconClose />
            </button>
          </div>
        </div>

        {/* ── 2. Fog status pill ───────────────────────────────────────── */}
        {fogStatus !== null && (
          <div className="px-5 pb-3">
            <div
              className={`rounded-full px-4 py-2.5 flex items-center gap-2.5 text-sm ${
                fogStatus === "complete"
                  ? "bg-success/15 text-success"
                  : fogStatus === "error"
                    ? "bg-error/15 text-error"
                    : "bg-info/15 text-info"
              }`}
            >
              {fogStatus === "complete" ? (
                <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              ) : fogStatus === "error" ? (
                <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              ) : (
                <span className="loading loading-spinner loading-xs shrink-0" />
              )}
              <span className="text-sm font-medium flex-1">
                {fogStatus === "pending" || fogStatus === "processing"
                  ? "Computing viewshed…"
                  : fogStatus === "complete"
                    ? "Viewshed ready"
                    : "Viewshed failed"}
              </span>
              {fogStatus === "complete" && fogAreaKm2 !== null && (
                <span className="text-xs font-medium ml-auto shrink-0">
                  {fogAreaKm2.toFixed(1)} km²
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── 3. Stat grid ─────────────────────────────────────────────── */}
        <div className="px-5 pb-3">
          <div className="bg-base-200 rounded-2xl p-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
            <StatCell label="Distance" value={distVal} unitSuffix={distUnit} />
            <StatCell label="Duration" value={fmtDuration(hike.duration_seconds)} />
            <StatCell label="Elev. gain" value={gainVal} unitSuffix={gainUnit} />
            {/* TODO: Elevation loss — Hike model has no elevation_loss_m field.
                Deferred: either add a column and populate on upload, or compute
                client-side from trackPoints. Showing "—" for now. */}
            <StatCell label="Elev. loss" value="—" />
            <StatCell
              label="Avg pace"
              value={paceVal === "—" ? "—" : paceVal}
              unitSuffix={paceVal === "—" ? "" : paceSuffix}
            />
            <StatCell label="Max elev." value={maxElevVal} unitSuffix={maxElevUnit} />
            {/* TODO: Grade stats (avg / max) — requires computing per-segment rise/run
                from trackPoints. Deferred: not yet implemented; display "—". */}
            <StatCell label="Avg grade" value="—" />
            <StatCell label="Max grade" value="—" />
          </div>
        </div>

        {/* ── 4. Profile section ───────────────────────────────────────── */}
        {trackPoints.length >= 2 && (
          <div className="px-5 pb-5">
            {/* Chart mode selector */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Profile</span>
              <div className="flex bg-base-200 rounded-full p-0.5 gap-0.5">
                {(["elevation", "pace", "grade"] as const).map((m) => (
                  <button
                    key={m}
                    className={`btn btn-xs rounded-full px-3 border-0 ${
                      chartMode === m ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => setChartMode(m)}
                    disabled={
                      (m === "pace" && !hasPace) ||
                      m === "grade"
                      /* TODO: Grade chart mode — segment-grade BarChart is not yet
                          implemented. Deferred: Grade button is disabled. */
                    }
                    title={
                      m === "pace" && !hasPace
                        ? "No timestamps in GPX"
                        : m === "grade"
                          ? "Grade chart coming soon"
                          : undefined
                    }
                  >
                    {m === "elevation" ? "Elev" : m === "pace" ? "Pace" : "Grade"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart surface */}
            <div className="bg-base-200 rounded-2xl p-4">
              {/* TODO: Chart ↔ map scrubber sync — hovering the chart highlights the
                  corresponding GPS coordinate on the deck.gl PathLayer. Tracked in
                  TODO.md under "Hover Tooltip — Chart ↔ Map Sync". Deferred: needs
                  shared hoverIndex state. */}
              {chartMode === "elevation" && (
                <ElevationProfileChart
                  trackPoints={trackPoints}
                  unit={unit}
                  height={180}
                />
              )}
              {chartMode === "pace" && hasPace && (
                <PaceChart trackPoints={trackPoints} unit={unit} height={180} />
              )}
              {chartMode === "grade" && (
                <div
                  className="flex items-center justify-center"
                  style={{ height: 180 }}
                >
                  <p className="text-xs text-base-content/40">Grade chart coming soon</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── 5. Action row ────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-base-300 flex gap-2 shrink-0">
        <button
          className="btn bg-base-200 border-0 rounded-full flex-1 gap-2"
          disabled
        >
          {/* TODO: Export button — download track points as CSV or GeoJSON.
              Tracked in TODO.md under "CSV / JSON Export per Hike". */}
          <IconDownload />
          Export
        </button>
        <button
          className="btn btn-primary rounded-full flex-1 gap-2"
          disabled
        >
          {/* TODO: Replay button — animate a marker along the route.
              Deferred: needs a playback state machine in HikeMapView. */}
          <IconPlay />
          Replay
        </button>
      </div>
    </div>
  );
}
