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
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-base-content/50 mb-1">Your atlas</p>
        <h1 className="text-4xl font-medium tracking-tight leading-[1.05]">My Hikes</h1>
        {hikeCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-base-content/50">
              {hikeCount} hike{hikeCount !== 1 ? "s" : ""} &middot;{" "}
              {fmtDistance(totalDistanceKm, unit)} total
            </p>
            <div className="flex bg-base-300 rounded-full p-0.5 gap-0.5">
              <button
                className={`btn btn-xs rounded-full border-0 ${unit === "metric" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUnit("metric")}
              >
                km
              </button>
              <button
                className={`btn btn-xs rounded-full border-0 ${unit === "imperial" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUnit("imperial")}
              >
                mi
              </button>
            </div>
          </div>
        )}
      </div>
      <Link href="/upload" className="btn btn-primary btn-sm rounded-full">
        + Upload Hike
      </Link>
    </div>
  );
}
