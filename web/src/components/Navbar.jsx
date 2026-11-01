import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-separator">/</span>
          <strong>MeetFlow AI</strong>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="icon-button"
          aria-label="Search"
          data-tooltip="Search"
        >
          <Search size={19} />
        </button>

        <button
          className="icon-button"
          aria-label="Notifications"
          data-tooltip="Notifications"
        >
          <Bell size={19} />
        </button>

        <ThemeToggle />

        <div className="user-avatar" title={user?.name || user?.email}>
          {initials}
        </div>
      </div>
    </header>
  );
}