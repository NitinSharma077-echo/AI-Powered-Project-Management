import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { getLastEmail } from "../services/session";
import { Spinner } from "../components/Loading";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState(() => ({ email: getLastEmail(), password: "" }));
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ ...form, remember });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <div className="auth-decoration-content">
          <div className="brand-icon large">M</div>

          <h1>
            Meetings that move
            <br />
            work forward.
          </h1>

          <p>Turn conversations into decisions, action items and measurable progress.</p>

          <div className="auth-feature">
            <Sparkles size={16} />
            AI analysis of notes and transcripts
          </div>
          <div className="auth-feature">
            <CheckCircle2 size={16} />
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
            <h2>Welcome back</h2>
            <p>Sign in to your workspace.</p>
          </div>

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
                autoFocus={!form.email}
              />
            </div>
          </label>

          <label className="field-label">
            Password
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                autoFocus={Boolean(form.email)}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>
              <strong>Keep me signed in</strong>
              <small>Stay signed in on this device for 30 days.</small>
            </span>
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? <Spinner size={15} /> : null}
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <p className="auth-switch">
            Don’t have an account? <Link to="/register">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
