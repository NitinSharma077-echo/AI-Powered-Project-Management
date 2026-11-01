import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus, ArrowUpRight } from "lucide-react";

import {
  getMeetings,
  createMeeting,
  getProjects,
} from "../services/meetingService";
import { getErrorMessage } from "../services/api";

import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

const emptyForm = {
  title: "",
  projectId: "",
  meetingDate: "",
  notes: "",
};

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [meetingData, projectData] = await Promise.all([
        getMeetings(),
        getProjects(),
      ]);

      setMeetings(meetingData);
      setProjects(projectData);
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
      const meeting = await createMeeting({
        title: form.title,
        projectId: form.projectId || undefined,
        meetingDate: form.meetingDate || undefined,
        notes: form.notes,
      });

      setMeetings((prev) => [meeting, ...prev]);
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text="Loading meetings..." />;
  }

  return (
    <div className="meetings-page">
      <div className="page-heading">
        <div>
          <h1>Meetings</h1>
          <p>All of your recorded meetings in one place.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={17} />
          New meeting
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {meetings.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Create your first meeting to start using MeetFlow AI."
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

      {showModal && (
        <Modal title="New meeting" onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field-label">
              Meeting title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="Weekly sync"
              />
            </label>

            <div className="form-row">
              <label className="field-label">
                Project (optional)
                <select
                  name="projectId"
                  value={form.projectId}
                  onChange={handleChange}
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                Meeting date
                <input
                  type="date"
                  name="meetingDate"
                  value={form.meetingDate}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="field-label">
              Notes / transcript
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Paste meeting notes or transcript here. You can analyze these with AI later."
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
                {saving ? "Creating..." : "Create meeting"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
