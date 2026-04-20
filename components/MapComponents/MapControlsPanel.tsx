"use client";

import { useState } from "react";
import type { ViewshedStatus } from "@/types/viewshed";
import type { ViewshedProgress } from "@/lib/viewshed";

// ── types ──────────────────────────────────────────────────────────────────

export type MapStyle = "outdoors" | "satellite" | "hybrid";
export type ColorMode = "default" | "elevation" | "pace";
export type UnitSystem = "metric" | "imperial";

export interface MapControlsPanelProps {
  mapStyle: MapStyle;
  onMapStyleChange: (s: MapStyle) => void;

  unit: UnitSystem;
  onUnitChange: (u: UnitSystem) => void;

  onFitBounds: () => void;
  centerLat?: number | null;
  centerLng?: number | null;

  colorMode: ColorMode;
  onColorModeChange: (m: ColorMode) => void;
  hasPace: boolean;

  terrainEnabled: boolean;
  onTerrainEnabledChange: (v: boolean) => void;
  terrainExp: number;
  onTerrainExpChange: (v: number) => void;

  viewshedStatus: ViewshedStatus;
  viewshedProgress: ViewshedProgress | null;
  onTriggerViewshed: () => void;

  fogVisible: boolean;
  onFogVisibleChange: (v: boolean) => void;
  fogOpacity: number;
  onFogOpacityChange: (v: number) => void;
  fogAreaKm2: number | null;
  fogObserverCount: number | null;
  fogComputedAt: Date | null;
}

// ── helpers ────────────────────────────────────────────────────────────────

function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} days ago`;
}

// ── sub-components ─────────────────────────────────────────────────────────

function Medallion({
  children,
  className = "bg-base-100 border border-base-300",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}

function MedallionRow({
  icon,
  medallionClass,
  title,
  subtitle,
  trailing,
  surface = true,
}: {
  icon: React.ReactNode;
  medallionClass?: string;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  surface?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 flex items-center gap-3 ${
        surface ? "bg-base-200" : "border border-base-300"
      }`}
    >
      <Medallion className={medallionClass}>{icon}</Medallion>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight">{title}</p>
        <p className="text-[11px] text-base-content/60 leading-tight mt-0.5">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

