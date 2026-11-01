import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  getAllDecisions,
  updateDecisionStatus,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

const FILTERS = ["all", "proposed", "approved", "rejected"];

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadDecisions();
  }, []);

  async function loadDecisions() {
    setLoading(true);
    setError("");

    try {
      const data = await getAllDecisions();
      setDecisions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(decision, status) {
    try {
      const updated = await updateDecisionStatus(
        decision.meetingId,
        decision._id,
        status
      );

      setDecisions((prev) =>
        prev.map((existing) =>
          existing._id === decision._id
            ? {
                ...updated,
                meetingTitle: decision.meetingTitle,
                meetingId: decision.meetingId,
              }
            : existing
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const visibleDecisions =
    filter === "all"
      ? decisions
      : decisions.filter((decision) => decision.status === filter);

  if (loading) {
    return <Loading text="Loading decisions..." />;
  }

  return (
    <div className="decisions-page">
      <div className="page-heading">
        <div>
          <h1>Decisions</h1>
          <p>Decisions recorded across all of your meetings.</p>
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
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {visibleDecisions.length === 0 ? (
        <EmptyState
          title="No decisions"
          description="Decisions you record in your meetings will show up here."
        />
      ) : (
        <div className="list-rows">
          {visibleDecisions.map((decision) => (
            <div className="list-row" key={decision._id}>
              <div className="list-row-info">
                <strong>{decision.title}</strong>
                <small>
                  <Link
                    to={`/meetings/${decision.meetingId}`}
                    className="text-link"
                  >
                    {decision.meetingTitle}
                  </Link>
                  {decision.description ? ` · ${decision.description}` : ""}
                </small>
              </div>

              <div className="list-row-meta">
                <StatusBadge status={decision.status} />

                {decision.status === "proposed" && (
                  <>
                    <button
                      type="button"
                      className="icon-button"
                      title="Approve"
                      onClick={() => handleStatusChange(decision, "approved")}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      title="Reject"
                      onClick={() => handleStatusChange(decision, "rejected")}
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
