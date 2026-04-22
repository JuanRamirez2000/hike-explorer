"use client";

import { useRef, useState } from "react";
import { LayoutList, Rows2, Dot } from "lucide-react";

export type DisplayMode = "full" | "compact" | "icon";

const MODES: { id: DisplayMode; label: string; icon: React.ReactNode }[] = [
  { id: "full",    label: "Full",    icon: <LayoutList size={14} strokeWidth={1.6} /> },
  { id: "compact", label: "Compact", icon: <Rows2 size={14} strokeWidth={1.6} /> },
  { id: "icon",    label: "Icon",    icon: <Dot size={14} strokeWidth={1.6} /> },
];

export default function DisplayModeDropdown({
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
        {MODES.find((m) => m.id === current)?.icon}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-30 bg-base-100 border border-base-content/15 rounded-2xl shadow-xl p-1 w-36 flex flex-col gap-0.5">
            {MODES.map((m) => (
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
