import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Map,
  GanttChartSquare,
  Columns3,
  Upload,
  Sparkles,
  Flag,
  CircleDashed,
} from "lucide-react";

import { getProject } from "../services/meetingService";
import { getProjectRoadmap } from "../services/planningService";
import { getErrorMessage } from "../services/api";
import { formatDate, toDate, labelOf, isOverdue, idOf } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const DAY = 24 * 60 * 60 * 1000;
const UNGROUPED = "__none__";
const VIEW_KEY = "meetflow_roadmap_view";

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// Group tasks under milestones (in milestone order) plus an "Other" lane.
function buildLanes(milestones, tasks) {
  const ordered = [...milestones].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.dueDate) - new Date(b.dueDate)
  );
  const known = new Set(ordered.map((m) => m._id));

  const lanes = ordered.map((milestone) => ({
    id: milestone._id,
    milestone,
    title: milestone.title,
    dueDate: milestone.dueDate,
    tasks: tasks.filter((t) => idOf(t.milestoneId) === milestone._id),
  }));

  const other = tasks.filter((t) => !known.has(idOf(t.milestoneId)));
  if (other.length) {
    lanes.push({ id: UNGROUPED, title: "Not in a milestone", tasks: other });
  }

  // Soonest due first; undated tasks keep their order at the end.
  const byDue = (a, b) =>
    (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
    (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);

  return lanes.map((lane) => {
    lane.tasks.sort(byDue);
    const active = lane.tasks.filter((t) => t.status !== "cancelled");
    const done = active.filter((t) => t.status === "completed").length;
    return {
      ...lane,
      done,
      total: active.length,
      percent: active.length ? Math.round((done / active.length) * 100) : 0,
    };
  });
}

// Bar span for a task: explicit start, else a duration from its estimate
// (8 h per day, minimum 1 day) ending on the due date.
function taskSpan(task) {
  const due = toDate(task.dueDate);
  if (!due) return null;

  const end = dayStart(due) + DAY;
  const start = task.startDate
    ? dayStart(toDate(task.startDate))
    : end - Math.max(1, Math.ceil((task.estimatedHours || 8) / 8)) * DAY;

  return { start: Math.min(start, end - DAY), end };
}

