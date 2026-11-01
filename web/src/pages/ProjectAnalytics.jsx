import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";

export default function ProjectAnalytics() {
  const { projectId } = useParams();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOverview();
  }, [projectId]);

  async function loadOverview() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/projects/${projectId}/overview`);
      setOverview(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading text="Loading project analytics..." />;
  }

  if (error || !overview) {
    return (
      <div>
        <Link to={`/projects/${projectId}`} className="back-link">
          <ArrowLeft size={15} />
          Back to project
        </Link>
        <div className="alert alert-error">
          {error || "Could not load project analytics."}
        </div>
      </div>
    );
  }

  const { project, summary, statusCounts, priorityCounts, milestones } =
    overview;

  return (
    <div className="project-analytics-page">
      <Link to={`/projects/${projectId}`} className="back-link">
        <ArrowLeft size={15} />
        Back to project
      </Link>

      <div className="page-heading">
        <div>
          <h1>{project.name}</h1>
          <p>Progress overview across tasks and milestones.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total tasks</p>
          <h2>{summary.totalTasks}</h2>
        </div>
        <div className="stat-card">
          <p>Completed</p>
          <h2>{summary.completedTasks}</h2>
        </div>
        <div className="stat-card">
          <p>In progress</p>
          <h2>{summary.inProgressTasks}</h2>
        </div>
        <div className="stat-card">
          <p>Overdue</p>
          <h2>{summary.overdueTasks}</h2>
        </div>
      </div>

      <div className="analytics-section">
        <h2>Overall completion</h2>
        <div className="progress-track">
          <div
            className="progress-value"
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
        <p className="form-hint">{summary.completionPercentage}% complete</p>
      </div>

      <div className="analytics-section">
        <h2>Tasks by status</h2>
        <div className="breakdown-grid">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div className="breakdown-item" key={status}>
              <span>{status.replace("_", " ")}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h2>Tasks by priority</h2>
        <div className="breakdown-grid">
          {Object.entries(priorityCounts).map(([priority, count]) => (
            <div className="breakdown-item" key={priority}>
              <span>{priority}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Milestones</h2>

      {milestones.length === 0 ? (
        <p className="form-hint">No milestones yet for this project.</p>
      ) : (
        milestones.map((milestone) => (
          <div className="milestone-card" key={milestone._id}>
            <div className="milestone-heading">
              <h3>{milestone.title}</h3>
              <span>
                {milestone.isOverdue ? "Overdue" : milestone.status}
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${milestone.completionPercentage}%` }}
              />
            </div>

            <p className="form-hint">
              {milestone.completedTasks}/{milestone.totalTasks} tasks ·{" "}
              {milestone.completionPercentage}% complete
            </p>
          </div>
        ))
      )}
    </div>
  );
}
