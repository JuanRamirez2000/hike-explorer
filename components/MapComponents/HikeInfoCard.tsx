"use client";

import { useState, useEffect } from "react";
import { fmtDistance, fmtDuration, fmtElevation, fmtAvgPace, type UnitSystem } from "@/lib/format";
import { Download, Play, Expand, Mountain } from "lucide-react";
import type { Hike, TrackPointSummary, FogStatus } from "@/types/models";
import DisplayModeDropdown, { type DisplayMode } from "@/components/MapComponents/DisplayModeDropdown";
import ElevationProfileChart from "@/components/HikeComponents/ElevationProfileChart";
import PaceChart from "@/components/HikeComponents/PaceChart";

// ── helpers ────────────────────────────────────────────────────────────────

function splitFmt(s: string): [string, string] {
  if (s === "—" || s === "") return [s, ""];
  const i = s.lastIndexOf(" ");
  return i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
}

// ── stat cell ──────────────────────────────────────────────────────────────

function StatCell({ label, value, unitSuffix = "" }: { label: string; value: string; unitSuffix?: string }) {
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
            {unitSuffix && <span className="text-sm font-normal text-base-content/60 ml-1">{unitSuffix}</span>}
          </>
        )}
      </p>
    </div>
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
  fogStatus?: FogStatus | null;
  fogAreaKm2?: number | null;
}) {
  const [chartMode, setChartMode] = useState<"elevation" | "pace" | "grade">("elevation");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");

  useEffect(() => {
    if (window.innerWidth < 1024) setDisplayMode("icon");
  }, []);
  const hasPace = trackPoints.some((p) => p.timestamp);

  const maxElev = trackPoints.length > 0 ? Math.max(...trackPoints.map((p) => p.elevation)) : null;

  const [paceVal, paceSuffix] = splitFmt(fmtAvgPace(hike.duration_seconds, hike.distance_km, unit));
  const [distVal, distUnit]   = splitFmt(hike.distance_km !== null ? fmtDistance(hike.distance_km, unit) : "—");
  const [gainVal, gainUnit]   = splitFmt(hike.elevation_gain_m !== null ? fmtElevation(hike.elevation_gain_m, unit) : "—");
  const [maxElevVal, maxElevUnit] = splitFmt(maxElev !== null ? fmtElevation(maxElev, unit) : "—");

  const startTimeLabel = hike.start_time
    ? new Date(hike.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  // ── icon mode ─────────────────────────────────────────────────────────────

  if (displayMode === "icon") {
    return (
      <div className="absolute top-[100px] left-4 z-10">
        <button
          className="w-11 h-11 rounded-2xl bg-base-100 border border-base-content/15 shadow-xl flex items-center justify-center text-base-content/70 hover:text-base-content transition-colors"
          title={hike.name}
          onClick={() => setDisplayMode("full")}
        >
          <Mountain size={18} strokeWidth={1.6} />
        </button>
      </div>
    );
  }

  // ── compact mode ──────────────────────────────────────────────────────────

  if (displayMode === "compact") {
    return (
      <div className="absolute top-[100px] left-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-2xl w-[340px] max-w-[calc(100vw-2rem)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center shrink-0 text-base-content/60 hover:text-base-content transition-colors"
            onClick={() => setDisplayMode("full")}
            title="Expand"
          >
            <Expand size={16} strokeWidth={1.6} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight truncate">{hike.name}</p>
            <p className="text-[11px] text-base-content/55 leading-tight mt-0.5">
              {hike.date ?? "No date"} · {startTimeLabel}
            </p>
          </div>
          <DisplayModeDropdown current={displayMode} onChange={setDisplayMode} />
        </div>
      </div>
    );
  }

  // ── full mode ─────────────────────────────────────────────────────────────

  return (
    <div
      className="absolute top-[100px] left-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-3xl w-[340px] max-w-[calc(100vw-2rem)] flex flex-col"
      style={{ maxHeight: "calc(100vh - 116px)" }}
    >
      <div className="overflow-y-auto flex-1">

        {/* ── 1. Header ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight truncate">{hike.name}</h2>
            <p className="text-xs text-base-content/55 mt-0.5">
              {hike.date ?? "No date"} · {startTimeLabel}
            </p>
          </div>
          <div className="shrink-0">
            <DisplayModeDropdown current={displayMode} onChange={setDisplayMode} />
          </div>
        </div>

        {/* ── 2. Fog status pill ─────────────────────────────────────────── */}
        {fogStatus !== null && (
          <div className="px-5 pb-3">
            <div
              className={`rounded-full px-4 py-2.5 flex items-center gap-2.5 text-sm ${
                fogStatus === "complete"
                  ? "bg-success-soft text-success-dark"
                  : fogStatus === "error"
                    ? "bg-error-soft text-error-dark"
                    : "bg-info-soft text-info-dark"
              }`}
            >
              {fogStatus === "processing" ? (
                <span className="loading loading-spinner loading-xs shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              )}
              <span className="text-sm font-medium flex-1">
                {fogStatus === "pending" || fogStatus === "processing"
                  ? "Computing viewshed…"
                  : fogStatus === "complete"
                    ? "Viewshed ready"
                    : "Viewshed failed"}
              </span>
              {fogStatus === "complete" && fogAreaKm2 !== null && (
                <span className="text-xs font-medium ml-auto shrink-0">{fogAreaKm2.toFixed(1)} km²</span>
              )}
            </div>
          </div>
        )}

        {/* ── 3. Stat grid ──────────────────────────────────────────────── */}
        <div className="px-5 pb-3">
          <div className="bg-base-200 rounded-2xl p-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
            <StatCell label="Distance"  value={distVal}     unitSuffix={distUnit} />
            <StatCell label="Duration"  value={fmtDuration(hike.duration_seconds)} />
            <StatCell label="Elev. gain" value={gainVal}   unitSuffix={gainUnit} />
            {/* TODO: elevation loss not yet computed from track points */}
            <StatCell label="Elev. loss" value="—" />
            <StatCell label="Avg pace"  value={paceVal === "—" ? "—" : paceVal} unitSuffix={paceVal === "—" ? "" : paceSuffix} />
            <StatCell label="Max elev." value={maxElevVal} unitSuffix={maxElevUnit} />
            {/* TODO: grade stats require elevation delta / distance segment computation */}
            <StatCell label="Avg grade" value="—" />
            <StatCell label="Max grade" value="—" />
          </div>
        </div>

        {/* ── 4. Profile section ────────────────────────────────────────── */}
        {trackPoints.length >= 2 && (
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Profile</span>
              <div className="flex bg-base-200 rounded-full p-0.5 gap-0.5">
                {(["elevation", "pace", "grade"] as const).map((m) => (
                  <button
                    key={m}
                    className={`btn btn-xs rounded-full px-3 border-0 ${chartMode === m ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setChartMode(m)}
                    disabled={(m === "pace" && !hasPace) || m === "grade"}
                    title={
                      m === "pace" && !hasPace ? "No timestamps in GPX"
                      : m === "grade" ? "Grade chart coming soon"
                      : undefined
                    }
                  >
                    {m === "elevation" ? "Elev" : m === "pace" ? "Pace" : "Grade"}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-base-200 rounded-2xl p-4">
              {chartMode === "elevation" && <ElevationProfileChart trackPoints={trackPoints} unit={unit} height={180} />}
              {chartMode === "pace" && hasPace && <PaceChart trackPoints={trackPoints} unit={unit} height={180} />}
              {chartMode === "grade" && (
                <div className="flex items-center justify-center" style={{ height: 180 }}>
                  <p className="text-xs text-base-content/40">Grade chart coming soon</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── 5. Action row ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-base-content/10 flex gap-2 shrink-0">
        <button className="btn bg-base-200 border-0 rounded-full flex-1 gap-2" disabled>
          <Download size={16} strokeWidth={1.6} />
          Export
        </button>
        <button className="btn btn-primary rounded-full flex-1 gap-2" disabled>
          <Play size={16} strokeWidth={1.6} />
          Replay
        </button>
      </div>
    </div>
  );
}
