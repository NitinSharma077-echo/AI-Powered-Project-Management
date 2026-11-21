import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Sparkles,
  KanbanSquare,
  BarChart3,
  Map,
  Pencil,
  Trash2,
  Upload,
  Plus,
} from "lucide-react";

import {
  getProject,
  getMeetings,
  updateProject,
  deleteProject,
  createMeeting,
  getProjects,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { formatDate } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import { ProjectFormModal, MeetingFormModal } from "../components/ItemForms";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([getProject(projectId), getMeetings(), getProjects().catch(() => [])])
      .then(([projectData, allMeetings, allProjects]) => {
        if (!active) return;
        setProject(projectData);
        setProjects(allProjects);
        setMeetings(allMeetings.filter((meeting) => meeting.project === projectId));
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [projectId]);

  async function handleSave(values) {
    const updated = await updateProject(projectId, values);
    setProject(updated);
    invalidateWorkspace();
  }

  async function handleDelete() {
    await deleteProject(projectId);
    invalidateWorkspace();
    navigate("/projects", { replace: true });
  }

  async function handleCreateMeeting(values) {
    const meeting = await createMeeting(values);
    if (meeting.project === projectId) setMeetings((prev) => [meeting, ...prev]);
    invalidateWorkspace();
  }

  if (loading) {
    return <Loading text="Loading project…" variant="detail" />;
  }

  if (error || !project) {
    return (
      <div className="page-stack">
        <Link to="/projects" className="back-link">
          <ArrowLeft size={15} />
          Back to projects
        </Link>
        <div className="alert alert-error">{error || "Project not found."}</div>
      </div>
    );
  }

  const tools = [
    {
      to: `/projects/${projectId}/plan`,
      icon: Sparkles,
      title: "AI planner",
      text: "Describe the project and get milestones, tasks and dependencies.",
    },
    {
      to: `/projects/${projectId}/plan?mode=document`,
      icon: Upload,
      title: "Import a document",
      text: "Upload a PDF, Word or text file and turn its items into a plan.",
    },
    {
      to: `/projects/${projectId}/roadmap`,
      icon: Map,
      title: "Roadmap",
      text: "See every milestone and its tasks on a visual timeline.",
    },
    {
      to: `/projects/${projectId}/tasks`,
      icon: KanbanSquare,
      title: "Task board",
      text: "Move tasks through backlog, in progress and done.",
    },
    {
      to: `/projects/${projectId}/analytics`,
      icon: BarChart3,
      title: "Analytics",
      text: "Completion, overdue work and milestone progress.",
    },
  ];

  return (
    <div className="page-stack">
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} />
        Back to projects
      </Link>

      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">Project</span>
          <h1>{project.name}</h1>
          <div className="meta-row">
            <StatusBadge status={project.status} />
            <span className="meta-item">Created {formatDate(project.createdAt)}</span>
            <span className="meta-item">
              <CalendarDays size={14} />
              {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Edit project"
            data-tooltip="Edit project"
            onClick={() => setDialog("edit")}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            aria-label="Delete project"
            data-tooltip="Delete project"
            onClick={() => setDialog("delete")}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>About this project</h2>
          </div>
        </div>
        <p className={project.description ? "prose" : "hint"}>
          {project.description || "No description yet. Use Edit to add one."}
        </p>
      </section>

      <section className="tool-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link to={tool.to} className="tool-card" key={tool.title}>
              <span className="tool-card-icon">
                <Icon size={18} />
              </span>
              <strong>{tool.title}</strong>
              <p>{tool.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="page-stack">
        <div className="section-head">
          <div>
            <h2>Meetings</h2>
            <p>Meetings linked to this project.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setDialog("meeting")}>
            <Plus size={16} />
            New meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No meetings linked yet"
            description="Create a meeting for this project to capture its decisions and action items."
          />
        ) : (
          <div className="list">
            {meetings.map((meeting) => (
              <Link to={`/meetings/${meeting._id}`} className="list-item is-link" key={meeting._id}>
                <span className="list-item-icon">
                  <CalendarDays size={16} />
                </span>
                <div className="list-item-body">
                  <strong>{meeting.title}</strong>
                  <small>{formatDate(meeting.meetingDate)}</small>
                </div>
                <ChevronRight size={18} className="list-item-chevron" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {dialog === "edit" && (
        <ProjectFormModal initial={project} onSubmit={handleSave} onClose={() => setDialog(null)} />
      )}
      {dialog === "meeting" && (
        <MeetingFormModal
          projects={projects}
          defaultProjectId={projectId}
          onSubmit={handleCreateMeeting}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <ConfirmModal
          title="Delete project?"
          message={`“${project.name}” and its tasks, milestones and dependencies will be permanently deleted. Its ${meetings.length} meetings are kept and unlinked.`}
          confirmLabel="Delete project"
          onConfirm={handleDelete}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
