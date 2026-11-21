import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Search, ArrowUpRight } from "lucide-react";

import { getProjects, createProject } from "../services/meetingService";
import { getErrorMessage } from "../services/api";
import { invalidateWorkspace } from "../hooks/useWorkspaceData";
import { formatDate } from "../utils/format";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { ProjectFormModal } from "../components/ItemForms";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    getProjects()
      .then((data) => active && setProjects(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (project) =>
        (filter === "all" || project.status === filter) &&
        (!q || [project.name, project.description].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [projects, filter, query]);

  async function handleCreate(values) {
    const project = await createProject(values);
    setProjects((prev) => [project, ...prev]);
    invalidateWorkspace();
  }

  if (loading) {
    return <Loading text="Loading projects…" variant="grid" />;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-text">
          <h1>Projects</h1>
          <p>Plan the work, link meetings and track progress milestone by milestone.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="primary-button" onClick={() => setShowModal(true)}>
            <Plus size={17} />
            New project
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {projects.length > 0 && (
        <div className="toolbar">
          <div className="segmented" role="tablist">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={filter === item.id ? "active" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
          </label>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project, then generate a plan from a brief or upload a document."
          action={
            <button type="button" className="primary-button" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New project
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="No matching projects" description="Try another filter." />
      ) : (
        <div className="card-grid">
          {visible.map((project) => (
            <Link to={`/projects/${project._id}`} className="project-card" key={project._id}>
              <div className="project-card-top">
                <span className="project-card-icon">
                  <FolderKanban size={18} />
                </span>
                <StatusBadge status={project.status} />
              </div>
              <h3>{project.name}</h3>
              <p className="clamp-2">{project.description || "No description yet."}</p>
              <div className="project-card-foot">
                <span>Created {formatDate(project.createdAt)}</span>
                <ArrowUpRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectFormModal onSubmit={handleCreate} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
