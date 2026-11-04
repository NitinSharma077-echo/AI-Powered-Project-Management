import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  GitBranch,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useParallax, useReveal } from "../hooks/useReveal";

const SERVICES = [
  {
    icon: Sparkles,
    name: "Meeting intelligence",
    copy:
      "Drop in a transcript. Get decisions, owners and action items separated out and attributed.",
  },
  {
    icon: ListChecks,
    name: "Action tracking",
    copy:
      "Every commitment made in the room becomes a tracked item with a status and a due date.",
  },
  {
    icon: GitBranch,
    name: "AI planning",
    copy:
      "Turn a project brief into milestones, tasks and dependencies you can review and approve.",
  },
  {
    icon: BarChart3,
    name: "Analytics",
    copy:
      "See throughput, blockers and decision velocity across every project in one view.",
  },
];

const STEPS = [
  {
    label: "Record",
    copy:
      "Hold the meeting as you always do. Paste the transcript or notes when it ends.",
  },
  {
    label: "Extract",
    copy:
      "The AI service separates decisions from discussion, and commitments from intent.",
  },
  {
    label: "Execute",
    copy:
      "Items land on the taskboard with owners attached, and progress rolls up to analytics.",
  },
];

const STATS = [
  { value: "12x", label: "Faster meeting write-ups" },
  { value: "100%", label: "Decisions captured with an owner" },
  { value: "3", label: "Services, one workspace" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef(null);

  useReveal();
  useParallax(heroRef);

  return (
    <div className="landing">
      <header className="lp-header">
        <Link to="/" className="lp-brand">
          <span className="lp-brand-mark">M</span>
          MeetFlow
        </Link>

        <nav className="lp-nav">
          <a className="lp-nav-link" href="#work">
            Work
          </a>
          <a className="lp-nav-link" href="#process">
            Process
          </a>
          <a className="lp-nav-link" href="#numbers">
            Numbers
          </a>
        </nav>

        <div className="lp-header-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="lp-btn lp-btn-solid">
              Dashboard
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="lp-btn lp-btn-solid">
                Get started
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}

      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-copy">
          <p className="lp-eyebrow" data-reveal>
            <span className="lp-dot" />
            AI project management
          </p>

          <h1 className="lp-display">
            <span className="lp-line" data-reveal>
              <span>Meetings</span>
            </span>
            <span className="lp-line" data-reveal data-reveal-delay="90">
              <span>
                that <em>decide</em>
              </span>
            </span>
            <span className="lp-line" data-reveal data-reveal-delay="180">
              <span>themselves</span>
            </span>
          </h1>

          <p className="lp-lede" data-reveal data-reveal-delay="260">
            MeetFlow turns the conversation into decisions, owners and tracked
            work. No one leaves the room wondering who agreed to what.
          </p>

          <div className="lp-hero-actions" data-reveal data-reveal-delay="340">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="lp-btn lp-btn-solid lp-btn-lg"
            >
              {isAuthenticated ? "Open dashboard" : "Start free"}
              <ArrowRight size={17} />
            </Link>

            <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#work">
              See how it works
            </a>
          </div>
        </div>

        {/* Product UI as the hero image: real panels, drifting on scroll
            and tilting toward the pointer. */}
        <div className="lp-stage" aria-hidden="true">
          <div className="lp-panel lp-panel-board" data-depth="1">
            <div className="lp-panel-bar">
              <span className="lp-panel-title">Taskboard</span>
              <span className="lp-chip">Sprint 14</span>
            </div>

            <div className="lp-board">
              <div className="lp-col">
                <span className="lp-col-head">To do</span>
                <div className="lp-task">
                  <span className="lp-task-tag lp-tag-high">High</span>
                  Draft API contract
                </div>
                <div className="lp-task">
                  <span className="lp-task-tag">Low</span>
                  Update changelog
                </div>
              </div>

              <div className="lp-col">
                <span className="lp-col-head">In progress</span>
                <div className="lp-task">
                  <span className="lp-task-tag lp-tag-mid">Medium</span>
                  Auth rate limiting
                </div>
              </div>

              <div className="lp-col">
                <span className="lp-col-head">Done</span>
                <div className="lp-task lp-task-done">
                  <CheckCircle2 size={13} />
                  Schema review
                </div>
              </div>
            </div>
          </div>

          <div className="lp-panel lp-panel-chart" data-depth="2">
            <div className="lp-panel-bar">
              <span className="lp-panel-title">Decision velocity</span>
            </div>

            <div className="lp-bars">
              {[38, 56, 44, 72, 61, 88, 79].map((height, index) => (
                <span
                  key={index}
                  className="lp-bar"
                  style={{ "--h": `${height}%`, "--i": index }}
                />
              ))}
            </div>
          </div>

          <div className="lp-panel lp-panel-item" data-depth="3">
            <span className="lp-panel-title">Action item</span>

            <p className="lp-item-text">
              Ship the migration plan before Friday standup.
            </p>

            <div className="lp-item-foot">
              <span className="lp-avatar">NS</span>
              <span className="lp-chip lp-chip-accent">Owner assigned</span>
            </div>
          </div>

          <div className="lp-panel lp-panel-meeting" data-depth="2">
            <CalendarCheck size={15} />
            <span>
              <strong>4 decisions</strong> extracted
            </span>
          </div>
        </div>

        <span className="lp-scroll-cue">Scroll down</span>
      </section>

      {/* ---------------- Marquee ---------------- */}

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {Array.from({ length: 2 }).map((_, pass) => (
            <span className="lp-marquee-group" key={pass}>
              {[
                "Decisions",
                "Action items",
                "Milestones",
                "Dependencies",
                "Analytics",
                "Transcripts",
              ].map((word) => (
                <span className="lp-marquee-word" key={word}>
                  {word}
                  <span className="lp-marquee-star">✳</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- Services ---------------- */}

      <section className="lp-section" id="work">
        <div className="lp-section-head">
          <span className="lp-kicker" data-reveal>
            01 — What it does
          </span>

          <h2 className="lp-h2" data-reveal data-reveal-delay="80">
            Four surfaces,
            <br />
            one source of truth
          </h2>
        </div>

        <div className="lp-services">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;

            return (
              <article
                className="lp-service"
                key={service.name}
                data-reveal
                data-reveal-delay={index * 90}
              >
                <span className="lp-service-index">
                  0{index + 1}
                </span>

                <Icon className="lp-service-icon" size={26} strokeWidth={1.6} />

                <h3 className="lp-service-name">{service.name}</h3>

                <p className="lp-service-copy">{service.copy}</p>

                <ArrowUpRight className="lp-service-arrow" size={18} />
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------- Process ---------------- */}

      <section className="lp-section lp-section-dark" id="process">
        <div className="lp-section-head">
          <span className="lp-kicker" data-reveal>
            02 — Process
          </span>

          <h2 className="lp-h2" data-reveal data-reveal-delay="80">
            Record. Extract.
            <br />
            Execute.
          </h2>
        </div>

        <ol className="lp-steps">
          {STEPS.map((step, index) => (
            <li
              className="lp-step"
              key={step.label}
              data-reveal
              data-reveal-delay={index * 120}
            >
              <span className="lp-step-num">0{index + 1}</span>

              <h3 className="lp-step-label">{step.label}</h3>

              <p className="lp-step-copy">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- Numbers ---------------- */}

      <section className="lp-section" id="numbers">
        <div className="lp-stats">
          {STATS.map((stat, index) => (
            <div
              className="lp-stat"
              key={stat.label}
              data-reveal
              data-reveal-delay={index * 100}
            >
              <strong className="lp-stat-value">{stat.value}</strong>
              <span className="lp-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}

      <section className="lp-cta">
        <h2 className="lp-cta-head" data-reveal>
          Get in touch
        </h2>

        <p className="lp-cta-copy" data-reveal data-reveal-delay="90">
          Spin up a workspace and run your next meeting through it.
        </p>

        <Link
          to={isAuthenticated ? "/dashboard" : "/register"}
          className="lp-btn lp-btn-solid lp-btn-lg"
          data-reveal
          data-reveal-delay="160"
        >
          {isAuthenticated ? "Open dashboard" : "Create account"}
          <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="lp-footer">
        <span className="lp-footer-brand">MeetFlow AI</span>

        <nav className="lp-footer-nav">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
          <a href="#work">Work</a>
          <a href="#process">Process</a>
        </nav>

        <span className="lp-footer-note">
          Built with React, Express and FastAPI
        </span>
      </footer>
    </div>
  );
}
