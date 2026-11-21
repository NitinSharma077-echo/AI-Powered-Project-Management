import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  Clock,
  GitBranch,
  Search,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import useWorkspaceData from "../hooks/useWorkspaceData";
import { getErrorMessage } from "../services/api";
import { formatDate, relativeDue, daysFromToday, greeting } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

const isOpen = (item) => !["completed", "cancelled"].includes(item.status);

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useWorkspaceData();

  const view = useMemo(() => {
    if (!data) return null;

    const open = data.actionItems.filter(isOpen);
    const attention = open
      .filter((item) => item.dueDate && daysFromToday(item.dueDate) <= 3)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    return {
      open: open.length,
      completed: data.actionItems.filter((i) => i.status === "completed").length,
      overdue: open.filter((i) => i.dueDate && daysFromToday(i.dueDate) < 0).length,
      pendingDecisions: data.decisions.filter((d) => d.status === "proposed"),
      attention,
    };
  }, [data]);

  if (loading && !data) {
    return <Loading text="Loading your dashboard…" variant="dashboard" />;
  }

  if (!data) {
    return <div className="alert alert-error">{getErrorMessage(error)}</div>;
  }

  const stats = [
    { title: "Active projects", value: data.projects.filter((p) => p.status === "active").length, icon: FolderKanban, tone: "red", to: "/projects" },
    { title: "Meetings", value: data.meetings.length, icon: CalendarDays, tone: "amber", to: "/meetings" },
    { title: "Open action items", value: view.open, icon: ListTodo, tone: "blue", to: "/action-items", note: view.overdue ? `${view.overdue} overdue` : null },
    { title: "Completed", value: view.completed, icon: CheckCircle2, tone: "green", to: "/action-items" },
  ];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1>
            {greeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p>Here’s what’s happening across your workspace.</p>
        </div>
        <div className="page-actions">
          <Link to="/meetings" className="primary-button">
            <Plus size={17} />
            New meeting
          </Link>
        </div>
      </header>

      {error && data && <div className="alert alert-error">{getErrorMessage(error)}</div>}

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link to={stat.to} className="stat-card is-link" key={stat.title}>
              <span className={`stat-icon tone-${stat.tone}`}>
                <Icon size={18} />
              </span>
              <div>
                <p>{stat.title}</p>
                <strong className="stat-value">{stat.value}</strong>
                {stat.note && <small className="text-danger">{stat.note}</small>}
              </div>
            </Link>
          );
        })}
      </section>

      <div className="two-col wide-left">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Needs attention</h2>
              <p>Overdue or due in the next 3 days.</p>
            </div>
            <Link to="/action-items" className="text-link">
              All action items
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {view.attention.length === 0 && view.pendingDecisions.length === 0 ? (
            <div className="inline-empty">
              <CheckCircle2 size={18} />
              Nothing urgent. You’re on top of things.
            </div>
          ) : (
            <ul className="compact-list">
              {view.attention.map((item) => {
                const overdue = daysFromToday(item.dueDate) < 0;
                return (
                  <li key={item._id}>
                    <Link to={`/meetings/${item.meetingId}?tab=actions`}>
                      <span className={`compact-icon ${overdue ? "tone-red" : "tone-amber"}`}>
                        {overdue ? <AlertCircle size={15} /> : <Clock size={15} />}
                      </span>
                      <span className="compact-text">
                        <strong>{item.title}</strong>
                        <small className={overdue ? "text-danger" : ""}>
                          {relativeDue(item.dueDate)} · {item.meetingTitle}
                        </small>
                      </span>
                      <StatusBadge status={item.priority} />
                    </Link>
                  </li>
                );
              })}
              {view.pendingDecisions.slice(0, 3).map((decision) => (
                <li key={decision._id}>
                  <Link to={`/meetings/${decision.meetingId}?tab=decisions`}>
                    <span className="compact-icon tone-blue">
                      <GitBranch size={15} />
                    </span>
                    <span className="compact-text">
                      <strong>{decision.title}</strong>
                      <small>Decision awaiting approval · {decision.meetingTitle}</small>
                    </span>
                    <StatusBadge status="proposed" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Quick actions</h2>
              <p>Jump straight in.</p>
            </div>
          </div>
          <div className="quick-actions">
            <Link to="/meetings" className="quick-action">
              <CalendarDays size={17} />
              Record a meeting
            </Link>
            <Link to="/projects" className="quick-action">
              <FolderKanban size={17} />
              Start a project
            </Link>
            <Link to="/action-items" className="quick-action">
              <ListTodo size={17} />
              Review action items
            </Link>
            <button
              type="button"
              className="quick-action"
              onClick={() =>
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
              }
            >
              <Search size={17} />
              Search everything
            </button>
          </div>
        </section>
      </div>

      <section className="page-stack">
        <div className="section-head">
          <div>
            <h2>Recent meetings</h2>
            <p>Your latest meeting activity.</p>
          </div>
          <Link to="/meetings" className="text-link">
            View all
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {data.meetings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No meetings yet"
            description="Create your first meeting to start capturing decisions and action items."
          />
        ) : (
          <div className="list">
            {data.meetings.slice(0, 4).map((meeting) => (
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

      <section className="page-stack">
        <div className="section-head">
          <div>
            <h2>Your projects</h2>
            <p>Projects in your workspace.</p>
          </div>
          <Link to="/projects" className="text-link">
            View all
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {data.projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create a project to plan work and organize your meetings."
          />
        ) : (
          <div className="card-grid">
            {data.projects.slice(0, 3).map((project) => (
              <Link to={`/projects/${project._id}`} className="project-card" key={project._id}>
                <div className="project-card-top">
                  <span className="project-card-icon">
                    <FolderKanban size={18} />
                  </span>
                  <StatusBadge status={project.status} />
                </div>
                <h3>{project.name}</h3>
                <p className="clamp-2">{project.description || "No description yet."}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
