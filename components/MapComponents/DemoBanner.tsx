import Link from "next/link";
import { MapPin } from "lucide-react";

export default function DemoBanner({ hikeName }: { hikeName: string }) {
  return (
    <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-base-200 border border-neutral rounded-full px-4 py-1.5 shadow-md text-sm whitespace-nowrap">
      <span className="flex items-center gap-1.5 text-base-content/60">
        <MapPin size={13} />
        Demo
      </span>
      <span className="text-base-content font-medium">{hikeName}</span>
      <span className="text-base-content/30">·</span>
      <Link
        href="/"
        className="text-primary hover:underline font-medium"
      >
        Map your own hikes →
      </Link>
    </div>
  );
}
