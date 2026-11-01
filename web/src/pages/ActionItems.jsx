import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

import {
  getAllActionItems,
  updateActionItemStatus,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

const ACTION_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];

const FILTERS = ["all", ...ACTION_STATUSES];

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const data = await getAllActionItems();
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(item, status) {
    try {
      const updated = await updateActionItemStatus(
        item.meetingId,
        item._id,
        status
      );

      setItems((prev) =>
        prev.map((existing) =>
          existing._id === item._id
            ? { ...updated, meetingTitle: item.meetingTitle, meetingId: item.meetingId }
            : existing
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const visibleItems =
    filter === "all" ? items : items.filter((item) => item.status === filter);

  if (loading) {
    return <Loading text="Loading action items..." />;
  }

  return (
    <div className="action-items-page">
      <div className="page-heading">
        <div>
          <h1>Action items</h1>
          <p>Tasks captured across all of your meetings.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={`tab ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          title="No action items"
          description="Action items you add to your meetings will show up here."
        />
      ) : (
        <div className="list-rows">
          {visibleItems.map((item) => (
            <div className="list-row" key={item._id}>
              <button
                type="button"
                role="checkbox"
                className="check"
                aria-checked={item.status === "completed"}
                aria-label={
                  item.status === "completed"
                    ? `Reopen ${item.title}`
                    : `Complete ${item.title}`
                }
                data-tooltip={
                  item.status === "completed" ? "Reopen" : "Mark complete"
                }
                onClick={() =>
                  handleStatusChange(
                    item,
                    item.status === "completed" ? "todo" : "completed"
                  )
                }
              >
                <Check size={14} strokeWidth={3} />
              </button>

              <div className="list-row-info">
                <strong>{item.title}</strong>
                <small>
                  <Link to={`/meetings/${item.meetingId}`} className="text-link">
                    {item.meetingTitle}
                  </Link>
                  {item.dueDate &&
                    ` · Due ${new Date(item.dueDate).toLocaleDateString()}`}
                </small>
              </div>

              <div className="list-row-meta">
                <StatusBadge status={item.priority} />

                <select
                  value={item.status}
                  onChange={(event) =>
                    handleStatusChange(item, event.target.value)
                  }
                >
                  {ACTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
