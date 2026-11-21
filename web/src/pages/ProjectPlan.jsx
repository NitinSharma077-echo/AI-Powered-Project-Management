import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Upload,
  FileText,
  PenLine,
  Map,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Flag,
  ListChecks,
  GitBranch,
  Clock,
  AlertTriangle,
  HelpCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import {
  generateProjectPlan,
  generatePlanFromDocument,
  approveProjectPlan,
} from "../services/planningService";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { Spinner } from "../components/Loading";
import { getProject } from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import StatusBadge from "../components/StatusBadge";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".csv"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const UNASSIGNED = "__unassigned__";

function formatDate(value) {
  if (!value) return null;

  // Plan dates arrive as "YYYY-MM-DD"; parse as local time so the day
  // shown matches the day the AI produced (no UTC off-by-one).
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatHours(hours) {
  if (!hours) return "0 h";
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export default function ProjectPlan() {
  const { projectId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("mode") === "document" ? "document" : "brief"
  );
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docInfo, setDocInfo] = useState(null);
  const fileInputRef = useRef(null);

  const [projectName, setProjectName] = useState("");
  const [brief, setBrief] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getProject(projectId)
      .then((project) => {
        if (!cancelled) setProjectName(project?.name || "");
      })
      .catch(() => {
        // The header falls back to a generic title; generation still works.
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const taskByRef = useMemo(() => {
    const map = {};
    for (const task of plan?.tasks || []) map[task.ref] = task;
    return map;
  }, [plan]);

  const stats = useMemo(() => {
    if (!plan) return null;

    const totalHours = plan.tasks.reduce(
      (sum, task) => sum + (Number(task.estimated_hours) || 0),
      0
    );

    const dates = [...plan.tasks, ...plan.milestones]
      .map((item) => item.due_date)
      .filter(Boolean)
      .sort();

    return {
      totalHours,
      finishDate: dates.length ? dates[dates.length - 1] : null,
    };
  }, [plan]);

  // Tasks grouped under their milestone, keeping each task's index in
  // plan.tasks so edits still target the right item.
  const taskGroups = useMemo(() => {
    if (!plan) return [];

    const milestoneRefs = new Set(plan.milestones.map((m) => m.ref));
    const groups = plan.milestones.map((milestone) => ({
      key: milestone.ref,
      title: milestone.title,
      dueDate: milestone.due_date,
      items: [],
    }));
    const unassigned = {
      key: UNASSIGNED,
      title: "Not linked to a milestone",
      items: [],
    };

    plan.tasks.forEach((task, index) => {
      const ref = milestoneRefs.has(task.milestone_ref)
        ? task.milestone_ref
        : null;
      const group = ref ? groups.find((g) => g.key === ref) : unassigned;
      group.items.push({ task, index });
    });

    return [...groups, unassigned].filter((group) => group.items.length > 0);
  }, [plan]);

  const invalidTaskCount = plan
    ? plan.tasks.filter((task) => !task.title?.trim()).length
    : 0;

  function chooseMode(next) {
    setMode(next);
    setError("");
    setSearchParams(next === "document" ? { mode: "document" } : {}, { replace: true });
  }

  function pickFile(candidate) {
    setError("");
    if (!candidate) return;

    const extension = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(`Unsupported file type. Upload one of: ${ACCEPTED_EXTENSIONS.join(", ")}.`);
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError("The document must be 10 MB or smaller.");
      return;
    }
    setFile(candidate);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (mode === "document" && !file) {
      setError("Choose a document to upload.");
      return;
    }

    setLoading(true);
    setError("");
    setSaved(null);
    setPlan(null);
    setDocInfo(null);
    setUploadProgress(0);

    try {
      let result;

      if (mode === "document") {
        const response = await generatePlanFromDocument(
          projectId,
          file,
          targetDate,
          setUploadProgress
        );
        result = response.plan;
        setDocInfo(response.document);
      } else {
        result = await generateProjectPlan(projectId, brief, targetDate);
      }

      setPlan({
        summary: result.summary || "",
        milestones: result.milestones || [],
        tasks: result.tasks || [],
        dependencies: result.dependencies || [],
        risks: result.risks || [],
        unresolved_questions: result.unresolved_questions || [],
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateTask(index, field, value) {
    setPlan((current) => {
      const tasks = [...current.tasks];
      tasks[index] = { ...tasks[index], [field]: value };
      return { ...current, tasks };
    });
  }

  function updateMilestone(index, field, value) {
    setPlan((current) => {
      const milestones = [...current.milestones];
      milestones[index] = { ...milestones[index], [field]: value };
      return { ...current, milestones };
    });
  }

  function removeTask(index) {
    setPlan((current) => {
      const removedRef = current.tasks[index].ref;

      return {
        ...current,
        tasks: current.tasks.filter((_, i) => i !== index),
        // Drop dependencies that point at the removed task.
        dependencies: current.dependencies.filter(
          (item) =>
            item.predecessor_ref !== removedRef &&
            item.successor_ref !== removedRef
        ),
      };
    });
  }

  function removeMilestone(index) {
    setPlan((current) => {
      const removedRef = current.milestones[index].ref;

      return {
        ...current,
        milestones: current.milestones.filter((_, i) => i !== index),
        // Keep the tasks, just unlink them from the removed milestone.
        tasks: current.tasks.map((task) =>
          task.milestone_ref === removedRef
            ? { ...task, milestone_ref: null }
            : task
        ),
      };
    });
  }

  function removeDependency(index) {
    setPlan((current) => ({
      ...current,
      dependencies: current.dependencies.filter((_, i) => i !== index),
    }));
  }

  function discardPlan() {
    if (!window.confirm("Discard this draft plan? Your edits will be lost.")) {
      return;
    }
    setPlan(null);
    setError("");
  }

  async function handleApprove() {
    if (!plan || plan.tasks.length === 0) {
      setError("The plan must contain at least one task.");
      return;
    }

    if (invalidTaskCount > 0) {
      setError(
        `${invalidTaskCount} task${invalidTaskCount === 1 ? " is" : "s are"} missing a title.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Save ${plan.milestones.length} milestones, ${plan.tasks.length} tasks ` +
        `and ${plan.dependencies.length} dependencies to this project?`
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const result = await approveProjectPlan(projectId, plan);
      setSaved(result.data);
      setPlan(null);
      setBrief("");
      setTargetDate("");
      setFile(null);
      setDocInfo(null);
      invalidateWorkspace();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="project-plan-page">
      <Link to={`/projects/${projectId}`} className="back-link">
        <ArrowLeft size={15} />
        Back to project
      </Link>

      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">{projectName || "Project"}</span>
          <h1>AI planner</h1>
          <p>
            Describe the project or upload a document. Review the draft, then
            approve it to create milestones, tasks and dependencies.
          </p>
        </div>
      </header>

      {!plan && (
        <form className="card form-grid" onSubmit={handleGenerate}>
          <div className="segmented full" role="tablist" aria-label="Plan source">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "brief"}
              className={mode === "brief" ? "active" : ""}
              onClick={() => chooseMode("brief")}
            >
              <PenLine size={15} />
              Describe the project
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "document"}
              className={mode === "document" ? "active" : ""}
              onClick={() => chooseMode("document")}
            >
              <Upload size={15} />
              Upload a document
            </button>
          </div>

          {mode === "brief" ? (
            <label className="field-label">
              Project brief
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="Goals, requirements, technology, deliverables and constraints…"
                rows={8}
                minLength={20}
                maxLength={20000}
                required
              />
              <span className="field-help">
                {brief.trim().length < 20
                  ? `${20 - brief.trim().length} more characters needed`
                  : `${brief.length.toLocaleString()} / 20,000 characters`}
              </span>
            </label>
          ) : (
            <div className="field-label">
              Project document
              <div
                className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !file) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  hidden
                  onChange={(event) => {
                    pickFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />

                {file ? (
                  <div className="file-chip">
                    <span className="file-chip-icon">
                      <FileText size={20} />
                    </span>
                    <span className="file-chip-text">
                      <strong>{file.name}</strong>
                      <small>{formatBytes(file.size)}</small>
                    </span>
                    <button
                      type="button"
                      className="icon-button ghost"
                      aria-label="Remove file"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFile(null);
                      }}
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="dropzone-icon">
                      <Upload size={22} />
                    </span>
                    <strong>Drop a file here or click to browse</strong>
                    <small>PDF, Word (.docx), TXT, Markdown or CSV · up to 10 MB</small>
                  </>
                )}
              </div>
              <span className="field-help">
                The AI reads the items your document lists and groups them by
                its own phases or milestones. It doesn’t invent extra work.
              </span>
            </div>
          )}

          <div className="form-row">
            <label className="field-label">
              Target completion date <span className="field-optional">optional</span>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
          </div>

          {loading && (
            <div className="progress-note" role="status">
              <Spinner size={16} />
              <span>
                {mode === "document" && uploadProgress < 100
                  ? `Uploading… ${uploadProgress}%`
                  : mode === "document"
                    ? "Reading the document and building the plan. This can take up to a minute…"
                    : "Generating your plan. This can take up to a minute…"}
              </span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading || (mode === "document" ? !file : brief.trim().length < 20)}
            >
              {loading ? <Spinner size={15} /> : <Sparkles size={16} />}
              {loading
                ? "Working…"
                : mode === "document"
                  ? "Build plan from document"
                  : "Generate plan"}
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {saved && (
        <div className="alert alert-success plan-saved">
          <CheckCircle2 size={16} />
          <span>
            Plan saved: {saved.milestoneCount} milestones, {saved.taskCount}{" "}
            tasks and {saved.dependencyCount} dependencies.
          </span>
          <span className="plan-saved-links">
            <Link to={`/projects/${projectId}/roadmap`} className="text-link">
              <Map size={14} />
              View roadmap
            </Link>
            <Link to={`/projects/${projectId}/tasks`} className="text-link">
              Open task board
              <ArrowRight size={14} />
            </Link>
          </span>
        </div>
      )}

      {plan && (
        <section className="plan-review">
          <div className="detail-card plan-summary">
            <div className="plan-summary-head">
              <h2>Plan summary</h2>
              <span className="badge badge-proposed">Draft · not saved</span>
            </div>
            <p>{plan.summary || "No summary was provided."}</p>

            {docInfo && (
              <p className="form-hint plan-source">
                <FileText size={13} />
                Built from <strong>{docInfo.name}</strong>
                {docInfo.truncated &&
                  " · the document was long, so only the first 60,000 characters were read"}
              </p>
            )}

            <div className="plan-stats">
              <div className="plan-stat">
                <Flag size={16} />
                <strong>{plan.milestones.length}</strong>
                <span>Milestones</span>
              </div>
              <div className="plan-stat">
                <ListChecks size={16} />
                <strong>{plan.tasks.length}</strong>
                <span>Tasks</span>
              </div>
              <div className="plan-stat">
                <GitBranch size={16} />
                <strong>{plan.dependencies.length}</strong>
                <span>Dependencies</span>
              </div>
              <div className="plan-stat">
                <Clock size={16} />
                <strong>{formatHours(stats.totalHours)}</strong>
                <span>Estimated effort</span>
              </div>
            </div>

            {stats.finishDate && (
              <p className="form-hint plan-finish">
                Last due date in plan: {formatDate(stats.finishDate)}
                {targetDate && stats.finishDate > targetDate && (
                  <strong className="plan-warning">
                    {" "}
                    · after your target of {formatDate(targetDate)}
                  </strong>
                )}
              </p>
            )}
          </div>

          {/* ---------- Milestones ---------- */}
          <div className="section-heading">
            <div>
              <h2>Milestones</h2>
              <p>Major checkpoints. Edit or remove any that are inaccurate.</p>
            </div>
          </div>

          {plan.milestones.length === 0 ? (
            <p className="form-hint plan-empty">No milestones were suggested.</p>
          ) : (
            <div className="plan-list">
              {plan.milestones.map((milestone, index) => (
                <div className="plan-item" key={milestone.ref}>
                  <div className="plan-item-head">
                    <span className="plan-ref">{milestone.ref}</span>
                    <button
                      type="button"
                      className="icon-button"
                      title="Remove milestone"
                      aria-label="Remove milestone"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="plan-item-grid">
                    <label className="field-label plan-span-2">
                      Title
                      <input
                        value={milestone.title}
                        onChange={(event) =>
                          updateMilestone(index, "title", event.target.value)
                        }
                      />
                    </label>
                    <label className="field-label">
                      Due date
                      <input
                        type="date"
                        value={milestone.due_date || ""}
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "due_date",
                            event.target.value || null
                          )
                        }
                      />
                    </label>
                    <label className="field-label plan-span-full">
                      Description
                      <textarea
                        rows={2}
                        value={milestone.description || ""}
                        onChange={(event) =>
                          updateMilestone(index, "description", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---------- Tasks ---------- */}
          <div className="section-heading">
            <div>
              <h2>Tasks</h2>
              <p>Grouped by milestone. Every task is created as “To do”.</p>
            </div>
          </div>

          {plan.tasks.length === 0 ? (
            <p className="form-hint plan-empty">
              All tasks were removed. Add at least one task back by generating a
              new plan.
            </p>
          ) : (
            taskGroups.map((group) => (
              <div className="plan-group" key={group.key}>
                <div className="plan-group-head">
                  <h3>{group.title}</h3>
                  <span>
                    {group.items.length} task{group.items.length === 1 ? "" : "s"}
                    {group.dueDate ? ` · due ${formatDate(group.dueDate)}` : ""}
                  </span>
                </div>

                <div className="plan-list">
                  {group.items.map(({ task, index }) => (
                    <div
                      className={`plan-item ${!task.title?.trim() ? "plan-item-invalid" : ""}`}
                      key={task.ref}
                    >
                      <div className="plan-item-head">
                        <span className="plan-ref">{task.ref}</span>
                        <StatusBadge status={task.priority} />
                        <button
                          type="button"
                          className="icon-button"
                          title="Remove task"
                          aria-label="Remove task"
                          onClick={() => removeTask(index)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="plan-item-grid">
                        <label className="field-label plan-span-full">
                          Title
                          <input
                            value={task.title}
                            onChange={(event) =>
                              updateTask(index, "title", event.target.value)
                            }
                            maxLength={200}
                          />
                        </label>

                        <label className="field-label plan-span-full">
                          Description
                          <textarea
                            rows={2}
                            value={task.description || ""}
                            onChange={(event) =>
                              updateTask(index, "description", event.target.value)
                            }
                          />
                        </label>

                        <label className="field-label">
                          Priority
                          <select
                            value={task.priority}
                            onChange={(event) =>
                              updateTask(index, "priority", event.target.value)
                            }
                          >
                            {PRIORITIES.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority[0].toUpperCase() + priority.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field-label">
                          Estimate (hours)
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={task.estimated_hours ?? ""}
                            onChange={(event) =>
                              updateTask(
                                index,
                                "estimated_hours",
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value)
                              )
                            }
                          />
                        </label>

                        <label className="field-label">
                          Due date
                          <input
                            type="date"
                            value={task.due_date || ""}
                            onChange={(event) =>
                              updateTask(
                                index,
                                "due_date",
                                event.target.value || null
                              )
                            }
                          />
                        </label>

                        <label className="field-label">
                          Milestone
                          <select
                            value={task.milestone_ref || ""}
                            onChange={(event) =>
                              updateTask(
                                index,
                                "milestone_ref",
                                event.target.value || null
                              )
                            }
                          >
                            <option value="">No milestone</option>
                            {plan.milestones.map((milestone) => (
                              <option key={milestone.ref} value={milestone.ref}>
                                {milestone.title || milestone.ref}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* ---------- Dependencies ---------- */}
          <div className="section-heading">
            <div>
              <h2>Dependencies</h2>
              <p>The first task must finish before the second can start.</p>
            </div>
          </div>

          {plan.dependencies.length === 0 ? (
            <p className="form-hint plan-empty">No dependencies were suggested.</p>
          ) : (
            <div className="list-rows plan-list">
              {plan.dependencies.map((dependency, index) => {
                const from = taskByRef[dependency.predecessor_ref];
                const to = taskByRef[dependency.successor_ref];

                return (
                  <div
                    className="list-row"
                    key={`${dependency.predecessor_ref}-${dependency.successor_ref}-${index}`}
                  >
                    <div className="list-row-icon">
                      <GitBranch size={16} />
                    </div>
                    <div className="list-row-info">
                      <strong className="plan-dependency">
                        <span>{from?.title || dependency.predecessor_ref}</span>
                        <ArrowRight size={14} />
                        <span>{to?.title || dependency.successor_ref}</span>
                      </strong>
                      {dependency.description && (
                        <small>{dependency.description}</small>
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      title="Remove dependency"
                      aria-label="Remove dependency"
                      onClick={() => removeDependency(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- Risks & questions ---------- */}
          <div className="plan-notes">
            <div className="detail-card">
              <h2 className="plan-note-title">
                <AlertTriangle size={17} />
                Risks
              </h2>
              {plan.risks.length > 0 ? (
                <ul>
                  {plan.risks.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="form-hint">No risks identified.</p>
              )}
            </div>

            <div className="detail-card">
              <h2 className="plan-note-title">
                <HelpCircle size={17} />
                Open questions
              </h2>
              {plan.unresolved_questions.length > 0 ? (
                <ul>
                  {plan.unresolved_questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              ) : (
                <p className="form-hint">No open questions.</p>
              )}
            </div>
          </div>

          <div className="plan-approval">
            <p className="form-hint">
              Nothing is saved until you approve. Saving creates{" "}
              {plan.milestones.length} milestones, {plan.tasks.length} tasks and{" "}
              {plan.dependencies.length} dependencies.
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={discardPlan}
                disabled={saving}
              >
                Discard draft
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleApprove}
                disabled={saving || plan.tasks.length === 0}
              >
                <CheckCircle2 size={17} />
                {saving ? "Saving..." : "Approve and save"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
