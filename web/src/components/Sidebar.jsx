import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ListTodo,
  GitBranch,
  UserRound,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { initialsOf } from "../utils/format";
import Logo from "./Logo";

const sections = [
  {
    label: "Workspace",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Projects", path: "/projects", icon: FolderKanban },
      { name: "Meetings", path: "/meetings", icon: CalendarDays },
    ],
  },
  {
    label: "Track",
    items: [
      { name: "Action items", path: "/action-items", icon: ListTodo },
      { name: "Decisions", path: "/decisions", icon: GitBranch },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onClose, onToggle }) {
  const { user } = useAuth();

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <Logo />

          <div className="sidebar-brand-text">
            <strong>
              MeetFlow <span>AI</span>
            </strong>
            <small>Meeting intelligence</small>
          </div>

          <button
            type="button"
            className="sidebar-close icon-button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.label}>
              <div className="sidebar-label">{section.label}</div>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    <Icon size={18} />
                    <span className="nav-text">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-user ${isActive ? "active" : ""}`}
            title={collapsed ? "Profile" : undefined}
          >
            <span className="user-avatar small">{initialsOf(user?.name)}</span>
            <span className="sidebar-user-text">
              <strong>{user?.name || "Your profile"}</strong>
              <small>{user?.email}</small>
            </span>
            <UserRound size={16} className="sidebar-user-icon" />
          </NavLink>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span className="nav-text">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
