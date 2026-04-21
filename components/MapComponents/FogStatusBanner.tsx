import { IconCheck, IconAlert, IconEllipsis } from "@/components/icons";
import { Medallion } from "@/components/MapComponents/MapPanelPrimitives";
import type { ViewshedStatus, ViewshedProgress } from "@/types/viewshed";

export default function FogStatusBanner({
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