// Shared thumbnail used for basemap + track color sections
function StyleThumbnail({
  active,
  label,
  onClick,
  disabled = false,
  title,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`aspect-square rounded-2xl relative overflow-hidden ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } border-2 ${active ? "border-primary" : "border-base-300"}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <div className="w-full h-full">{children}</div>
      <span
        className={`absolute bottom-0 inset-x-0 text-center text-[10px] font-medium bg-base-100/90 py-0.5 ${
          active ? "text-primary" : ""
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// ── icons ──────────────────────────────────────────────────────────────────

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18L9 6l5 8 3-4 5 8H3z" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
      <polyline points="2 15.5 12 22 22 15.5" />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconCorners() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconEllipsis() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMountain() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 20 9 8 13 14 16 11 21 20 3 20" />
    </svg>
  );
}

function IconTriangle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 4 2 20 22 20" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── basemap SVG thumbnails ─────────────────────────────────────────────────

function BasemapOutdoor() {
  return (
    <svg viewBox="0 0 40 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
      <rect width="40" height="40" fill="#dcfce7" />
      <path d="M0 26 Q10 16 20 21 Q30 26 40 18" stroke="#166534" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M0 18 Q12 12 20 15 Q30 17 40 12" stroke="#166534" strokeWidth="1.5" fill="none" opacity="0.2" />
      <path d="M3 34 Q14 26 24 30 Q34 26 40 23" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BasemapSatellite() {
  return (
    <svg viewBox="0 0 40 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
      <rect width="40" height="40" fill="#14532d" />
      <ellipse cx="11" cy="13" rx="7" ry="5.5" fill="#166534" opacity="0.85" />
      <ellipse cx="28" cy="9" rx="5.5" ry="4.5" fill="#15803d" opacity="0.75" />
      <ellipse cx="23" cy="27" rx="8" ry="6.5" fill="#166534" opacity="0.85" />
      <ellipse cx="7" cy="28" rx="4" ry="3.5" fill="#15803d" opacity="0.7" />
    </svg>
  );
}

function BasemapHybrid() {
  return (
    <svg viewBox="0 0 40 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
      <rect width="40" height="40" fill="#14532d" />
      <ellipse cx="11" cy="12" rx="6" ry="5" fill="#166534" opacity="0.65" />
      <ellipse cx="28" cy="27" rx="8" ry="6" fill="#166534" opacity="0.65" />
      <line x1="20" y1="0" x2="20" y2="40" stroke="white" strokeWidth="2.5" opacity="0.8" />
      <line x1="0" y1="22" x2="40" y2="22" stroke="white" strokeWidth="2.5" opacity="0.8" />
    </svg>
  );
}

// ── track color SVG thumbnails ─────────────────────────────────────────────

function TrackDefault() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <rect width="40" height="40" fill="transparent" />
      <path d="M5 32 Q14 18 22 22 Q32 26 37 10" stroke="#f97316" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function TrackElevation() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="elev-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="transparent" />
      <path d="M5 32 Q14 18 22 22 Q32 26 37 10" stroke="url(#elev-grad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function TrackPace() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="pace-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="transparent" />
      <path d="M5 32 Q14 18 22 22 Q32 26 37 10" stroke="url(#pace-grad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ── fog status banner ──────────────────────────────────────────────────────

function FogStatusBanner({
  viewshedStatus,
  viewshedProgress,
  fogAreaKm2,
  fogObserverCount,
}: {
  viewshedStatus: ViewshedStatus;
  viewshedProgress: ViewshedProgress | null;
  fogAreaKm2: number | null;
  fogObserverCount: number | null;
}) {
  if (viewshedStatus === "done") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-success/15">
        <Medallion className="bg-success/25">
          <span className="text-success"><IconCheck /></span>
        </Medallion>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-success leading-tight">Viewshed ready</p>
          <p className="text-[11px] text-success/70 leading-tight mt-0.5">
            {fogAreaKm2 !== null ? `${fogAreaKm2.toFixed(1)} km² visible` : "—"} ·{" "}
            {fogObserverCount ?? "—"} observers
          </p>
        </div>
      </div>
    );
  }

  if (viewshedStatus === "computing") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-info/15">
        <Medallion className="bg-info/25">
          <span className="loading loading-spinner loading-sm text-info" />
        </Medallion>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-info leading-tight">Computing viewshed…</p>
          <p className="text-[11px] text-info/70 leading-tight mt-0.5">
            {viewshedProgress
              ? `${viewshedProgress.processed}/${viewshedProgress.total} observers`
              : "Starting…"}
          </p>
        </div>
      </div>
    );
  }

  if (viewshedStatus === "error") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-error/15">
        <Medallion className="bg-error/25">
          <span className="text-error"><IconAlert /></span>
        </Medallion>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-error leading-tight">Viewshed failed</p>
          <p className="text-[11px] text-error/70 leading-tight mt-0.5">Tap recompute to retry</p>
        </div>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-base-200">
      <Medallion className="bg-base-100 border border-base-300">
        <span className="text-base-content/40"><IconEllipsis /></span>
      </Medallion>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight">No viewshed yet</p>
        <p className="text-[11px] text-base-content/60 leading-tight mt-0.5">Tap recompute to generate</p>
      </div>
    </div>
  );
}

// ── component ──────────────────────────────────────────────────────────────

