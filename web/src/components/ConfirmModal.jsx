import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import Modal from "./Modal";
import { Spinner } from "./Loading";

// A styled replacement for window.confirm. `onConfirm` may be async; the
// dialog stays open (with its error shown) if it throws.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err?.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose} size="sm">
      <div className="confirm-body">
        {danger && (
          <span className="confirm-icon">
            <AlertTriangle size={20} />
          </span>
        )}
        <p>{message}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={danger ? "danger-button" : "primary-button"}
          onClick={handleConfirm}
          disabled={busy}
          autoFocus
        >
          {busy && <Spinner size={14} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
