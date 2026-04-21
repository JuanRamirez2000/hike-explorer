"use client";

import { useRef, useState } from "react";
import type { ViewshedStatus, ViewshedProgress } from "@/types/viewshed";
import type { MapStyle } from "@/types/map";
import type { UnitSystem } from "@/lib/format";
import {
  IconMap, IconEye, IconLayers, IconRuler,
  IconCheck, IconAlert, IconEllipsis, IconSun,
  IconMountain, IconTriangle, IconRefresh, IconPlay,
  IconExpand, IconPanelFull, IconPanelCompact, IconPanelIcon,
} from "@/components/icons";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const PREVIEW_LOC = "-119.55,37.74,9,0"; // Yosemite — shows terrain, water, and roads across all three styles

const BASEMAP_PREVIEWS: Record<MapStyle, string> = {
  outdoors:  `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
  satellite: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
  hybrid:    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
};

export type FogRenderStyle = "grid" | "smooth";

// ── display-mode dropdown ──────────────────────────────────────────────────

type DisplayMode = "full" | "compact" | "icon";

const DISPLAY_MODES: { id: DisplayMode; label: string; icon: React.ReactNode }[] = [
  { id: "full",    label: "Full",    icon: <IconPanelFull /> },
  { id: "compact", label: "Compact", icon: <IconPanelCompact /> },
  { id: "icon",    label: "Icon",    icon: <IconPanelIcon /> },
];

function DisplayModeDropdown({
  current,
  onChange,
}: {
  current: DisplayMode;
  onChange: (m: DisplayMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn btn-ghost btn-circle btn-sm"
        title="Display mode"
        onClick={() => setOpen((o) => !o)}
      >
        {DISPLAY_MODES.find((m) => m.id === current)?.icon}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-30 bg-base-100 border border-base-content/15 rounded-2xl shadow-xl p-1 w-36 flex flex-col gap-0.5">
            {DISPLAY_MODES.map((m) => (
              <button
                key={m.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[13px] font-medium transition-colors w-full ${
                  current === m.id
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200 text-base-content"
                }`}
                onClick={() => { onChange(m.id); setOpen(false); }}
              >
                <span className="shrink-0 opacity-80">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export interface MapControlsPanelProps {
  mapStyle: MapStyle;
  onMapStyleChange: (s: MapStyle) => void;

  unit: UnitSystem;
  onUnitChange: (u: UnitSystem) => void;

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
  fogRenderStyle: FogRenderStyle;
  onFogRenderStyleChange: (s: FogRenderStyle) => void;
  fogAreaKm2: number | null;
  fogObserverCount: number | null;
}

// ── sub-components ─────────────────────────────────────────────────────────

