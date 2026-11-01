import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  getMeeting,
  getMeetingDecisions,
  createDecision,
  updateDecisionStatus,
  getMeetingActionItems,
  createActionItem,
  updateActionItemStatus,
  analyzeMeeting,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const ACTION_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];

export default function MeetingDetails() {
  const { meetingId } = useParams();

  const [meeting, setMeeting] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("notes");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    title: "",
    description: "",
  });

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  async function loadMeeting() {
    setLoading(true);
    setError("");

    try {
      const [meetingData, decisionData, actionData] = await Promise.all([
        getMeeting(meetingId),
        getMeetingDecisions(meetingId),
        getMeetingActionItems(meetingId),
      ]);

      setMeeting(meetingData);
      setDecisions(decisionData);
      setActionItems(actionData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisError("");

    try {
      const result = await analyzeMeeting(meetingId);
      setAnalysis(result);
      setTab("analysis");
    } catch (err) {
      setAnalysisError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreateDecision(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const decision = await createDecision(meetingId, decisionForm);
      setDecisions((prev) => [decision, ...prev]);
      setDecisionForm({ title: "", description: "" });
      setDecisionModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateActionItem(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const item = await createActionItem(meetingId, actionForm);
      setActionItems((prev) => [item, ...prev]);
      setActionForm({ title: "", description: "", dueDate: "", priority: "medium" });
      setActionModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDecisionStatus(decisionId, status) {
    try {
      const updated = await updateDecisionStatus(meetingId, decisionId, status);
      setDecisions((prev) =>
        prev.map((item) => (item._id === decisionId ? updated : item))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleActionStatus(actionItemId, status) {
    try {
      const updated = await updateActionItemStatus(
        meetingId,
        actionItemId,
        status
      );
      setActionItems((prev) =>
        prev.map((item) => (item._id === actionItemId ? updated : item))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function addSuggestedDecision(suggestion) {
    try {
      const decision = await createDecision(meetingId, {
        title: suggestion.title,
        description: suggestion.description,
      });
      setDecisions((prev) => [decision, ...prev]);
    } catch (err) {
      setAnalysisError(getErrorMessage(err));
    }
  }

  async function addSuggestedActionItem(suggestion) {
    try {
      const item = await createActionItem(meetingId, {
        title: suggestion.title,
        description: suggestion.description,
        dueDate: suggestion.due_date || undefined,
        priority: suggestion.priority || "medium",
      });
      setActionItems((prev) => [item, ...prev]);
    } catch (err) {
      setAnalysisError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <Loading text="Loading meeting..." />;
  }

  if (error || !meeting) {
    return (
      <div>
        <Link to="/meetings" className="back-link">
          <ArrowLeft size={15} />
          Back to meetings
        </Link>
        <div className="alert alert-error">
          {error || "Meeting not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-details-page">
      <Link to="/meetings" className="back-link">
        <ArrowLeft size={15} />
        Back to meetings
      </Link>

      <div className="detail-header">
        <div>
          <h1>{meeting.title}</h1>

          <div className="detail-meta">
            <span>
              {meeting.meetingDate
                ? new Date(meeting.meetingDate).toLocaleDateString()
                : "Date not specified"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          <Sparkles size={17} />
          {analyzing ? "Analyzing..." : "Analyze with AI"}
        </button>
      </div>

      {analysisError && <div className="alert alert-error">{analysisError}</div>}

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "notes" ? "active" : ""}`}
          onClick={() => setTab("notes")}
        >
          Notes
        </button>
        <button
          type="button"
          className={`tab ${tab === "decisions" ? "active" : ""}`}
          onClick={() => setTab("decisions")}
        >
          Decisions ({decisions.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "actions" ? "active" : ""}`}
          onClick={() => setTab("actions")}
        >
          Action items ({actionItems.length})
        </button>
        {analysis && (
          <button
            type="button"
            className={`tab ${tab === "analysis" ? "active" : ""}`}
            onClick={() => setTab("analysis")}
          >
            AI analysis
          </button>
        )}
      </div>

      {tab === "notes" && (
        <div className="detail-card">
          <h2>Meeting notes</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {meeting.notes || "No notes added for this meeting yet."}
          </p>
        </div>
      )}

      {tab === "decisions" && (
        <div>
          <div className="section-heading">
            <div>
              <h2>Decisions</h2>
              <p>Decisions made during this meeting.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setDecisionModalOpen(true)}
            >
              <Plus size={16} />
              Add decision
            </button>
          </div>

          {decisions.length === 0 ? (
            <EmptyState
              title="No decisions yet"
              description="Record a decision made during this meeting."
            />
          ) : (
            <div className="list-rows">
              {decisions.map((decision) => (
                <div className="list-row" key={decision._id}>
                  <div className="list-row-info">
                    <strong>{decision.title}</strong>
                    {decision.description && (
                      <small>{decision.description}</small>
                    )}
                  </div>

                  <div className="list-row-meta">
                    <StatusBadge status={decision.status} />

                    {decision.status === "proposed" && (
                      <>
                        <button
                          type="button"
                          className="icon-button"
                          title="Approve"
                          onClick={() =>
                            handleDecisionStatus(decision._id, "approved")
                          }
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Reject"
                          onClick={() =>
                            handleDecisionStatus(decision._id, "rejected")
                          }
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
      )}

      {tab === "actions" && (
        <div>
          <div className="section-heading">
            <div>
              <h2>Action items</h2>
              <p>Tasks agreed upon during this meeting.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setActionModalOpen(true)}
            >
              <Plus size={16} />
              Add action item
            </button>
          </div>

          {actionItems.length === 0 ? (
            <EmptyState
              title="No action items yet"
              description="Add a task that came out of this meeting."
            />
          ) : (
            <div className="list-rows">
              {actionItems.map((item) => (
                <div className="list-row" key={item._id}>
                  <div className="list-row-info">
                    <strong>{item.title}</strong>
                    {item.description && <small>{item.description}</small>}
                  </div>

                  <div className="list-row-meta">
                    <StatusBadge status={item.priority} />

                    <select
                      value={item.status}
                      onChange={(event) =>
                        handleActionStatus(item._id, event.target.value)
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
      )}

      {tab === "analysis" && analysis && (
        <div>
          <div className="detail-card">
            <h2>Summary</h2>
            <p>{analysis.summary}</p>
          </div>

          {analysis.key_points?.length > 0 && (
            <div className="detail-card">
              <h2>Key points</h2>
              <ul>
                {analysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="section-heading">
            <div>
              <h2>Suggested decisions</h2>
              <p>Review and add the ones that are accurate.</p>
            </div>
          </div>

          {analysis.decisions?.length > 0 ? (
            <div className="list-rows">
              {analysis.decisions.map((decision, index) => (
                <div className="list-row" key={index}>
                  <div className="list-row-info">
                    <strong>{decision.title}</strong>
                    <small>{decision.description}</small>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addSuggestedDecision(decision)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="form-hint">No decisions were detected.</p>
          )}

          <div className="section-heading" style={{ marginTop: 20 }}>
            <div>
              <h2>Suggested action items</h2>
              <p>Review and add the ones that are accurate.</p>
            </div>
          </div>

          {analysis.action_items?.length > 0 ? (
            <div className="list-rows">
              {analysis.action_items.map((item, index) => (
                <div className="list-row" key={index}>
                  <div className="list-row-info">
                    <strong>{item.title}</strong>
                    <small>
                      {item.description}
                      {item.assignee_name ? ` — ${item.assignee_name}` : ""}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addSuggestedActionItem(item)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="form-hint">No action items were detected.</p>
          )}

          {analysis.unresolved_questions?.length > 0 && (
            <div className="detail-card" style={{ marginTop: 20 }}>
              <h2>Unresolved questions</h2>
              <ul>
                {analysis.unresolved_questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {decisionModalOpen && (
        <Modal title="Add decision" onClose={() => setDecisionModalOpen(false)}>
          <form className="form-grid" onSubmit={handleCreateDecision}>
            <label className="field-label">
              Title
              <input
                type="text"
                value={decisionForm.title}
                onChange={(event) =>
                  setDecisionForm({ ...decisionForm, title: event.target.value })
                }
                required
                maxLength={200}
              />
            </label>

            <label className="field-label">
              Description
              <textarea
                value={decisionForm.description}
                onChange={(event) =>
                  setDecisionForm({
                    ...decisionForm,
                    description: event.target.value,
                  })
                }
              />
            </label>

            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDecisionModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : "Add decision"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {actionModalOpen && (
        <Modal title="Add action item" onClose={() => setActionModalOpen(false)}>
          <form className="form-grid" onSubmit={handleCreateActionItem}>
            <label className="field-label">
              Title
              <input
                type="text"
                value={actionForm.title}
                onChange={(event) =>
                  setActionForm({ ...actionForm, title: event.target.value })
                }
                required
                maxLength={200}
              />
            </label>

            <label className="field-label">
              Description
              <textarea
                value={actionForm.description}
                onChange={(event) =>
                  setActionForm({ ...actionForm, description: event.target.value })
                }
              />
            </label>

            <div className="form-row">
              <label className="field-label">
                Due date
                <input
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(event) =>
                    setActionForm({ ...actionForm, dueDate: event.target.value })
                  }
                />
              </label>

              <label className="field-label">
                Priority
                <select
                  value={actionForm.priority}
                  onChange={(event) =>
                    setActionForm({ ...actionForm, priority: event.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActionModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : "Add action item"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
