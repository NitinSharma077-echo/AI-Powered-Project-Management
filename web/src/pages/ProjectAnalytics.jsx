import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ListChecks, CheckCircle2, Loader, AlertTriangle, Map } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import { labelOf } from "../utils/format";
import Loading from "../components/Loading";

const STATUS_ORDER = ["backlog", "todo", "in_progress", "blocked", "completed", "cancelled"];
const PRIORITY_ORDER = ["urgent", "high", "medium", "low"];

function Breakdown({ title, counts, order, prefix }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0) || 1;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="bar-list">
        {order.map((key) => {
          const count = counts[key] || 0;
          return (
            <div className="bar-row" key={key}>
              <span className="bar-label">{labelOf(key)}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${prefix}-${key}`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <strong className="bar-value">{count}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ProjectAnalytics() {
  const { projectId } = useParams();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/projects/${projectId}/overview`)
      .then((response) => active && setOverview(response.data.data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return <Loading text="Loading project analytics…" variant="dashboard" />;
  }

  if (error || !overview) {
    return (
      <div className="page-stack">
        <Link to={`/projects/${projectId}`} className="back-link">
          <ArrowLeft size={15} />
          Back to project
        </Link>
        <div className="alert alert-error">{error || "Could not load project analytics."}</div>
      </div>
    );
  }

  const { project, summary, statusCounts, priorityCounts, milestones } = overview;

  const stats = [
    { label: "Total tasks", value: summary.totalTasks, icon: ListChecks, tone: "ink" },
    { label: "Completed", value: summary.completedTasks, icon: CheckCircle2, tone: "green" },
    { label: "In progress", value: summary.inProgressTasks, icon: Loader, tone: "blue" },
    { label: "Overdue", value: summary.overdueTasks, icon: AlertTriangle, tone: "red" },
  ];

  return (
    <div className="page-stack">
      <Link to={`/projects/${projectId}`} className="back-link">
        <ArrowLeft size={15} />
        Back to project
      </Link>

      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">{project.name}</span>
          <h1>Analytics</h1>
          <p>Progress across tasks and milestones.</p>
        </div>
        <div className="page-actions">
          <Link to={`/projects/${projectId}/roadmap`} className="secondary-button">
            <Map size={15} />
            View roadmap
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card" key={stat.label}>
              <span className={`stat-icon tone-${stat.tone}`}>
                <Icon size={18} />
              </span>
              <div>
                <p>{stat.label}</p>
                <strong className="stat-value">{stat.value}</strong>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Overall completion</h2>
            <p>
              {summary.completedTasks} of {summary.totalTasks} tasks completed
            </p>
          </div>
          <strong className="big-number">{summary.completionPercentage}%</strong>
        </div>
        <div className="progress-track lg">
          <div className="progress-value" style={{ width: `${summary.completionPercentage}%` }} />
        </div>
      </section>

      <div className="two-col">
        <Breakdown title="Tasks by status" counts={statusCounts} order={STATUS_ORDER} prefix="status" />
        <Breakdown title="Tasks by priority" counts={priorityCounts} order={PRIORITY_ORDER} prefix="priority" />
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Milestones</h2>
            <p>Completion of the tasks in each milestone.</p>
          </div>
        </div>

        {milestones.length === 0 ? (
          <p className="hint">No milestones yet for this project.</p>
        ) : (
          <div className="milestone-list">
            {milestones.map((milestone) => (
              <div className="milestone-row" key={milestone._id}>
                <div className="milestone-row-head">
                  <strong>{milestone.title}</strong>
                  <span className={`badge badge-${milestone.isOverdue ? "blocked" : milestone.status}`}>
                    {milestone.isOverdue ? "Overdue" : labelOf(milestone.status)}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-value" style={{ width: `${milestone.completionPercentage}%` }} />
                </div>
                <small className="hint">
                  {milestone.completedTasks}/{milestone.totalTasks} tasks · {milestone.completionPercentage}%
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