export default function MapControlsPanel({
  mapStyle,
  onMapStyleChange,
  unit,
  onUnitChange,
  onFitBounds,
  centerLat,
  centerLng,
  colorMode,
  onColorModeChange,
  hasPace,
  terrainEnabled,
  onTerrainEnabledChange,
  terrainExp,
  onTerrainExpChange,
  viewshedStatus,
  viewshedProgress,
  onTriggerViewshed,
  fogVisible,
  onFogVisibleChange,
  fogOpacity,
  onFogOpacityChange,
  fogAreaKm2,
  fogObserverCount,
  fogComputedAt,
}: MapControlsPanelProps) {
  const [activeTab, setActiveTab] = useState<"map" | "fog" | "view">("fog");
  const [viewRadius, setViewRadius] = useState(2000);

  const tabs = [
    { id: "map" as const, label: "Map", icon: <IconMap /> },
    { id: "fog" as const, label: "Fog", icon: <IconEye /> },
    { id: "view" as const, label: "View", icon: <IconLayers /> },
  ];

  return (
    <div className="absolute top-4 right-4 z-10 bg-base-100 border border-base-300 shadow-lg rounded-3xl w-[320px] overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <p className="text-[15px] font-medium">Controls</p>
        {/* TODO: Collapse / expand panel — chevron button should animate the panel
            closed to a small bar. Deferred: needs an isOpen state + Tailwind transition. */}
        <button className="btn btn-ghost btn-circle btn-sm" disabled title="Collapse">
          <IconChevronDown />
        </button>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div className="px-3 pb-4">
        <div className="bg-base-200 rounded-full p-1 grid grid-cols-3 gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2.5 px-1 rounded-full flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-content"
                  : "bg-transparent text-base-content/70 hover:text-base-content"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-1">

        {/* ── Tab 1: Map ──────────────────────────────────────────────────── */}
        {activeTab === "map" && (
          <div className="space-y-3 min-h-[440px]">
            {/* Basemap thumbnails */}
            {/* TODO: Thumbnail basemap previews use hand-drawn SVGs. Swap to Mapbox Static
                Image API previews when implementing a cleaner visual. Deferred: requires
                Static Images API integration and per-style image URLs. */}
            <div>
              <p className="text-[11px] tracking-widest text-base-content/50 font-medium uppercase mb-2">
                Basemap
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <StyleThumbnail
                  active={mapStyle === "outdoors"}
                  label="Outdoors"
                  onClick={() => onMapStyleChange("outdoors")}
                >
                  <BasemapOutdoor />
                </StyleThumbnail>
                <StyleThumbnail
                  active={mapStyle === "satellite"}
                  label="Satellite"
                  onClick={() => onMapStyleChange("satellite")}
                >
                  <BasemapSatellite />
                </StyleThumbnail>
                <StyleThumbnail
                  active={mapStyle === "hybrid"}
                  label="Hybrid"
                  onClick={() => onMapStyleChange("hybrid")}
                >
                  <BasemapHybrid />
                </StyleThumbnail>
              </div>
            </div>

            {/* Units row */}
            <MedallionRow
              icon={<IconRuler />}
              title="Units"
              subtitle="Distance & elevation"
              trailing={
                <div className="join rounded-full bg-base-100 border border-base-300 p-0.5 shrink-0">
                  {(["metric", "imperial"] as const).map((u) => (
                    <button
                      key={u}
                      className={`btn btn-xs rounded-full border-0 ${
                        unit === u ? "btn-primary" : "btn-ghost"
                      }`}
                      onClick={() => onUnitChange(u)}
                    >
                      {u === "metric" ? "km" : "mi"}
                    </button>
                  ))}
                </div>
              }
            />

            {/* Fit to route row */}
            <MedallionRow
              icon={<IconCorners />}
              title="Fit to route"
              subtitle="Recenter on the full track"
              trailing={
                <button
                  className="btn btn-sm btn-circle bg-base-100 border border-base-300 shrink-0"
                  onClick={onFitBounds}
                  title="Fit route"
                >
                  <IconCorners />
                </button>
              }
            />

            {/* Center coordinates */}
            {centerLat != null && centerLng != null && (
              <div className="rounded-2xl border border-base-300 px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-base-content/50">
                  <IconPin />
                  <span className="text-[11px] font-medium uppercase tracking-wide">Center</span>
                </div>
                <span className="text-xs tabular-nums text-base-content/70 shrink-0">
                  {centerLat.toFixed(2)}°N,{" "}
                  {Math.abs(centerLng).toFixed(2)}°{centerLng < 0 ? "W" : "E"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Fog ──────────────────────────────────────────────────── */}
        {activeTab === "fog" && (
          <div className="space-y-3 min-h-[440px]">
            {/* Status banner */}
            <FogStatusBanner
              viewshedStatus={viewshedStatus}
              viewshedProgress={viewshedProgress}
              fogAreaKm2={fogAreaKm2}
              fogObserverCount={fogObserverCount}
            />

            {/* Show overlay toggle */}
            <MedallionRow
              icon={<IconEye />}
              title="Show overlay"
              subtitle="Toggle fog on the map"
              trailing={
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm shrink-0"
                  checked={fogVisible}
                  onChange={(e) => onFogVisibleChange(e.target.checked)}
                  disabled={viewshedStatus !== "done"}
                />
              }
            />

            {/* Opacity row */}
            <div className="bg-base-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Medallion className="bg-base-100 border border-base-300">
                  <IconSun />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight">Opacity</p>
                  <p className="text-[11px] text-base-content/60 leading-tight mt-0.5">Fog layer transparency</p>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {Math.round(fogOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(fogOpacity * 100)}
                onChange={(e) => onFogOpacityChange(Number(e.target.value) / 100)}
                className="range range-primary range-xs w-full"
                disabled={viewshedStatus !== "done"}
              />
            </div>

            {/* View radius row */}
            {/* TODO: Viewshed radius slider is UI-only. Changing it does not yet re-trigger
                computation. Deferred: needs lifting radiusM into HikeMapView state and
                passing it through the viewshed pipeline (VIEWSHED_DEFAULTS.radiusM). */}
            <div className="bg-base-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Medallion className="bg-base-100 border border-base-300">
                  <IconSun />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight">View radius</p>
                  <p className="text-[11px] text-base-content/60 leading-tight mt-0.5">Ray-cast distance</p>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {(viewRadius / 1000).toFixed(1)} km
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={viewRadius}
                onChange={(e) => setViewRadius(Number(e.target.value))}
                className="range range-primary range-xs w-full"
              />
            </div>

            {/* Last computed */}
            {/* TODO: Last-computed timestamp relies on fogComputedAt being derivable from
                the hike row. Deferred: `hikes` has no fog_computed_at column yet — either
                add one or derive from a job log. Showing "—" until wired. */}
            <div className="rounded-2xl border border-base-300 px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-base-content/50">
                <IconClock />
                <span className="text-[11px] font-medium uppercase tracking-wide">Last computed</span>
              </div>
              <span className="text-xs text-base-content/70 shrink-0">
                {relativeTime(fogComputedAt)}
              </span>
            </div>

            {/* Recompute button */}
            <button
              className="btn btn-primary btn-block rounded-full gap-2"
              onClick={onTriggerViewshed}
              disabled={viewshedStatus === "computing"}
            >
              {viewshedStatus === "computing" ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <IconRefresh />
              )}
              {viewshedStatus === "computing"
                ? "Computing…"
                : viewshedStatus === "done"
                  ? "Recompute viewshed"
                  : "Compute viewshed"}
            </button>

            {/* TODO: Observer count (fogObserverCount) comes from the ViewshedProgress
                object during computation, but is lost once fog is stored. Deferred: persist
                observer count alongside fog_geojson, or derive from RDP-decimated point count. */}
          </div>
        )}

        {/* ── Tab 3: View ─────────────────────────────────────────────────── */}
        {activeTab === "view" && (
          <div className="space-y-3 min-h-[440px]">
            {/* Track color thumbnails */}
            <div>
              <p className="text-[11px] tracking-widest text-base-content/50 font-medium uppercase mb-2">
                Track color
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <StyleThumbnail
                  active={colorMode === "default"}
                  label="Default"
                  onClick={() => onColorModeChange("default")}
                >
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <TrackDefault />
                  </div>
                </StyleThumbnail>
                <StyleThumbnail
                  active={colorMode === "elevation"}
                  label="Elevation"
                  onClick={() => onColorModeChange("elevation")}
                >
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <TrackElevation />
                  </div>
                </StyleThumbnail>
                <StyleThumbnail
                  active={colorMode === "pace"}
                  label="Pace"
                  onClick={() => onColorModeChange("pace")}
                  disabled={!hasPace}
                  title={!hasPace ? "No timestamps in GPX" : undefined}
                >
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <TrackPace />
                  </div>
                </StyleThumbnail>
              </div>
            </div>

            {/* 3D terrain toggle */}
            <MedallionRow
              icon={<IconMountain />}
              title="3D terrain"
              subtitle="Render elevation mesh"
              trailing={
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm shrink-0"
                  checked={terrainEnabled}
                  onChange={(e) => onTerrainEnabledChange(e.target.checked)}
                />
              }
            />

            {/* Exaggeration row */}
            <div className="bg-base-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Medallion className="bg-base-100 border border-base-300">
                  <IconTriangle />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight">Exaggeration</p>
                  <p className="text-[11px] text-base-content/60 leading-tight mt-0.5">Vertical terrain scale</p>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {terrainExp.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={terrainExp}
                onChange={(e) => onTerrainExpChange(Number(e.target.value))}
                className="range range-primary range-xs w-full"
                disabled={!terrainEnabled}
              />
            </div>

            {/* Flyover teaser */}
            {/* TODO: Flyover mode — Stage 3 / 3D flyover is deferred pending aesthetic
                direction. The button is intentionally disabled. Tracked in PROJECT_CONTEXT.md
                Stage 3. */}
            <div className="bg-primary/10 rounded-2xl p-4 flex items-center gap-3">
              <Medallion className="bg-primary/25">
                <span className="text-primary"><IconPlay /></span>
              </Medallion>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-primary leading-tight">Flyover mode</p>
                <p className="text-[11px] text-primary/60 leading-tight mt-0.5">Coming soon · 3D camera path</p>
              </div>
              <button
                className="btn btn-xs rounded-full border border-primary/50 text-primary opacity-70 cursor-not-allowed shrink-0"
                disabled
              >
                Soon
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
