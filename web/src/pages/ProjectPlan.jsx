
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  generateProjectPlan,
  approveProjectPlan,
} from "../services/planningService";

export default function ProjectPlan() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [brief, setBrief] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleGenerate(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setPlan(null);

    try {
      const result = await generateProjectPlan(
        projectId,
        brief,
        targetDate
      );

      setPlan(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Could not generate the project plan."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateTask(index, field, value) {
    setPlan((current) => {
      const tasks = [...current.tasks];

      tasks[index] = {
        ...tasks[index],
        [field]: value,
      };

      return { ...current, tasks };
    });
  }

  function updateMilestone(index, field, value) {
    setPlan((current) => {
      const milestones = [...current.milestones];

      milestones[index] = {
        ...milestones[index],
        [field]: value,
      };

      return { ...current, milestones };
    });
  }

  function removeTask(index) {
    setPlan((current) => {
      const removedRef = current.tasks[index].ref;
      const tasks = current.tasks.filter((_, i) => i !== index);

      // Also remove dependencies that reference the removed task.
      const dependencies = current.dependencies.filter(
        (item) =>
          item.predecessor_ref !== removedRef &&
          item.successor_ref !== removedRef
      );

      return { ...current, tasks, dependencies };
    });
  }

  async function handleApprove() {
    if (!plan || plan.tasks.length === 0) {
      setError("Your plan must contain at least one task.");
      return;
    }

    const confirmed = window.confirm(
      "Approve this plan and save its milestones, tasks and dependencies?"
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await approveProjectPlan(projectId, plan);

      setMessage(
        `Saved ${result.data.taskCount} tasks, ` +
        `${result.data.milestoneCount} milestones and ` +
        `${result.data.dependencyCount} dependencies.`
      );

      setPlan(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not save the approved plan."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>AI Project Planner</h1>
          <p>
            Generate a project plan, review the suggestions,
            and approve the work before saving it.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </button>
      </div>

      <form onSubmit={handleGenerate} className="planner-form">
        <h2>Project Brief</h2>

        <label htmlFor="projectBrief">
          Describe what you want to build
        </label>

        <textarea
          id="projectBrief"
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          placeholder="Describe the project goals, requirements, technology, deliverables and constraints..."
          rows={7}
          minLength={20}
          required
        />

        <label htmlFor="targetDate">Target completion date</label>

        <input
          id="targetDate"
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Generating plan..." : "Generate AI Plan"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {plan && (
        <section className="generated-plan">
          <div className="plan-heading">
            <div>
              <h2>Review Generated Plan</h2>
              <p>{plan.summary}</p>
            </div>
            <span>Draft — Not Saved</span>
          </div>

          <h3>Milestones ({plan.milestones.length})</h3>

          {plan.milestones.map((milestone, index) => (
            <div className="planner-card" key={milestone.ref}>
              <label>Milestone title</label>
              <input
                value={milestone.title}
                onChange={(event) =>
                  updateMilestone(index, "title", event.target.value)
                }
              />

              <label>Description</label>
              <textarea
                value={milestone.description || ""}
                onChange={(event) =>
                  updateMilestone(index, "description", event.target.value)
                }
                rows={2}
              />

              <label>Due date</label>
              <input
                type="date"
                value={milestone.due_date || ""}
                onChange={(event) =>
                  updateMilestone(
                    index,
                    "due_date",
                    event.target.value || null
                  )
                }
              />
            </div>
          ))}

          <h3>Tasks ({plan.tasks.length})</h3>

          {plan.tasks.map((task, index) => (
            <div className="planner-card" key={task.ref}>
              <div className="task-card-heading">
                <strong>{task.ref}</strong>
                <button
                  type="button"
                  onClick={() => removeTask(index)}
                >
                  Remove
                </button>
              </div>

              <label>Task title</label>
              <input
                value={task.title}
                onChange={(event) =>
                  updateTask(index, "title", event.target.value)
                }
              />

              <label>Description</label>
              <textarea
                value={task.description || ""}
                onChange={(event) =>
                  updateTask(index, "description", event.target.value)
                }
                rows={2}
              />

              <label>Priority</label>
              <select
                value={task.priority}
                onChange={(event) =>
                  updateTask(index, "priority", event.target.value)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <label>Estimated hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={task.estimated_hours ?? ""}
                onChange={(event) =>
                  updateTask(
                    index,
                    "estimated_hours",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value)
                  )
                }
              />

              <label>Due date</label>
              <input
                type="date"
                value={task.due_date || ""}
                onChange={(event) =>
                  updateTask(
                    index,
                    "due_date",
                    event.target.value || null
                  )
                }
              />

              <label>Milestone</label>
              <select
                value={task.milestone_ref || ""}
                onChange={(event) =>
                  updateTask(
                    index,
                    "milestone_ref",
                    event.target.value || null
                  )
                }
              >
                <option value="">No milestone</option>
                {plan.milestones.map((milestone) => (
                  <option
                    key={milestone.ref}
                    value={milestone.ref}
                  >
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <h3>Dependencies ({plan.dependencies.length})</h3>

          {plan.dependencies.map((dependency, index) => (
            <div className="planner-card" key={index}>
              <strong>
                {dependency.predecessor_ref} → {dependency.successor_ref}
              </strong>
              <p>{dependency.description}</p>
            </div>
          ))}

          <h3>Potential Risks</h3>
          <ul>
            {plan.risks.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>

          <h3>Unresolved Questions</h3>
          <ul>
            {plan.unresolved_questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>

          <div className="approval-actions">
            <button
              type="button"
              onClick={() => setPlan(null)}
              disabled={saving}
            >
              Discard Draft
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={saving}
            >
              {saving ? "Saving..." : "Approve & Save Plan"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
