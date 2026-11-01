import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FolderKanban,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import {
  getProjects,
  getMeetings,
  getMeetingActionItems,
} from "../services/meetingService";

import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [actions, setActions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [projectData, meetingData] = await Promise.all([
        getProjects(),
        getMeetings(),
      ]);

      setProjects(projectData);
      setMeetings(meetingData);

      // Retrieve action items for the user's meetings.
      const actionResults = await Promise.all(
        meetingData.map((meeting) =>
          getMeetingActionItems(meeting._id).catch(() => [])
        )
      );

      setActions(actionResults.flat());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const completedActions = actions.filter(
    (item) => item.status === "completed"
  ).length;

  const pendingActions = actions.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "cancelled"
  ).length;

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
      color: "purple",
    },
    {
      title: "Total Meetings",
      value: meetings.length,
      icon: CalendarDays,
      color: "blue",
    },
    {
      title: "Pending Tasks",
      value: pendingActions,
      icon: ListTodo,
      color: "orange",
    },
    {
      title: "Completed Tasks",
      value: completedActions,
      icon: CheckCircle2,
      color: "green",
    },
  ];

  if (loading) {
    return <Loading text="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading dashboard-heading">
        <div>

          <h1>
            Welcome back, {user?.name?.split(" ")[0] || "there"}!
          </h1>

          <p>
            Here's what's happening in your workspace.
          </p>
        </div>

        <Link to="/meetings" className="primary-button">
          <Plus size={17} />
          New meeting
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.title}>
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={21} />
              </div>

              <div>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </section>

      <section className="dashboard-welcome">
        <div>
          <div className="welcome-label">
            <Sparkles size={16} />
            MEETING INTELLIGENCE
          </div>

          <h2>Turn conversations into progress.</h2>

          <p>
            Analyze your meeting transcripts, capture decisions,
            and track action items with AI assistance.
          </p>

          <Link to="/meetings" className="welcome-link">
            Explore meetings
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="welcome-decoration">
          <div className="decoration-circle circle-one" />
          <div className="decoration-circle circle-two" />
          <Sparkles size={70} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Recent meetings</h2>
            <p>Your latest meeting activity.</p>
          </div>

          <Link to="/meetings" className="text-link">
            View all
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {meetings.length === 0 ? (
          <EmptyState
            title="No meetings yet"
            description="Create your first meeting to start using MeetFlow AI."
          />
        ) : (
          <div className="meeting-list">
            {meetings.slice(0, 5).map((meeting) => (
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
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Your projects</h2>
            <p>Projects in your workspace.</p>
          </div>

          <Link to="/projects" className="text-link">
            View all
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects created"
            description="Create a project to organize your meetings."
          />
        ) : (
          <div className="project-grid">
            {projects.slice(0, 4).map((project) => (
              <Link
                to="/projects"
                className="project-card"
                key={project._id}
              >
                <div className="project-card-icon">
                  <FolderKanban size={20} />
                </div>

                <h3>{project.name}</h3>

                <p>
                  {project.description || "No description provided."}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}