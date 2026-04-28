"use client";

import { useState, useEffect } from "react";
import type { ViewshedStatus, ViewshedProgress } from "@/types/viewshed";
import type { MapStyle } from "@/types/map";
import type { UnitSystem } from "@/lib/format";
import { Map, Eye, EyeOff, Layers, Ruler, Sun, Mountain, TrendingUp, RefreshCw, Play, Expand, MapPin } from "lucide-react";
import DisplayModeDropdown, { type DisplayMode } from "@/components/MapComponents/DisplayModeDropdown";
import { Medallion, MedallionRow } from "@/components/MapComponents/MapPanelPrimitives";
import FogStatusBanner from "@/components/MapComponents/FogStatusBanner";
import StyleThumbnail from "@/components/MapComponents/StyleThumbnail";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const PREVIEW_LOC = "-119.55,37.74,9,0"; // Yosemite — shows terrain, water, and roads across all three styles

const BASEMAP_PREVIEWS: Record<MapStyle, string> = {
  outdoors:  `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
  satellite: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
  hybrid:    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${PREVIEW_LOC}/120x120@2x?access_token=${MAPBOX_TOKEN}`,
};

export type FogRenderStyle = "grid" | "smooth";

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

  unexploredOpacity: number;
  onUnexploredOpacityChange: (v: number) => void;

  showDistMarkers: boolean;
  onShowDistMarkersChange: (v: boolean) => void;
  showPins: boolean;
  onShowPinsChange: (v: boolean) => void;
}

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
  unexploredOpacity,
  onUnexploredOpacityChange,
  showDistMarkers,
  onShowDistMarkersChange,
  showPins,
  onShowPinsChange,
}: MapControlsPanelProps) {
  const [activeTab, setActiveTab] = useState<"map" | "fog" | "view">("fog");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");

  useEffect(() => {
    if (window.innerWidth < 1024) setDisplayMode("icon");
  }, []);

  const tabs = [
    { id: "map" as const, label: "Map",  icon: <Map size={18} strokeWidth={1.6} /> },
    { id: "fog" as const, label: "Fog",  icon: <Eye size={18} strokeWidth={1.6} /> },
    { id: "view" as const, label: "View", icon: <Layers size={18} strokeWidth={1.6} /> },
  ];

  // ── icon mode ───────────────────────────────────────────────────────────

  if (displayMode === "icon") {
    return (
      <div className="absolute top-[100px] right-4 z-10">
        <button
          className="w-11 h-11 rounded-2xl bg-base-100 border border-base-content/15 shadow-xl flex items-center justify-center text-base-content/70 hover:text-base-content transition-colors"
          title="Controls"
          onClick={() => setDisplayMode("full")}
        >
          <Layers size={18} strokeWidth={1.6} />
        </button>
      </div>
    );
  }

  // ── compact mode ────────────────────────────────────────────────────────

  if (displayMode === "compact") {
    return (
      <div className="absolute top-[100px] right-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-2xl w-[320px] max-w-[calc(100vw-2rem)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center shrink-0 text-base-content/60 hover:text-base-content transition-colors"
            onClick={() => setDisplayMode("full")}
            title="Expand"
          >
            <Expand size={16} strokeWidth={1.6} />
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
    <div className="absolute top-[100px] right-4 z-10 bg-base-100 border border-base-content/15 shadow-xl rounded-3xl w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden">

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
              icon={<Ruler size={18} strokeWidth={1.6} />}
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

            {/* Distance markers toggle */}
            <MedallionRow
              icon={<Ruler size={18} strokeWidth={1.6} />}
              title="Distance markers"
              subtitle="Interval labels along route"
              trailing={
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm shrink-0"
                  checked={showDistMarkers}
                  onChange={(e) => onShowDistMarkersChange(e.target.checked)}
                />
              }
            />

            {/* Route pin markers toggle */}
            <MedallionRow
              icon={<MapPin size={18} strokeWidth={1.6} />}
              title="Route markers"
              subtitle="Start, end, peak & low points"
              trailing={
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm shrink-0"
                  checked={showPins}
                  onChange={(e) => onShowPinsChange(e.target.checked)}
                />
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
              icon={<Eye size={18} strokeWidth={1.6} />}
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
                  <Sun size={18} strokeWidth={1.6} />
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

            {/* Unexplored fade */}
            <div className="bg-base-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Medallion className="bg-base-100 border border-base-content/15">
                  <EyeOff size={18} strokeWidth={1.6} />
                </Medallion>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">Hide unexplored</p>
                  <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">Fade map outside viewshed</p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {Math.round(unexploredOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={1}
                value={Math.round(unexploredOpacity * 100)}
                onChange={(e) => onUnexploredOpacityChange(Number(e.target.value) / 100)}
                className="range range-primary range-xs w-full"
                disabled={viewshedStatus !== "done"}
              />
            </div>

            {/* Render style toggle */}
            <MedallionRow
              icon={<Eye size={18} strokeWidth={1.6} />}
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
                <RefreshCw size={16} strokeWidth={1.6} />
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
              icon={<Mountain size={18} strokeWidth={1.6} />}
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
                  <TrendingUp size={18} strokeWidth={1.6} />
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
            <div className="bg-primary-soft rounded-2xl p-4 flex items-center gap-3">
              <Medallion className="bg-primary/25">
                <span className="text-primary-dark"><Play size={18} strokeWidth={1.6} /></span>
              </Medallion>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-primary-dark leading-tight">Flyover mode</p>
                <p className="text-[11px] text-primary-dark/75 leading-tight mt-0.5">Coming soon · 3D camera path</p>
              </div>
              <button
                className="btn btn-xs rounded-full border border-primary/50 text-primary-dark opacity-70 cursor-not-allowed shrink-0"
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
