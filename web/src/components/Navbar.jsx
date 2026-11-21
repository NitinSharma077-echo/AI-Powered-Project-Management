import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import NotificationsMenu from "./NotificationsMenu";
import { initialsOf } from "../utils/format";

const SECTION_NAMES = {
  dashboard: "Dashboard",
  projects: "Projects",
  meetings: "Meetings",
  "action-items": "Action items",
  decisions: "Decisions",
  profile: "Profile",
};

const SUBPAGE_NAMES = {
  plan: "AI planner",
  tasks: "Task board",
  analytics: "Analytics",
  roadmap: "Roadmap",
};

function useCrumbs() {
  const { pathname } = useLocation();
  const [section, id, sub] = pathname.split("/").filter(Boolean);

  const crumbs = [{ label: SECTION_NAMES[section] || "Workspace", to: `/${section}` }];
  if (id) crumbs.push({ label: section === "meetings" ? "Meeting" : "Project", to: `/${section}/${id}` });
  if (sub) crumbs.push({ label: SUBPAGE_NAMES[sub] || sub });

  return crumbs;
}

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

export default function Navbar({ collapsed, onToggleSidebar, onOpenSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const crumbs = useCrumbs();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleClick(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          data-tooltip={collapsed ? "Show sidebar" : "Hide sidebar"}
        >
          <span className="only-desktop">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </span>
          <span className="only-mobile">
            <Menu size={19} />
          </span>
        </button>

        <nav className="breadcrumb" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;

            return (
              <span className="breadcrumb-item" key={`${crumb.label}-${index}`}>
                {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
                {last || !crumb.to ? (
                  <strong aria-current="page">{crumb.label}</strong>
                ) : (
                  <Link to={crumb.to}>{crumb.label}</Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="search-trigger"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <Search size={16} />
          <span className="search-trigger-text">Search…</span>
          <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>

        <NotificationsMenu />
        <ThemeToggle />

        <div className="popover-anchor" ref={menuRef}>
          <button
            type="button"
            className="user-avatar"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            {initialsOf(user?.name)}
          </button>

          {menuOpen && (
            <div className="popover user-menu" role="menu">
              <div className="user-menu-head">
                <span className="user-avatar">{initialsOf(user?.name)}</span>
                <span>
                  <strong>{user?.name}</strong>
                  <small>{user?.email}</small>
                </span>
              </div>
              <Link
                to="/profile"
                className="menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <UserRound size={16} />
                Profile & settings
              </Link>
              <button
                type="button"
                className="menu-item danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
