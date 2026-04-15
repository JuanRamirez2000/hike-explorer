"use client";

interface Props {
  hikeName: string;
  open: boolean;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteHikeModal({
  hikeName,
  open,
  busy,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="font-semibold text-lg">Delete hike?</h3>
        <p className="py-3 text-sm text-base-content/70">
          <span className="font-medium text-base-content">{hikeName}</span> will
          be permanently deleted. This cannot be undone.
        </p>
        <div className="modal-action">
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="btn btn-error btn-sm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <span className="loading loading-spinner loading-xs" />}
            Delete
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={() => !busy && onClose()}
      />
    </div>
  );
}