function Timeline({ lanes }) {
  const { min, max, months } = useMemo(() => {
    const points = [dayStart(new Date())];

    for (const lane of lanes) {
      if (lane.dueDate) points.push(dayStart(toDate(lane.dueDate)) + DAY);
      for (const task of lane.tasks) {
        const span = taskSpan(task);
        if (span) points.push(span.start, span.end);
      }
    }

    // Pad a few days either side so markers never sit on the edge.
    const lo = Math.min(...points) - 3 * DAY;
    const hi = Math.max(...points) + 3 * DAY;

    const ticks = [];
    const cursor = new Date(lo);
    cursor.setDate(1);
    while (cursor.getTime() <= hi) {
      if (cursor.getTime() >= lo) ticks.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { min: lo, max: hi, months: ticks };
  }, [lanes]);

  const pct = (time) => `${((time - min) / (max - min)) * 100}%`;
  const today = dayStart(new Date());

  return (
    <div className="gantt">
      <div className="gantt-scroll">
        <div className="gantt-inner">
          <div className="gantt-header">
            <div className="gantt-label-col">Milestone / task</div>
            <div className="gantt-track">
              {months.map((month) => (
                <span className="gantt-month" key={month.toISOString()} style={{ left: pct(month.getTime()) }}>
                  {month.toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
                </span>
              ))}
            </div>
          </div>

          <div className="gantt-body">
            <div className="gantt-grid" aria-hidden="true">
              <div className="gantt-label-col" />
              <div className="gantt-track">
                {months.map((month) => (
                  <span className="gantt-gridline" key={month.toISOString()} style={{ left: pct(month.getTime()) }} />
                ))}
                <span className="gantt-today" style={{ left: pct(today + DAY / 2) }}>
                  <em>Today</em>
                </span>
              </div>
            </div>

            {lanes.map((lane) => {
              const undated = lane.tasks.filter((t) => !t.dueDate).length;

              return (
                <div className="gantt-lane" key={lane.id}>
                  <div className="gantt-row gantt-milestone-row">
                    <div className="gantt-label-col">
                      <Flag size={14} />
                      <strong>{lane.title}</strong>
                      <span className="gantt-pct">{lane.percent}%</span>
                    </div>
                    <div className="gantt-track">
                      {lane.dueDate && (
                        <span
                          className={`gantt-diamond ${lane.percent === 100 ? "done" : ""}`}
                          style={{ left: pct(dayStart(toDate(lane.dueDate)) + DAY / 2) }}
                          title={`${lane.title} · due ${formatDate(lane.dueDate)}`}
                        />
                      )}
                    </div>
                  </div>

                  {lane.tasks
                    .filter((t) => t.dueDate)
                    .sort((a, b) => taskSpan(a).start - taskSpan(b).start)
                    .map((task) => {
                      const span = taskSpan(task);
                      const late = isOverdue(task.dueDate, task.status);

                      return (
                        <div className="gantt-row" key={task._id}>
                          <div className="gantt-label-col gantt-task-label" title={task.title}>
                            <span className={`status-dot s-${task.status}`} />
                            {task.title}
                          </div>
                          <div className="gantt-track">
                            <span
                              className={`gantt-bar s-${task.status} ${late ? "late" : ""}`}
                              style={{ left: pct(span.start), width: `calc(${pct(span.end)} - ${pct(span.start)})` }}
                              title={`${task.title}\n${labelOf(task.status)} · due ${formatDate(task.dueDate)}`}
                            />
                          </div>
                        </div>
                      );
                    })}

                  {undated > 0 && (
                    <div className="gantt-row gantt-undated">
                      <div className="gantt-label-col">
                        <CircleDashed size={13} />
                        {undated} task{undated === 1 ? "" : "s"} without a due date
                      </div>
                      <div className="gantt-track" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="gantt-legend">
        {["todo", "in_progress", "blocked", "completed"].map((status) => (
          <span key={status}>
            <i className={`status-dot s-${status}`} />
            {labelOf(status)}
          </span>
        ))}
        <span>
          <i className="gantt-diamond legend" />
          Milestone due
        </span>
      </div>
    </div>
  );
}

function MilestoneBoard({ lanes }) {
  return (
    <div className="milestone-board">
      {lanes.map((lane, index) => (
        <section className="milestone-lane" key={lane.id}>
          <header className="milestone-lane-head">
            <span className="milestone-step">{lane.id === UNGROUPED ? "–" : index + 1}</span>
            <div>
              <strong>{lane.title}</strong>
              <small>
                {lane.dueDate ? `Due ${formatDate(lane.dueDate)}` : "No due date"} · {lane.done}/{lane.total} done
              </small>
            </div>
            <span
              className="ring"
              style={{ "--p": lane.percent }}
              aria-label={`${lane.percent}% complete`}
            >
              {lane.percent}%
            </span>
          </header>

          {lane.milestone?.description && <p className="milestone-lane-desc">{lane.milestone.description}</p>}

          <ul className="milestone-tasks">
            {lane.tasks.length === 0 && <li className="hint">No tasks in this milestone.</li>}
            {lane.tasks.map((task) => (
              <li key={task._id} className={task.status === "completed" ? "is-done" : ""}>
                <span className={`status-dot s-${task.status}`} title={labelOf(task.status)} />
                <span className="milestone-task-title">{task.title}</span>
                {task.dueDate && (
                  <small className={isOverdue(task.dueDate, task.status) ? "text-danger" : ""}>
                    {formatDate(task.dueDate)}
                  </small>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function ProjectRoadmap() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [data, setData] = useState({ milestones: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || "timeline";
    } catch {
      return "timeline";
    }
  });

  useEffect(() => {
    let active = true;

    Promise.all([getProject(projectId), getProjectRoadmap(projectId)])
      .then(([projectData, roadmap]) => {
        if (!active) return;
        setProject(projectData);
        setData(roadmap);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [projectId]);

  function chooseView(next) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not remembered.
    }
  }

  const lanes = useMemo(() => buildLanes(data.milestones, data.tasks), [data]);
  const active = data.tasks.filter((t) => t.status !== "cancelled");
  const done = active.filter((t) => t.status === "completed").length;
  const percent = active.length ? Math.round((done / active.length) * 100) : 0;
  const lastDue = [...data.milestones.map((m) => m.dueDate), ...data.tasks.map((t) => t.dueDate)]
    .filter(Boolean)
    .sort()
    .pop();

  if (loading) {
    return <Loading text="Loading roadmap…" variant="detail" />;
  }

  return (
    <div className="page-stack">
      <Link to={`/projects/${projectId}`} className="back-link">
        <ArrowLeft size={15} />
        Back to project
      </Link>

      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">{project?.name || "Project"}</span>
          <h1>Roadmap</h1>
          <p>Every milestone and its tasks, laid out over time.</p>
        </div>
        <div className="page-actions">
          <Link to={`/projects/${projectId}/plan?mode=document`} className="secondary-button">
            <Upload size={15} />
            Import document
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {data.tasks.length === 0 && data.milestones.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Nothing on the roadmap yet"
          description="Upload a project document or generate a plan with AI, approve it, and it appears here milestone by milestone."
          action={
            <div className="empty-actions">
              <Link to={`/projects/${projectId}/plan?mode=document`} className="primary-button">
                <Upload size={16} />
                Upload a document
              </Link>
              <Link to={`/projects/${projectId}/plan`} className="secondary-button">
                <Sparkles size={16} />
                Describe the project
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <section className="summary-strip">
            <div>
              <span>Milestones</span>
              <strong>{data.milestones.length}</strong>
            </div>
            <div>
              <span>Tasks</span>
              <strong>{active.length}</strong>
            </div>
            <div>
              <span>Complete</span>
              <strong>{percent}%</strong>
            </div>
            <div>
              <span>Finishes</span>
              <strong>{lastDue ? formatDate(lastDue) : "—"}</strong>
            </div>
          </section>

          <div className="toolbar">
            <div className="segmented" role="tablist" aria-label="Roadmap view">
              <button
                type="button"
                role="tab"
                aria-selected={view === "timeline"}
                className={view === "timeline" ? "active" : ""}
                onClick={() => chooseView("timeline")}
              >
                <GanttChartSquare size={15} />
                Timeline
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "milestones"}
                className={view === "milestones" ? "active" : ""}
                onClick={() => chooseView("milestones")}
              >
                <Columns3 size={15} />
                Milestones
              </button>
            </div>
          </div>

          {view === "timeline" ? <Timeline lanes={lanes} /> : <MilestoneBoard lanes={lanes} />}
        </>
      )}
    </div>
  );
}
