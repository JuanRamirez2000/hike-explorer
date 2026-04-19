"use client";

interface Props {
  name: string;
  date: string;
  creator: string;
  onNameChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onCreatorChange: (v: string) => void;
  compact?: boolean;
}

export default function HikeFieldsForm({
  name,
  date,
  creator,
  onNameChange,
  onDateChange,
  onCreatorChange,
  compact = false,
}: Props) {
  const inputClass = `input input-bordered w-full${compact ? " input-sm" : ""}`;
  const labelClass = `label-text text-base-content/60 mb-1${compact ? " text-xs" : " text-sm"}`;

  return (
    <>
      <label className="form-control w-full">
        <span className={labelClass}>Name</span>
        <input
          type="text"
          className={inputClass}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </label>
      <label className="form-control w-full">
        <span className={labelClass}>Date</span>
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </label>
      <label className="form-control w-full">
        <span className={labelClass}>Creator / Device</span>
        <input
          type="text"
          className={inputClass}
          value={creator}
          onChange={(e) => onCreatorChange(e.target.value)}
        />
      </label>
    </>
  );
}
