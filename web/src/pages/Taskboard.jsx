import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Clock, Flag, KanbanSquare, Sparkles } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { getProject } from "../services/meetingService";
import { relativeDue, isOverdue, formatDate, idOf } from "../utils/format";

import Loading, { Spinner } from "../components/Loading";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "blocked", title: "Blocked" },
  { id: "completed", title: "Done" },
];

export default function TaskBoard() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [error, setError] = useState("");

  async function loadTasks() {
    const [taskRes, milestoneRes] = await Promise.all([
      api.get(`/projects/${projectId}/tasks`),
      api.get(`/projects/${projectId}/milestones`).catch(() => ({ data: { data: [] } })),
    ]);
    setTasks(taskRes.data.data || []);
    setMilestones(milestoneRes.data.data || []);
  }

  useEffect(() => {
    let active = true;

    Promise.all([loadTasks(), getProject(projectId).then((p) => active && setProject(p)).catch(() => {})])
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // loadTasks only depends on projectId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  // Optimistic: move the card immediately, roll back if the save fails.
  async function changeStatus(task, status) {
    const previous = task.status;
    setUpdatingTask(task._id);
    setError("");
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));

    try {
      const response = await api.patch(`/tasks/${task._id}/status`, { status });
      const saved = response.data?.data;
      if (saved) setTasks((prev) => prev.map((t) => (t._id === task._id ? saved : t)));
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: previous } : t)));
      setError(getErrorMessage(err));
    } finally {
      setUpdatingTask(null);
    }
  }

  const milestoneName = useMemo(
    () => Object.fromEntries(milestones.map((m) => [m._id, m.title])),
    [milestones]
  );

  const active = tasks.filter((t) => t.status !== "cancelled");
  const done = active.filter((t) => t.status === "completed").length;
  const percent = active.length ? Math.round((done / active.length) * 100) : 0;

  if (loading) {
    return <Loading text="Loading task board…" variant="board" />;
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
          <h1>Task board</h1>
          <p>
            {done} of {active.length} tasks done · {percent}% complete
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Spinner size={14} /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </header>

      <div className="progress-track">
        <div className="progress-value" style={{ width: `${percent}%` }} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tasks.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="No tasks yet"
          description="Generate a plan with AI or import a document to fill the board."
          action={
            <Link to={`/projects/${projectId}/plan`} className="primary-button">
              <Sparkles size={16} />
              Open AI planner
            </Link>
          }
        />
      ) : (
        <div className="kanban-board">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);

            return (
              <section className={`kanban-column col-${column.id}`} key={column.id}>
                <div className="kanban-column-heading">
                  <span className="kanban-dot" />
                  <h2>{column.title}</h2>
                  <span className="kanban-count">{columnTasks.length}</span>
                </div>

                {columnTasks.length === 0 && <p className="kanban-empty">No tasks</p>}

                {columnTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);

                  return (
                    <article
                      className={`kanban-card ${updatingTask === task._id ? "is-saving" : ""}`}
                      key={task._id}
                    >
                      <div className="kanban-card-top">
                        <StatusBadge status={task.priority} />
                        {task.estimatedHours ? (
                          <span className="kanban-meta">
                            <Clock size={12} />
                            {task.estimatedHours} h
                          </span>
                        ) : null}
                      </div>

                      <h3>{task.title}</h3>
                      {task.description && <p className="clamp-2">{task.description}</p>}

                      <div className="kanban-card-info">
                        {milestoneName[idOf(task.milestoneId)] && (
                          <span className="kanban-meta">
                            <Flag size={12} />
                            {milestoneName[idOf(task.milestoneId)]}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`kanban-meta ${overdue ? "text-danger" : ""}`}>
                            {task.status === "completed"
                              ? `Due ${formatDate(task.dueDate)}`
                              : relativeDue(task.dueDate)}
                          </span>
                        )}
                      </div>

                      <select
                        className="select-compact"
                        aria-label={`Move ${task.title}`}
                        value={task.status}
                        disabled={updatingTask === task._id}
                        onChange={(event) => changeStatus(task, event.target.value)}
                      >
                        {columns.map((option) => (
                          <option key={option.id} value={option.id}>
                            Move to: {option.title}
                          </option>
                        ))}
                        <option value="cancelled">Move to: Cancelled</option>
                      </select>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
