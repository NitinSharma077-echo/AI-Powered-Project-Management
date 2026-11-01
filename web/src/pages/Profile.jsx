import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Pencil } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/authService";
import { getErrorMessage } from "../services/api";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { user: nextUser } = await updateProfile({ name });
      updateUser(nextUser);
      setSuccess("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <h1>Profile</h1>
          <p>Manage your account details.</p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      <div className="detail-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>

          <div>
            <h2 style={{ margin: 0 }}>{user?.name}</h2>
            <p style={{ color: "var(--text)", fontSize: 13 }}>{user?.email}</p>
          </div>

          {!editing && (
            <button
              type="button"
              className="icon-button"
              style={{ marginLeft: "auto" }}
              title="Edit name"
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {editing ? (
          <form className="form-grid" onSubmit={handleSave}>
            <label className="field-label">
              Full name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditing(false);
                  setName(user?.name || "");
                }}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info-grid">
            <div className="info-block">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>

            <div className="info-block">
              <span>Role</span>
              <strong>{user?.role}</strong>
            </div>

            <div className="info-block">
              <span>Member since</span>
              <strong>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
