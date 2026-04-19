export type Observer = { lat: number; lng: number; elevation: number };

export type ViewshedStatus = "idle" | "computing" | "done" | "error";

export type GetElevationFn = (lng: number, lat: number) => number | null;

export type ViewshedOptions = {
  /** Number of rays cast from each observer. Default: 72 (every 5°). */
  numRays?: number;
  /** Maximum visibility radius in meters. Default: 1500. */
  maxRadiusM?: number;
  /** Step distance along each ray in meters. Default: 25. */
  stepM?: number;
  /** Eye height above terrain in meters. Default: 1.7. */
  observerHeightM?: number;
  /** Cell size for deduplication and GeoJSON output in meters. Default: 25. */
  cellSizeM?: number;
};

export type ViewshedProgress = {
  processed: number;
  total: number;
  pct: number;
};

export const VIEWSHED_DEFAULTS: Required<ViewshedOptions> = {
  numRays: 72,
  maxRadiusM: 1500,
  stepM: 25,
  observerHeightM: 1.7,
  cellSizeM: 25,
};
