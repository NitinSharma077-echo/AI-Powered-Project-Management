import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Pencil,
  Mail,
  ShieldCheck,
  CalendarDays,
  FolderKanban,
  ListTodo,
  GitBranch,
  Sun,
  Moon,
  Keyboard,
  Laptop,
  Check,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { isRemembered } from "../services/session";
import useWorkspaceData from "../hooks/useWorkspaceData";
import { formatDate, initialsOf, labelOf } from "../utils/format";
import { Spinner } from "../components/Loading";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem("meetflow_theme", theme);
  } catch {
    // Applies for this visit only.
  }
}

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "Search everything" },
  { keys: ["/"], label: "Search (when not typing)" },
  { keys: ["Ctrl", "B"], label: "Show or hide the sidebar" },
  { keys: ["Ctrl", "Enter"], label: "Save notes or add a point" },
  { keys: ["Esc"], label: "Close dialogs and menus" },
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data } = useWorkspaceData();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState(currentTheme);

  const remembered = isRemembered();

  const stats = [
    { label: "Projects", value: data?.projects.length, icon: FolderKanban },
    { label: "Meetings", value: data?.meetings.length, icon: CalendarDays },
    {
      label: "Open action items",
      value: data?.actionItems.filter((a) => !["completed", "cancelled"].includes(a.status)).length,
      icon: ListTodo,
    },
    { label: "Decisions", value: data?.decisions.length, icon: GitBranch },
  ];

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { user: nextUser } = await updateProfile({ name });
      updateUser(nextUser);
      setSuccess("Your name has been updated.");
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function chooseTheme(next) {
    applyTheme(next);
    setTheme(next);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page-stack">
      <section className="profile-hero">
        <div className="profile-avatar">{initialsOf(user?.name)}</div>
        <div className="profile-hero-text">
          <span className="eyebrow">Your account</span>
          <h1>{user?.name}</h1>
          <p>
            <Mail size={14} />
            {user?.email}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card" key={stat.label}>
              <span className="stat-icon tone-ink">
                <Icon size={18} />
              </span>
              <div>
                <p>{stat.label}</p>
                <strong className="stat-value">{stat.value ?? "–"}</strong>
              </div>
            </div>
          );
        })}
      </section>

      {success && (
        <div className="alert alert-success">
          <Check size={15} />
          {success}
        </div>
      )}

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Account details</h2>
              <p>How you appear in MeetFlow.</p>
            </div>
            {!editing && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setName(user?.name || "");
                  setEditing(true);
                  setSuccess("");
                }}
              >
                <Pencil size={15} />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form className="form-grid" onSubmit={handleSave}>
              <label className="field-label">
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                />
              </label>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || !name.trim() || name.trim() === user?.name}
                >
                  {saving && <Spinner size={14} />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="detail-list">
              <div>
                <dt>Full name</dt>
                <dd>{user?.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd className="capitalize">{labelOf(user?.role) || "Member"}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{formatDate(user?.createdAt, "—")}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Preferences</h2>
              <p>Saved on this device.</p>
            </div>
          </div>

          <div className="setting">
            <div>
              <strong>Appearance</strong>
              <small>Choose a light or dark interface.</small>
            </div>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              <button
                type="button"
                role="radio"
                aria-checked={theme === "light"}
                className={theme === "light" ? "active" : ""}
                onClick={() => chooseTheme("light")}
              >
                <Sun size={14} />
                Light
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={theme === "dark"}
                className={theme === "dark" ? "active" : ""}
                onClick={() => chooseTheme("dark")}
              >
                <Moon size={14} />
                Dark
              </button>
            </div>
          </div>

          <div className="setting">
            <div>
              <strong>
                <Laptop size={15} />
                Session on this device
              </strong>
              <small>
                {remembered
                  ? "You stay signed in on this device, even after closing the browser."
                  : "You will be signed out when you close this browser tab."}
              </small>
            </div>
            <span className={`badge ${remembered ? "badge-approved" : "badge-proposed"}`}>
              <ShieldCheck size={12} />
              {remembered ? "Remembered" : "This tab only"}
            </span>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>
              <Keyboard size={18} />
              Keyboard shortcuts
            </h2>
            <p>Move around faster. On a Mac, use ⌘ instead of Ctrl.</p>
          </div>
        </div>
        <ul className="shortcut-list">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label}>
              <span>{shortcut.label}</span>
              <span>
                {shortcut.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
