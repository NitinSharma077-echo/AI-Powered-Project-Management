import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus, ChevronRight, Search, FolderKanban, FileText } from "lucide-react";

import { getMeetings, createMeeting, getProjects } from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { formatDate } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { MeetingFormModal } from "../components/ItemForms";

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    let active = true;

    Promise.all([getMeetings(), getProjects()])
      .then(([meetingData, projectData]) => {
        if (!active) return;
        setMeetings(meetingData);
        setProjects(projectData);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const projectName = useMemo(
    () => Object.fromEntries(projects.map((p) => [p._id, p.name])),
    [projects]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return meetings.filter((meeting) => {
      if (projectFilter === "none" && meeting.project) return false;
      if (projectFilter !== "all" && projectFilter !== "none" && meeting.project !== projectFilter) {
        return false;
      }
      if (!q) return true;
      return [meeting.title, meeting.notes].some((field) => field?.toLowerCase().includes(q));
    });
  }, [meetings, query, projectFilter]);

  async function handleCreate(values) {
    const meeting = await createMeeting(values);
    setMeetings((prev) => [meeting, ...prev]);
    invalidateWorkspace();
  }

  if (loading) {
    return <Loading text="Loading meetings…" variant="list" />;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-text">
          <h1>Meetings</h1>
          <p>Every meeting, its notes, decisions and follow-ups in one place.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="primary-button" onClick={() => setShowModal(true)}>
            <Plus size={17} />
            New meeting
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {meetings.length > 0 && (
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and notes…"
              aria-label="Search meetings"
            />
          </label>
          <select
            className="select-compact"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            <option value="none">No project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <span className="toolbar-count">
            {visible.length} of {meetings.length}
          </span>
        </div>
      )}

      {meetings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No meetings yet"
          description="Create a meeting, paste the notes, and let AI pull out decisions and action items."
          action={
            <button type="button" className="primary-button" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New meeting
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching meetings"
          description="Try a different search or project filter."
        />
      ) : (
        <div className="list">
          {visible.map((meeting) => (
            <Link to={`/meetings/${meeting._id}`} className="list-item is-link" key={meeting._id}>
              <span className="date-tile">
                <strong>{meeting.meetingDate ? new Date(meeting.meetingDate).getDate() : "–"}</strong>
                <small>
                  {meeting.meetingDate
                    ? new Date(meeting.meetingDate).toLocaleDateString(undefined, { month: "short" })
                    : ""}
                </small>
              </span>
              <div className="list-item-body">
                <strong>{meeting.title}</strong>
                <p className="clamp-1">
                  {meeting.notes ? meeting.notes : "No notes yet"}
                </p>
                <small className="meta-row">
                  <span className="meta-item">
                    <CalendarDays size={13} />
                    {formatDate(meeting.meetingDate)}
                  </span>
                  {meeting.project && projectName[meeting.project] && (
                    <span className="meta-item">
                      <FolderKanban size={13} />
                      {projectName[meeting.project]}
                    </span>
                  )}
                  {meeting.followUps?.length > 0 && (
                    <span className="meta-item">
                      <FileText size={13} />
                      {meeting.followUps.length} added later
                    </span>
                  )}
                </small>
              </div>
              <ChevronRight size={18} className="list-item-chevron" />
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <MeetingFormModal
          projects={projects}
          onSubmit={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
