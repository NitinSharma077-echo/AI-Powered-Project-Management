import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ArrowUpRight } from "lucide-react";

import { getProject, getMeetings } from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    setError("");

    try {
      const [projectData, allMeetings] = await Promise.all([
        getProject(projectId),
        getMeetings(),
      ]);

      setProject(projectData);
      setMeetings(
        allMeetings.filter((meeting) => meeting.project === projectId)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading text="Loading project..." />;
  }

  if (error) {
    return (
      <div>
        <Link to="/projects" className="back-link">
          <ArrowLeft size={15} />
          Back to projects
        </Link>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="project-details-page">
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} />
        Back to projects
      </Link>

      <div className="detail-header">
        <div>
          <h1>{project.name}</h1>

          <div className="detail-meta">
            <StatusBadge status={project.status} />
            <span>
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to={`/projects/${projectId}/plan`} className="secondary-button">
            AI plan
          </Link>
          <Link to={`/projects/${projectId}/tasks`} className="secondary-button">
            Task board
          </Link>
          <Link
            to={`/projects/${projectId}/analytics`}
            className="secondary-button"
          >
            Analytics
          </Link>
        </div>
      </div>

      <div className="detail-card">
        <h2>Description</h2>
        <p>{project.description || "No description provided."}</p>
      </div>

      <div className="section-heading">
        <div>
          <h2>Meetings</h2>
          <p>Meetings linked to this project.</p>
        </div>

        <Link to="/meetings" className="text-link">
          View all
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Meetings created for this project will show up here."
        />
      ) : (
        <div className="meeting-list">
          {meetings.map((meeting) => (
            <Link
              to={`/meetings/${meeting._id}`}
              className="meeting-row"
              key={meeting._id}
            >
              <div className="meeting-row-icon">
                <CalendarDays size={19} />
              </div>

              <div className="meeting-row-info">
                <strong>{meeting.title}</strong>
                <small>
                  {meeting.meetingDate
                    ? new Date(meeting.meetingDate).toLocaleDateString()
                    : "Date not specified"}
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
