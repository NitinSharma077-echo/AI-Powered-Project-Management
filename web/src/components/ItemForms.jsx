import { useState } from "react";

import Modal from "./Modal";
import { Spinner } from "./Loading";
import { getErrorMessage } from "../services/api";
import { toInputDate } from "../utils/format";

// Shared create/edit dialogs. `initial` pre-fills the form for editing;
// `onSubmit(values)` performs the save and may throw to show an error.

function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  return { values, set, saving, setSaving, error, setError };
}

async function submitWith(state, onSubmit, onClose, event) {
  event.preventDefault();
  state.setSaving(true);
  state.setError("");

  try {
    await onSubmit(state.values);
    onClose();
  } catch (err) {
    state.setError(getErrorMessage(err));
    state.setSaving(false);
  }
}

function FormActions({ saving, onClose, label }) {
  return (
    <div className="form-actions">
      <button type="button" className="secondary-button" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" className="primary-button" disabled={saving}>
        {saving && <Spinner size={14} />}
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

export function DecisionFormModal({ initial, onSubmit, onClose }) {
  const editing = Boolean(initial);
  const state = useFormState({
    title: initial?.title || "",
    description: initial?.description || "",
  });

  return (
    <Modal title={editing ? "Edit decision" : "Add decision"} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => submitWith(state, onSubmit, onClose, e)}>
        <label className="field-label">
          Decision
          <input
            type="text"
            value={state.values.title}
            onChange={state.set("title")}
            required
            maxLength={200}
            placeholder="What was decided?"
            autoFocus
          />
        </label>

        <label className="field-label">
          Context <span className="field-optional">optional</span>
          <textarea
            value={state.values.description}
            onChange={state.set("description")}
            placeholder="Why it was decided, alternatives considered…"
          />
        </label>

        {state.error && <div className="alert alert-error">{state.error}</div>}
        <FormActions
          saving={state.saving}
          onClose={onClose}
          label={editing ? "Save changes" : "Add decision"}
        />
      </form>
    </Modal>
  );
}

export function ActionItemFormModal({ initial, onSubmit, onClose }) {
  const editing = Boolean(initial);
  const state = useFormState({
    title: initial?.title || "",
    description: initial?.description || "",
    dueDate: toInputDate(initial?.dueDate),
    priority: initial?.priority || "medium",
  });

  function handleSubmit(values) {
    return onSubmit({ ...values, dueDate: values.dueDate || null });
  }

  return (
    <Modal title={editing ? "Edit action item" : "Add action item"} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => submitWith(state, handleSubmit, onClose, e)}>
        <label className="field-label">
          Task
          <input
            type="text"
            value={state.values.title}
            onChange={state.set("title")}
            required
            maxLength={200}
            placeholder="What needs to be done?"
            autoFocus
          />
        </label>

        <label className="field-label">
          Details <span className="field-optional">optional</span>
          <textarea
            value={state.values.description}
            onChange={state.set("description")}
            placeholder="Owner, acceptance criteria, links…"
          />
        </label>

        <div className="form-row">
          <label className="field-label">
            Due date
            <input type="date" value={state.values.dueDate} onChange={state.set("dueDate")} />
          </label>

          <label className="field-label">
            Priority
            <select value={state.values.priority} onChange={state.set("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>

        {state.error && <div className="alert alert-error">{state.error}</div>}
        <FormActions
          saving={state.saving}
          onClose={onClose}
          label={editing ? "Save changes" : "Add action item"}
        />
      </form>
    </Modal>
  );
}

export function MeetingFormModal({
  initial,
  projects = [],
  defaultProjectId = "",
  onSubmit,
  onClose,
}) {
  const editing = Boolean(initial);
  const state = useFormState({
    title: initial?.title || "",
    projectId: initial ? initial.project || "" : defaultProjectId,
    meetingDate: toInputDate(initial?.meetingDate),
    notes: initial?.notes || "",
  });

  function handleSubmit(values) {
    const payload = {
      title: values.title,
      projectId: values.projectId || null,
      meetingDate: values.meetingDate || null,
    };
    // Notes are edited in place on the meeting page; only send them on create.
    if (!editing) payload.notes = values.notes;
    return onSubmit(payload);
  }

  return (
    <Modal title={editing ? "Edit meeting" : "New meeting"} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => submitWith(state, handleSubmit, onClose, e)}>
        <label className="field-label">
          Meeting title
          <input
            type="text"
            value={state.values.title}
            onChange={state.set("title")}
            required
            maxLength={200}
            placeholder="Weekly sync"
            autoFocus
          />
        </label>

        <div className="form-row">
          <label className="field-label">
            Project
            <select value={state.values.projectId} onChange={state.set("projectId")}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Date
            <input
              type="date"
              value={state.values.meetingDate}
              onChange={state.set("meetingDate")}
            />
          </label>
        </div>

        {!editing && (
          <label className="field-label">
            Notes or transcript <span className="field-optional">optional</span>
            <textarea
              rows={6}
              value={state.values.notes}
              onChange={state.set("notes")}
              placeholder="Paste meeting notes or a transcript. You can edit them and analyze them with AI later."
            />
          </label>
        )}

        {state.error && <div className="alert alert-error">{state.error}</div>}
        <FormActions
          saving={state.saving}
          onClose={onClose}
          label={editing ? "Save changes" : "Create meeting"}
        />
      </form>
    </Modal>
  );
}

export function ProjectFormModal({ initial, onSubmit, onClose }) {
  const editing = Boolean(initial);
  const state = useFormState({
    name: initial?.name || "",
    description: initial?.description || "",
    status: initial?.status || "active",
  });

  return (
    <Modal title={editing ? "Edit project" : "New project"} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => submitWith(state, onSubmit, onClose, e)}>
        <label className="field-label">
          Project name
          <input
            type="text"
            value={state.values.name}
            onChange={state.set("name")}
            required
            maxLength={120}
            placeholder="Website redesign"
            autoFocus
          />
        </label>

        <label className="field-label">
          Description <span className="field-optional">optional</span>
          <textarea
            value={state.values.description}
            onChange={state.set("description")}
            placeholder="What is this project about?"
          />
        </label>

        {editing && (
          <label className="field-label">
            Status
            <select value={state.values.status} onChange={state.set("status")}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        )}

        {state.error && <div className="alert alert-error">{state.error}</div>}
        <FormActions
          saving={state.saving}
          onClose={onClose}
          label={editing ? "Save changes" : "Create project"}
        />
      </form>
    </Modal>
  );
}
