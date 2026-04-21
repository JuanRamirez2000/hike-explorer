export type ViewshedStatus = "idle" | "computing" | "done" | "error";

export type Observer = { lat: number; lng: number; elevation: number };

export type GetElevationFn = (lng: number, lat: number) => number | null;

export type ViewshedOptions = {
  numRays?: number;
  maxRadiusM?: number;
  stepM?: number;
  observerHeightM?: number;
  cellSizeM?: number;
};

export type ViewshedProgress = {
  processed: number;
  total: number;
  pct: number;
};

export const VIEWSHED_DEFAULTS: Required<ViewshedOptions> = {
  numRays: 72,
  maxRadiusM: 50000,
  stepM: 25,
  observerHeightM: 1.7,
  cellSizeM: 50,
};
