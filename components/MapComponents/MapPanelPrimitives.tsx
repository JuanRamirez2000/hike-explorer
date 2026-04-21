export function Medallion({
  children,
  className = "bg-base-100 border border-base-content/15",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function MedallionRow({
  icon,
  medallionClass,
  title,
  subtitle,
  trailing,
  surface = true,
}: {
  icon: React.ReactNode;
  medallionClass?: string;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  surface?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 ${surface ? "bg-base-200" : "border border-base-content/15"}`}>
      <Medallion className={medallionClass}>{icon}</Medallion>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight">{title}</p>
        <p className="text-[11px] text-base-content/65 leading-tight mt-0.5">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}
