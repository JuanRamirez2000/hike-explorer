"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtDistance, type UnitSystem } from "@/lib/format";

interface Props {
  hikeCount: number;
  totalDistanceKm: number;
}

export default function DashboardStats({ hikeCount, totalDistanceKm }: Props) {
  const [unit, setUnit] = useState<UnitSystem>("metric");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">My Hikes</h1>
        {hikeCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-base-content/50">
              {hikeCount} hike{hikeCount !== 1 ? "s" : ""} &middot;{" "}
              {fmtDistance(totalDistanceKm, unit)} total
            </p>
            <div className="join">
              <button
                className={`join-item btn btn-xs ${unit === "metric" ? "btn-neutral" : "btn-ghost"}`}
                onClick={() => setUnit("metric")}
              >
                km
              </button>
              <button
                className={`join-item btn btn-xs ${unit === "imperial" ? "btn-neutral" : "btn-ghost"}`}
                onClick={() => setUnit("imperial")}
              >
                mi
              </button>
            </div>
          </div>
        )}
      </div>
      <Link href="/upload" className="btn btn-primary btn-sm">
        + Upload Hike
      </Link>
    </div>
  );
}
