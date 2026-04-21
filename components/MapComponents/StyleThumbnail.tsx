export default function StyleThumbnail({
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
