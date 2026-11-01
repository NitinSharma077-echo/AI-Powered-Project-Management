import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, User, ArrowRight } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(form);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <div className="auth-decoration-content">
          <div className="brand-icon large">M</div>

          <h1>
            Start running
            <br />
            better meetings.
          </h1>

          <p>
            Create your workspace and turn every meeting into
            decisions and tracked action items.
          </p>

          <div className="auth-feature">
            <span>✦</span>
            AI-powered meeting intelligence
          </div>

          <div className="auth-feature">
            <span>✓</span>
            Clear decisions and accountability
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-mobile-brand">
            <div className="brand-icon">M</div>
            <strong>MeetFlow AI</strong>
          </div>

          <div className="auth-heading">
            <h2>Create your account</h2>
            <p>Set up your workspace in a minute.</p>
          </div>

          <label className="field-label">
            Full name
            <div className="input-with-icon">
              <User size={17} />
              <input
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          </label>

          <label className="field-label">
            Email address
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="field-label">
            Password
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
