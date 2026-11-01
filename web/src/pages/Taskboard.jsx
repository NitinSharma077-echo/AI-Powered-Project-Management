
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "blocked", title: "Blocked" },
  { id: "completed", title: "Completed" },
];

export default function TaskBoard() {
  const { projectId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/projects/${projectId}/tasks`
      );

      setTasks(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load project tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  async function changeStatus(taskId, status) {
    setUpdatingTask(taskId);
    setError("");

    try {
      await api.patch(`/tasks/${taskId}/status`, { status });

      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not update task status."
      );
    } finally {
      setUpdatingTask(null);
    }
  }

  if (loading) {
    return <div className="page-container">Loading task board...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Project Task Board</h1>
          <p>Track work across the project workflow.</p>
        </div>

        <button type="button" onClick={loadTasks}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="kanban-board">
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.id
          );

          return (
            <section className="kanban-column" key={column.id}>
              <div className="kanban-column-heading">
                <h2>{column.title}</h2>
                <span>{columnTasks.length}</span>
              </div>

              {columnTasks.length === 0 && (
                <p className="empty-column">No tasks here.</p>
              )}

              {columnTasks.map((task) => (
                <article className="kanban-card" key={task._id}>
                  <div className="kanban-card-top">
                    <span className={`priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>

                  <h3>{task.title}</h3>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  {task.dueDate && (
                    <small>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </small>
                  )}

                  <label htmlFor={`status-${task._id}`}>
                    Move task
                  </label>

                  <select
                    id={`status-${task._id}`}
                    value={task.status}
                    disabled={updatingTask === task._id}
                    onChange={(event) =>
                      changeStatus(task._id, event.target.value)
                    }
                  >
                    {columns.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                    <option value="cancelled">Cancelled</option>
                  </select>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
