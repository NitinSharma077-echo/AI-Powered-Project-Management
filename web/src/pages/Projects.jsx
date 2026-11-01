import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";

import { getProjects, createProject } from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const project = await createProject(form);
      setProjects((prev) => [project, ...prev]);
      setForm({ name: "", description: "" });
      setShowModal(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text="Loading projects..." />;
  }

  return (
    <div className="projects-page">
      <div className="page-heading">
        <div>
          <h1>Projects</h1>
          <p>Organize your meetings by project.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={17} />
          New project
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to start organizing your meetings."
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              to={`/projects/${project._id}`}
              className="project-card"
              key={project._id}
            >
              <div className="project-card-icon">
                <FolderKanban size={20} />
              </div>

              <h3>{project.name}</h3>
              <p>{project.description || "No description provided."}</p>

              <div className="card-footer-meta">
                <StatusBadge status={project.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New project" onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field-label">
              Project name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={120}
                placeholder="Website redesign"
              />
            </label>

            <label className="field-label">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What is this project about?"
              />
            </label>

            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
