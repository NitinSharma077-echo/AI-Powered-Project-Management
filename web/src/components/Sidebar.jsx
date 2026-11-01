import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ListTodo,
  GitBranch,
  UserRound,
  X,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Meetings",
    path: "/meetings",
    icon: CalendarDays,
  },
  {
    name: "Action Items",
    path: "/action-items",
    icon: ListTodo,
  },
  {
    name: "Decisions",
    path: "/decisions",
    icon: GitBranch,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: UserRound,
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">M</div>

          <div>
            <h2>
              MeetFlow <span>AI</span>
            </h2>
            <small>MEETING INTELLIGENCE</small>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <GitBranch size={16} />
          </div>

          <div>
            <strong>MeetFlow AI</strong>
            <small>Workspace version 1.0</small>
          </div>
        </div>
      </aside>
    </>
  );
}