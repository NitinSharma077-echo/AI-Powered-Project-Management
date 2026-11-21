import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ListTodo, Pencil, Trash2, Search, CalendarDays } from "lucide-react";

import {
  getAllActionItems,
  updateActionItemStatus,
  updateActionItem,
  deleteActionItem,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { formatDate, relativeDue, isOverdue, labelOf } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import { ActionItemFormModal } from "../components/ItemForms";

const ACTION_STATUSES = ["todo", "in_progress", "blocked", "completed", "cancelled"];
const FILTERS = ["open", "overdue", ...ACTION_STATUSES, "all"];
const FILTER_LABELS = { open: "Open", overdue: "Overdue", all: "All" };
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const isOpen = (item) => !["completed", "cancelled"].includes(item.status);

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;

    getAllActionItems()
      .then((data) => active && setItems(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  function replace(item, updated) {
    setItems((prev) =>
      prev.map((existing) =>
        existing._id === item._id
          ? { ...updated, meetingTitle: item.meetingTitle, meetingId: item.meetingId }
          : existing
      )
    );
    invalidateWorkspace();
  }

  async function handleStatusChange(item, status) {
    try {
      replace(item, await updateActionItemStatus(item.meetingId, item._id, status));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleEdit(item, values) {
    replace(item, await updateActionItem(item.meetingId, item._id, values));
  }

  async function handleDelete(item) {
    await deleteActionItem(item.meetingId, item._id);
    setItems((prev) => prev.filter((existing) => existing._id !== item._id));
    invalidateWorkspace();
  }

  const counts = useMemo(() => {
    const result = { all: items.length, open: 0, overdue: 0 };
    for (const item of items) {
      result[item.status] = (result[item.status] || 0) + 1;
      if (isOpen(item)) result.open += 1;
      if (isOverdue(item.dueDate, item.status)) result.overdue += 1;
    }
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter((item) => {
        if (filter === "open" && !isOpen(item)) return false;
        if (filter === "overdue" && !isOverdue(item.dueDate, item.status)) return false;
        if (ACTION_STATUSES.includes(filter) && item.status !== filter) return false;
        return !q || [item.title, item.description, item.meetingTitle].some((f) => f?.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        // Soonest due first, undated last, then by priority.
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (da !== db) return da - db;
        return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      });
  }, [items, filter, query]);

  if (loading) {
    return <Loading text="Loading action items…" variant="list" />;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-text">
          <h1>Action items</h1>
          <p>Every task captured across your meetings, soonest due first.</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="segmented scrollable" role="tablist">
          {FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              className={filter === status ? "active" : ""}
              onClick={() => setFilter(status)}
            >
              {FILTER_LABELS[status] || labelOf(status)}
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
            placeholder="Search tasks…"
            aria-label="Search action items"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={items.length === 0 ? "No action items yet" : "Nothing here"}
          description={
            items.length === 0
              ? "Action items you add to meetings, or accept from AI analysis, show up here."
              : "No action items match this filter."
          }
        />
      ) : (
        <div className="list">
          {visible.map((item) => {
            const done = item.status === "completed";
            const overdue = isOverdue(item.dueDate, item.status);

            return (
              <div className={`list-item ${done ? "is-done" : ""}`} key={item._id}>
                <button
                  type="button"
                  role="checkbox"
                  className="check"
                  aria-checked={done}
                  aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
                  onClick={() => handleStatusChange(item, done ? "todo" : "completed")}
                >
                  <Check size={13} strokeWidth={3} />
                </button>

                <div className="list-item-body">
                  <strong>{item.title}</strong>
                  <small className="meta-row">
                    <Link to={`/meetings/${item.meetingId}?tab=actions`} className="meta-item meta-link">
                      <CalendarDays size={13} />
                      {item.meetingTitle}
                    </Link>
                    {item.dueDate && (
                      <span className={`meta-item ${overdue ? "text-danger" : ""}`}>
                        {done ? `Due ${formatDate(item.dueDate)}` : relativeDue(item.dueDate)}
                      </span>
                    )}
                  </small>
                </div>

                <div className="list-item-meta">
                  <StatusBadge status={item.priority} />
                  <select
                    className="select-compact"
                    value={item.status}
                    aria-label="Status"
                    onChange={(event) => handleStatusChange(item, event.target.value)}
                  >
                    {ACTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {labelOf(status)}
                      </option>
                    ))}
                  </select>
                  <span className="row-actions">
                    <button
                      type="button"
                      className="icon-button ghost"
                      aria-label="Edit"
                      data-tooltip="Edit"
                      onClick={() => setDialog({ type: "edit", item })}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button ghost danger"
                      aria-label="Delete"
                      data-tooltip="Delete"
                      onClick={() => setDialog({ type: "delete", item })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog?.type === "edit" && (
        <ActionItemFormModal
          initial={dialog.item}
          onSubmit={(values) => handleEdit(dialog.item, values)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmModal
          title="Delete action item?"
          message={`“${dialog.item.title}” will be permanently deleted.`}
          onConfirm={() => handleDelete(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
