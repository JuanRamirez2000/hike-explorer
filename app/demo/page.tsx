import type { Metadata } from "next";
import HikeMapLoader from "@/components/MapComponents/HikeMapLoader";
import DemoBanner from "@/components/MapComponents/DemoBanner";
import { getDemoHikeData } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Demo — Hike Explorer",
};

export default function DemoPage() {
  const { hike, trackPoints } = getDemoHikeData();
  return (
    <>
      <DemoBanner hikeName={hike.name} />
      <HikeMapLoader hike={hike} trackPoints={trackPoints} />
    </>
  );
}