function Medallion({
  children,
  className = "bg-base-100 border border-base-content/15",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${className}`}>
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
    <div className={`rounded-2xl p-4 flex items-center gap-3 ${surface ? "bg-base-200" : "border border-base-content/15"}`}>
      <Medallion className={medallionClass}>{icon}</Medallion>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight">{title}</p>
        <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

function StyleThumbnail({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`aspect-square rounded-2xl relative overflow-hidden cursor-pointer border-2 transition-colors ${
        active ? "border-primary shadow-sm" : "border-base-content/15 hover:border-base-content/30"
      }`}
      onClick={onClick}
    >
      <div className="w-full h-full">{children}</div>
      <span className={`absolute bottom-0 inset-x-0 text-center text-[10px] font-semibold bg-base-100/92 py-1 ${active ? "text-primary" : "text-base-content/80"}`}>
        {label}
      </span>
    </button>
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
          <p className="text-[13px] font-semibold text-success leading-tight">Viewshed ready</p>
          <p className="text-[11px] text-success/75 leading-tight mt-0.5">
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
          <p className="text-[13px] font-semibold text-info leading-tight">Computing viewshed…</p>
          <p className="text-[11px] text-info/75 leading-tight mt-0.5">
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
          <p className="text-[13px] font-semibold text-error leading-tight">Viewshed failed</p>
          <p className="text-[11px] text-error/75 leading-tight mt-0.5">Tap recompute to retry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-base-200">
      <Medallion className="bg-base-100 border border-base-content/15">
        <span className="text-base-content/50"><IconEllipsis /></span>
      </Medallion>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight">No viewshed yet</p>
        <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">Tap recompute to generate</p>
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
  fogRenderStyle,
  onFogRenderStyleChange,
  fogAreaKm2,
  fogObserverCount,
}: MapControlsPanelProps) {
  const [activeTab, setActiveTab] = useState<"map" | "fog" | "view">("fog");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");

  const tabs = [
    { id: "map" as const, label: "Map",  icon: <IconMap /> },
    { id: "fog" as const, label: "Fog",  icon: <IconEye /> },
    { id: "view" as const, label: "View", icon: <IconLayers /> },
  ];

  // ── icon mode ───────────────────────────────────────────────────────────

  if (displayMode === "icon") {
    return (
      <div className="absolute top-4 right-4 z-10">
        <button
          className="w-11 h-11 rounded-2xl bg-base-100 border border-base-content/15 shadow-xl flex items-center justify-center text-base-content/70 hover:text-base-content transition-colors"
          title="Controls"
          onClick={() => setDisplayMode("full")}
        >
          <IconLayers />
        </button>
      </div>
    );
  }

  // ── compact mode ────────────────────────────────────────────────────────

  if (displayMode === "compact") {
    return (
      <div className="absolute top-4 right-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-2xl w-[320px]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center shrink-0 text-base-content/60 hover:text-base-content transition-colors"
            onClick={() => setDisplayMode("full")}
            title="Expand"
          >
            <IconExpand />
          </button>
          <p className="flex-1 text-[13px] font-semibold">Controls</p>
          <div className="flex items-center gap-1.5 text-base-content/50 shrink-0">
            {tabs.map((t) => (
              <span key={t.id} className={t.id === activeTab ? "text-primary" : ""}>{t.icon}</span>
            ))}
          </div>
          <DisplayModeDropdown current={displayMode} onChange={setDisplayMode} />
        </div>
      </div>
    );
  }

  // ── full mode ────────────────────────────────────────────────────────────

  return (
    <div className="absolute top-4 right-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-3xl w-[320px] overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <p className="text-[15px] font-semibold">Controls</p>
        <DisplayModeDropdown current={displayMode} onChange={setDisplayMode} />
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div className="px-3 pb-4">
        <div className="bg-base-200 rounded-full p-1 grid grid-cols-3 gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2.5 px-1 rounded-full flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-content"
                  : "bg-transparent text-base-content/75 hover:text-base-content"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="text-[11px] font-semibold leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-1">

        {/* ── Tab 1: Map ──────────────────────────────────────────────────── */}
        {activeTab === "map" && (
          <div className="space-y-3 min-h-[320px]">

            {/* Basemap thumbnails */}
            <div>
              <p className="text-[11px] tracking-widest text-base-content/65 font-semibold uppercase mb-2">
                Basemap
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {(["outdoors", "satellite", "hybrid"] as const).map((style) => (
                  <StyleThumbnail
                    key={style}
                    active={mapStyle === style}
                    label={style.charAt(0).toUpperCase() + style.slice(1)}
                    onClick={() => onMapStyleChange(style)}
                  >
                    {MAPBOX_TOKEN ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={BASEMAP_PREVIEWS[style]}
                        alt={style}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-base-200 flex items-center justify-center">
                        <span className="text-base-content/30 text-[9px]">No token</span>
                      </div>
                    )}
                  </StyleThumbnail>
                ))}
              </div>
            </div>

            {/* Units row */}
            <MedallionRow
              icon={<IconRuler />}
              title="Units"
              subtitle="Distance & elevation"
              trailing={
                <div className="join rounded-full bg-base-100 border border-base-content/15 p-0.5 shrink-0">
                  {(["metric", "imperial"] as const).map((u) => (
                    <button
                      key={u}
                      className={`btn btn-xs rounded-full border-0 ${unit === u ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => onUnitChange(u)}
                    >
                      {u === "metric" ? "km" : "mi"}
                    </button>
                  ))}
                </div>
              }
            />

          </div>
        )}

        {/* ── Tab 2: Fog ──────────────────────────────────────────────────── */}
        {activeTab === "fog" && (
          <div className="space-y-3 min-h-[320px]">

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
                <Medallion className="bg-base-100 border border-base-content/15">
                  <IconSun />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">Opacity</p>
                  <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">Fog layer transparency</p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
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

            {/* Render style toggle */}
            <MedallionRow
              icon={<IconEye />}
              title="Render style"
              subtitle="Grid cells or blended heatmap"
              trailing={
                <div className="join rounded-full bg-base-100 border border-base-content/15 p-0.5 shrink-0">
                  {(["grid", "smooth"] as const).map((s) => (
                    <button
                      key={s}
                      className={`btn btn-xs rounded-full border-0 capitalize ${fogRenderStyle === s ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => onFogRenderStyleChange(s)}
                      disabled={viewshedStatus !== "done"}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />

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

          </div>
        )}

        {/* ── Tab 3: View ─────────────────────────────────────────────────── */}
        {activeTab === "view" && (
          <div className="space-y-3 min-h-[320px]">

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
                <Medallion className="bg-base-100 border border-base-content/15">
                  <IconTriangle />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">Exaggeration</p>
                  <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">Vertical terrain scale</p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
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
            <div className="bg-primary/10 rounded-2xl p-4 flex items-center gap-3">
              <Medallion className="bg-primary/25">
                <span className="text-primary"><IconPlay /></span>
              </Medallion>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-primary leading-tight">Flyover mode</p>
                <p className="text-[11px] text-primary/65 leading-tight mt-0.5">Coming soon · 3D camera path</p>
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
