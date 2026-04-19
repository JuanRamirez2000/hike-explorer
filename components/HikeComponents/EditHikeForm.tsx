"use client";

import { useState } from "react";
import HikeFieldsForm from "@/components/HikeComponents/HikeFieldsForm";

interface EditHikeFormProps {
  initialName: string;
  initialDate: string;
  initialCreator: string;
  busy: boolean;
  error: string | null;
  onSave: (data: { name: string; date: string; creator: string }) => void;
  onCancel: () => void;
}

export default function EditHikeForm({
  initialName,
  initialDate,
  initialCreator,
  busy,
  error,
  onSave,
  onCancel,
}: EditHikeFormProps) {
  const [name, setName] = useState(initialName);
  const [date, setDate] = useState(initialDate);
  const [creator, setCreator] = useState(initialCreator);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim()) {
      setLocalError("Name is required");
      return;
    }
    setLocalError(null);
    onSave({ name: name.trim(), date, creator: creator.trim() });
  }

  function handleCancel() {
    setName(initialName);
    setDate(initialDate);
    setCreator(initialCreator);
    setLocalError(null);
    onCancel();
  }

  const displayError = localError ?? error;

  return (
    <div className="space-y-3">
      <HikeFieldsForm
        name={name}
        date={date}
        creator={creator}
        onNameChange={setName}
        onDateChange={setDate}
        onCreatorChange={setCreator}
        compact
      />

      {displayError && <p className="text-error text-sm">{displayError}</p>}

      <div className="flex gap-2 pt-1">
        <button
          className="btn btn-primary btn-sm flex-1"
          onClick={handleSave}
          disabled={busy}
        >
          {busy && <span className="loading loading-spinner loading-xs" />}
          Save
        </button>
        <button
          className="btn btn-ghost btn-sm flex-1"
          onClick={handleCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
