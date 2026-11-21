import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, GitBranch, Pencil, Trash2, Search, CalendarDays } from "lucide-react";

import {
  getAllDecisions,
  updateDecisionStatus,
  updateDecision,
  deleteDecision,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { labelOf } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import { DecisionFormModal } from "../components/ItemForms";

const FILTERS = ["all", "proposed", "approved", "rejected"];

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;

    getAllDecisions()
      .then((data) => active && setDecisions(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  function replace(decision, updated) {
    setDecisions((prev) =>
      prev.map((existing) =>
        existing._id === decision._id
          ? { ...updated, meetingTitle: decision.meetingTitle, meetingId: decision.meetingId }
          : existing
      )
    );
    invalidateWorkspace();
  }

  async function handleStatusChange(decision, status) {
    try {
      replace(decision, await updateDecisionStatus(decision.meetingId, decision._id, status));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleEdit(decision, values) {
    replace(decision, await updateDecision(decision.meetingId, decision._id, values));
  }

  async function handleDelete(decision) {
    await deleteDecision(decision.meetingId, decision._id);
    setDecisions((prev) => prev.filter((existing) => existing._id !== decision._id));
    invalidateWorkspace();
  }

  const counts = useMemo(() => {
    const result = { all: decisions.length };
    for (const d of decisions) result[d.status] = (result[d.status] || 0) + 1;
    return result;
  }, [decisions]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decisions.filter(
      (d) =>
        (filter === "all" || d.status === filter) &&
        (!q || [d.title, d.description, d.meetingTitle].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [decisions, filter, query]);

  if (loading) {
    return <Loading text="Loading decisions…" variant="list" />;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-text">
          <h1>Decisions</h1>
          <p>What was agreed across your meetings, and what still needs sign-off.</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="segmented" role="tablist">
          {FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              className={filter === status ? "active" : ""}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All" : labelOf(status)}
              <span className="segmented-count">{counts[status] || 0}</span>
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search decisions…"
            aria-label="Search decisions"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={decisions.length === 0 ? "No decisions yet" : "Nothing here"}
          description={
            decisions.length === 0
              ? "Decisions you record in meetings show up here."
              : "No decisions match this filter."
          }
        />
      ) : (
        <div className="list">
          {visible.map((decision) => (
            <div className="list-item" key={decision._id}>
              <span className={`list-item-icon tone-${decision.status}`}>
                <GitBranch size={16} />
              </span>
              <div className="list-item-body">
                <strong>{decision.title}</strong>
                {decision.description && <p>{decision.description}</p>}
                <small className="meta-row">
                  <Link to={`/meetings/${decision.meetingId}?tab=decisions`} className="meta-item meta-link">
                    <CalendarDays size={13} />
                    {decision.meetingTitle}
                  </Link>
                </small>
              </div>
              <div className="list-item-meta">
                <StatusBadge status={decision.status} />
                {decision.status === "proposed" && (
                  <>
                    <button
                      type="button"
                      className="icon-button ghost success"
                      aria-label="Approve"
                      data-tooltip="Approve"
                      onClick={() => handleStatusChange(decision, "approved")}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button ghost danger"
                      aria-label="Reject"
                      data-tooltip="Reject"
                      onClick={() => handleStatusChange(decision, "rejected")}
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
                <span className="row-actions">
                  <button
                    type="button"
                    className="icon-button ghost"
                    aria-label="Edit"
                    data-tooltip="Edit"
                    onClick={() => setDialog({ type: "edit", item: decision })}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button ghost danger"
                    aria-label="Delete"
                    data-tooltip="Delete"
                    onClick={() => setDialog({ type: "delete", item: decision })}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog?.type === "edit" && (
        <DecisionFormModal
          initial={dialog.item}
          onSubmit={(values) => handleEdit(dialog.item, values)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmModal
          title="Delete decision?"
          message={`“${dialog.item.title}” will be permanently deleted.`}
          onConfirm={() => handleDelete(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
