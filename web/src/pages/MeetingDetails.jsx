import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  CalendarDays,
  FolderKanban,
  FileText,
  Lightbulb,
  ListTodo,
  GitBranch,
  Check,
  Save,
  X,
  MessageSquarePlus,
  HelpCircle,
} from "lucide-react";

import {
  getMeeting,
  getProjects,
  updateMeeting,
  deleteMeeting,
  addFollowUp,
  removeFollowUp,
  getMeetingDecisions,
  createDecision,
  updateDecision,
  updateDecisionStatus,
  deleteDecision,
  getMeetingActionItems,
  createActionItem,
  updateActionItem,
  updateActionItemStatus,
  deleteActionItem,
  analyzeMeeting,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { formatDate, formatDateTime, relativeDue, isOverdue } from "../utils/format";

import Loading, { Spinner } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import {
  DecisionFormModal,
  ActionItemFormModal,
  MeetingFormModal,
} from "../components/ItemForms";

const ACTION_STATUSES = ["todo", "in_progress", "blocked", "completed", "cancelled"];
const STATUS_TEXT = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
  cancelled: "Cancelled",
};
const TABS = ["notes", "decisions", "actions", "analysis"];

export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [meeting, setMeeting] = useState(null);
  const [projects, setProjects] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const requestedTab = searchParams.get("tab");
  const [tab, setTabState] = useState(TABS.includes(requestedTab) ? requestedTab : "notes");

  // Notes editor
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Points remembered later
  const [followUpText, setFollowUpText] = useState("");
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  // AI
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [added, setAdded] = useState({});

  // Dialogs: { type, item }
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [meetingData, decisionData, actionData, projectData] = await Promise.all([
          getMeeting(meetingId),
          getMeetingDecisions(meetingId),
          getMeetingActionItems(meetingId),
          getProjects().catch(() => []),
        ]);

        if (!active) return;
        setMeeting(meetingData);
        setDecisions(decisionData);
        setActionItems(actionData);
        setProjects(projectData);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [meetingId]);

  // Warn before leaving with unsaved note edits.
  useEffect(() => {
    if (!editingNotes || notesDraft === (meeting?.notes || "")) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editingNotes, notesDraft, meeting]);

  const project = useMemo(
    () => projects.find((item) => item._id === meeting?.project),
    [projects, meeting]
  );

  function setTab(next) {
    setTabState(next);
    setSearchParams(next === "notes" ? {} : { tab: next }, { replace: true });
  }

  function flash(message) {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  }

  function changed() {
    invalidateWorkspace();
  }

  // ---------- Meeting ----------

  async function handleSaveMeeting(values) {
    const updated = await updateMeeting(meetingId, values);
    setMeeting(updated);
    changed();
    flash("Meeting updated.");
  }

  async function handleDeleteMeeting() {
    await deleteMeeting(meetingId);
    changed();
    navigate("/meetings", { replace: true });
  }

  // ---------- Notes ----------

  function startEditingNotes() {
    setNotesDraft(meeting.notes || "");
    setEditingNotes(true);
  }

  function cancelEditingNotes() {
    if (
      notesDraft !== (meeting.notes || "") &&
      !window.confirm("Discard your changes to the notes?")
    ) {
      return;
    }
    setEditingNotes(false);
  }

  async function saveNotes() {
    setSavingNotes(true);
    setError("");

    try {
      const updated = await updateMeeting(meetingId, { notes: notesDraft });
      setMeeting(updated);
      setEditingNotes(false);
      changed();
      flash("Notes saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingNotes(false);
    }
  }

  function handleNotesKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      saveNotes();
    } else if (event.key === "Escape") {
      cancelEditingNotes();
    }
  }

  async function handleAddFollowUp(event) {
    event.preventDefault();
    if (!followUpText.trim()) return;

    setAddingFollowUp(true);
    setError("");

    try {
      const updated = await addFollowUp(meetingId, followUpText);
      setMeeting(updated);
      setFollowUpText("");
      changed();
      flash("Point added to the meeting record.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingFollowUp(false);
    }
  }

  async function handleRemoveFollowUp(followUpId) {
    const updated = await removeFollowUp(meetingId, followUpId);
    setMeeting(updated);
    changed();
  }

  // ---------- Decisions ----------

  async function saveDecision(values, existing) {
    if (existing) {
      const updated = await updateDecision(meetingId, existing._id, values);
      setDecisions((prev) => prev.map((d) => (d._id === existing._id ? updated : d)));
    } else {
      const created = await createDecision(meetingId, values);
      setDecisions((prev) => [created, ...prev]);
    }
    changed();
  }

  async function handleDecisionStatus(decisionId, status) {
    try {
      const updated = await updateDecisionStatus(meetingId, decisionId, status);
      setDecisions((prev) => prev.map((d) => (d._id === decisionId ? updated : d)));
      changed();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeDecision(decision) {
    await deleteDecision(meetingId, decision._id);
    setDecisions((prev) => prev.filter((d) => d._id !== decision._id));
    changed();
  }

  // ---------- Action items ----------

  async function saveActionItem(values, existing) {
    if (existing) {
      const updated = await updateActionItem(meetingId, existing._id, values);
      setActionItems((prev) => prev.map((a) => (a._id === existing._id ? updated : a)));
    } else {
      const created = await createActionItem(meetingId, values);
      setActionItems((prev) => [created, ...prev]);
    }
    changed();
  }

  async function handleActionStatus(actionItemId, status) {
    try {
      const updated = await updateActionItemStatus(meetingId, actionItemId, status);
      setActionItems((prev) => prev.map((a) => (a._id === actionItemId ? updated : a)));
      changed();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeActionItem(item) {
    await deleteActionItem(meetingId, item._id);
    setActionItems((prev) => prev.filter((a) => a._id !== item._id));
    changed();
  }

  // ---------- AI ----------

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");

    try {
      const result = await analyzeMeeting(meetingId);
      setAnalysis(result);
      setAdded({});
      setTab("analysis");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function addSuggestion(kind, suggestion, index) {
    const key = `${kind}-${index}`;
    setAdded((prev) => ({ ...prev, [key]: "saving" }));

    try {
      if (kind === "decision") {
        await saveDecision({ title: suggestion.title, description: suggestion.description });
      } else {
        await saveActionItem({
          title: suggestion.title,
          description: [suggestion.description, suggestion.assignee_name && `Owner: ${suggestion.assignee_name}`]
            .filter(Boolean)
            .join("\n"),
          dueDate: suggestion.due_date || null,
          priority: suggestion.priority || "medium",
        });
      }
      setAdded((prev) => ({ ...prev, [key]: "done" }));
    } catch (err) {
      setAdded((prev) => ({ ...prev, [key]: undefined }));
      setError(getErrorMessage(err));
    }
  }

  // ---------- Render ----------

  if (loading) {
    return <Loading text="Loading meeting…" variant="detail" />;
  }

  if (!meeting) {
    return (
      <div className="page-stack">
        <Link to="/meetings" className="back-link">
          <ArrowLeft size={15} />
          Back to meetings
        </Link>
        <div className="alert alert-error">{error || "Meeting not found."}</div>
      </div>
    );
  }

  const followUps = meeting.followUps || [];
  const openActions = actionItems.filter(
    (item) => !["completed", "cancelled"].includes(item.status)
  ).length;

  const tabs = [
    { id: "notes", label: "Notes", icon: FileText, count: followUps.length || null },
    { id: "decisions", label: "Decisions", icon: GitBranch, count: decisions.length },
    { id: "actions", label: "Action items", icon: ListTodo, count: actionItems.length },
    ...(analysis ? [{ id: "analysis", label: "AI analysis", icon: Sparkles }] : []),
  ];

  return (
    <div className="page-stack">
      <Link to="/meetings" className="back-link">
        <ArrowLeft size={15} />
        Back to meetings
      </Link>

      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">Meeting</span>
          <h1>{meeting.title}</h1>
          <div className="meta-row">
            <span className="meta-item">
              <CalendarDays size={14} />
              {formatDate(meeting.meetingDate, "No date")}
            </span>
            {project && (
              <Link to={`/projects/${project._id}`} className="meta-item meta-link">
                <FolderKanban size={14} />
                {project.name}
              </Link>
            )}
            <span className="meta-item">
              <ListTodo size={14} />
              {openActions} open action item{openActions === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="icon-button"
            data-tooltip="Edit meeting"
            aria-label="Edit meeting"
            onClick={() => setDialog({ type: "meeting" })}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            data-tooltip="Delete meeting"
            aria-label="Delete meeting"
            onClick={() => setDialog({ type: "delete-meeting" })}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? <Spinner size={15} /> : <Sparkles size={16} />}
            {analyzing ? "Analyzing…" : "Analyze with AI"}
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && (
        <div className="toast" role="status">
          <Check size={15} />
          {notice}
        </div>
      )}

      <div className="tabs" role="tablist">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <Icon size={15} />
              {item.label}
              {item.count ? <span className="tab-count">{item.count}</span> : null}
            </button>
          );
        })}
      </div>

      {/* ---------------- Notes ---------------- */}
      {tab === "notes" && (
        <div className="page-stack">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Meeting notes</h2>
                <p>What was discussed in the meeting.</p>
              </div>
              {!editingNotes && (
                <button type="button" className="secondary-button" onClick={startEditingNotes}>
                  <Pencil size={15} />
                  {meeting.notes ? "Edit notes" : "Add notes"}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="notes-editor">
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  onKeyDown={handleNotesKeyDown}
                  rows={12}
                  autoFocus
                  placeholder="Type or paste the meeting notes…"
                />
                <div className="notes-editor-bar">
                  <span className="hint">
                    {notesDraft.length.toLocaleString()} characters · <kbd>Ctrl</kbd>
                    <kbd>Enter</kbd> to save · <kbd>Esc</kbd> to cancel
                  </span>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={cancelEditingNotes}
                      disabled={savingNotes}
                    >
                      <X size={15} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={saveNotes}
                      disabled={savingNotes || notesDraft === (meeting.notes || "")}
                    >
                      {savingNotes ? <Spinner size={14} /> : <Save size={15} />}
                      {savingNotes ? "Saving…" : "Save notes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : meeting.notes ? (
              <div className="prose">{meeting.notes}</div>
            ) : (
              <button type="button" className="notes-placeholder" onClick={startEditingNotes}>
                <FileText size={18} />
                No notes yet. Click to add notes or paste a transcript.
              </button>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>
                  <MessageSquarePlus size={18} />
                  Added after the meeting
                </h2>
                <p>
                  Remembered something later? Add it here. The original notes stay
                  unchanged, and these points are included when you analyze with AI.
                </p>
              </div>
            </div>

            {followUps.length > 0 && (
              <ol className="timeline">
                {[...followUps].reverse().map((item) => (
                  <li className="timeline-item" key={item._id}>
                    <span className="timeline-dot" />
                    <div className="timeline-content">
                      <p>{item.text}</p>
                      <small>Added {formatDateTime(item.createdAt)}</small>
                    </div>
                    <button
                      type="button"
                      className="icon-button ghost danger"
                      aria-label="Remove point"
                      data-tooltip="Remove"
                      onClick={() => setDialog({ type: "delete-followup", item })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <form className="followup-form" onSubmit={handleAddFollowUp}>
              <textarea
                value={followUpText}
                onChange={(event) => setFollowUpText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    handleAddFollowUp(event);
                  }
                }}
                rows={2}
                maxLength={5000}
                placeholder="e.g. Forgot to mention: legal needs to review the cookie banner."
              />
              <button
                type="submit"
                className="primary-button"
                disabled={addingFollowUp || !followUpText.trim()}
              >
                {addingFollowUp ? <Spinner size={14} /> : <Plus size={16} />}
                Add point
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ---------------- Decisions ---------------- */}
      {tab === "decisions" && (
        <section className="page-stack">
          <div className="section-head">
            <div>
              <h2>Decisions</h2>
              <p>What the group agreed on. Approve or reject proposals.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDialog({ type: "decision" })}
            >
              <Plus size={16} />
              Add decision
            </button>
          </div>

          {decisions.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No decisions yet"
              description="Record what was decided, or run AI analysis to find decisions in your notes."
              action={
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDialog({ type: "decision" })}
                >
                  <Plus size={16} />
                  Add decision
                </button>
              }
            />
          ) : (
            <div className="list">
              {decisions.map((decision) => (
                <div className="list-item" key={decision._id}>
                  <span className={`list-item-icon tone-${decision.status}`}>
                    <GitBranch size={16} />
                  </span>
                  <div className="list-item-body">
                    <strong>{decision.title}</strong>
                    {decision.description && <p>{decision.description}</p>}
                  </div>
                  <div className="list-item-meta">
                    <StatusBadge status={decision.status} />
                    {decision.status === "proposed" && (
                      <>
                        <button
                          type="button"
                          className="icon-button ghost success"
                          data-tooltip="Approve"
                          aria-label="Approve"
                          onClick={() => handleDecisionStatus(decision._id, "approved")}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button ghost danger"
                          data-tooltip="Reject"
                          aria-label="Reject"
                          onClick={() => handleDecisionStatus(decision._id, "rejected")}
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <RowActions
                      onEdit={() => setDialog({ type: "decision", item: decision })}
                      onDelete={() => setDialog({ type: "delete-decision", item: decision })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------------- Action items ---------------- */}
      {tab === "actions" && (
        <section className="page-stack">
          <div className="section-head">
            <div>
              <h2>Action items</h2>
              <p>Tasks agreed in this meeting. Tick them off as they are done.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDialog({ type: "action" })}
            >
              <Plus size={16} />
              Add action item
            </button>
          </div>

          {actionItems.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No action items yet"
              description="Add tasks that came out of this meeting so nothing falls through the cracks."
              action={
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDialog({ type: "action" })}
                >
                  <Plus size={16} />
                  Add action item
                </button>
              }
            />
          ) : (
            <div className="list">
              {actionItems.map((item) => {
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
                      onClick={() => handleActionStatus(item._id, done ? "todo" : "completed")}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                    <div className="list-item-body">
                      <strong>{item.title}</strong>
                      {item.description && <p>{item.description}</p>}
                      {item.dueDate && (
                        <small className={overdue ? "text-danger" : ""}>
                          {done ? `Due ${formatDate(item.dueDate)}` : relativeDue(item.dueDate)}
                        </small>
                      )}
                    </div>
                    <div className="list-item-meta">
                      <StatusBadge status={item.priority} />
                      <select
                        className="select-compact"
                        value={item.status}
                        aria-label="Status"
                        onChange={(event) => handleActionStatus(item._id, event.target.value)}
                      >
                        {ACTION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_TEXT[status]}
                          </option>
                        ))}
                      </select>
                      <RowActions
                        onEdit={() => setDialog({ type: "action", item })}
                        onDelete={() => setDialog({ type: "delete-action", item })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ---------------- AI analysis ---------------- */}
      {tab === "analysis" && analysis && (
        <div className="page-stack">
          <section className="card card-accent">
            <div className="card-head">
              <div>
                <h2>
                  <Sparkles size={18} />
                  Summary
                </h2>
              </div>
            </div>
            <p className="lead">{analysis.summary}</p>

            {analysis.key_points?.length > 0 && (
              <ul className="bullet-list">
                {analysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            )}
          </section>

          <SuggestionList
            title="Suggested decisions"
            icon={Lightbulb}
            items={analysis.decisions}
            kind="decision"
            added={added}
            onAdd={addSuggestion}
            empty="No decisions were detected in the notes."
          />

          <SuggestionList
            title="Suggested action items"
            icon={ListTodo}
            items={analysis.action_items}
            kind="action"
            added={added}
            onAdd={addSuggestion}
            empty="No action items were detected in the notes."
          />

          {analysis.unresolved_questions?.length > 0 && (
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>
                    <HelpCircle size={18} />
                    Open questions
                  </h2>
                  <p>Raised in the meeting but not answered.</p>
                </div>
              </div>
              <ul className="bullet-list">
                {analysis.unresolved_questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ---------------- Dialogs ---------------- */}
      {dialog?.type === "meeting" && (
        <MeetingFormModal
          initial={meeting}
          projects={projects}
          onSubmit={handleSaveMeeting}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete-meeting" && (
        <ConfirmModal
          title="Delete meeting?"
          message={`“${meeting.title}” and its ${decisions.length} decisions and ${actionItems.length} action items will be permanently deleted.`}
          confirmLabel="Delete meeting"
          onConfirm={handleDeleteMeeting}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "decision" && (
        <DecisionFormModal
          initial={dialog.item}
          onSubmit={(values) => saveDecision(values, dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete-decision" && (
        <ConfirmModal
          title="Delete decision?"
          message={`“${dialog.item.title}” will be permanently deleted.`}
          onConfirm={() => removeDecision(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "action" && (
        <ActionItemFormModal
          initial={dialog.item}
          onSubmit={(values) => saveActionItem(values, dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete-action" && (
        <ConfirmModal
          title="Delete action item?"
          message={`“${dialog.item.title}” will be permanently deleted.`}
          onConfirm={() => removeActionItem(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete-followup" && (
        <ConfirmModal
          title="Remove this point?"
          message="It will be removed from the meeting record."
          confirmLabel="Remove"
          onConfirm={() => handleRemoveFollowUp(dialog.item._id)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <span className="row-actions">
      <button
        type="button"
        className="icon-button ghost"
        aria-label="Edit"
        data-tooltip="Edit"
        onClick={onEdit}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="icon-button ghost danger"
        aria-label="Delete"
        data-tooltip="Delete"
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </span>
  );
}

function SuggestionList({ title, icon: Icon, items = [], kind, added, onAdd, empty }) {
  return (
    <section className="page-stack">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>Review each suggestion and add the ones that are accurate.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="hint">{empty}</p>
      ) : (
        <div className="list">
          {items.map((item, index) => {
            const state = added[`${kind}-${index}`];

            return (
              <div className={`list-item ${state === "done" ? "is-added" : ""}`} key={index}>
                <span className="list-item-icon">
                  <Icon size={16} />
                </span>
                <div className="list-item-body">
                  <strong>{item.title}</strong>
                  {item.description && <p>{item.description}</p>}
                  {(item.assignee_name || item.due_date) && (
                    <small>
                      {[item.assignee_name, item.due_date && `Due ${formatDate(item.due_date)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  )}
                </div>
                <div className="list-item-meta">
                  {item.priority && <StatusBadge status={item.priority} />}
                  {state === "done" ? (
                    <span className="added-label">
                      <Check size={14} />
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={state === "saving"}
                      onClick={() => onAdd(kind, item, index)}
                    >
                      {state === "saving" ? <Spinner size={14} /> : <Plus size={15} />}
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
