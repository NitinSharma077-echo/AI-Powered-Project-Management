import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";

const COLLAPSED_KEY = "meetflow_sidebar_collapsed";
const MOBILE_QUERY = "(max-width: 960px)";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const location = useLocation();

  // Desktop: collapsed to an icon rail (remembered). Mobile: drawer.
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setMobileOpen((open) => !open);
      return;
    }

    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Not remembered, but still applies for this visit.
      }
      return next;
    });
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Ctrl/Cmd+K or "/" opens search; Ctrl/Cmd+B toggles the sidebar.
  useEffect(() => {
    function handleKey(event) {
      const mod = event.ctrlKey || event.metaKey;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) ||
        event.target.isContentEditable;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      } else if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [toggleSidebar]);

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggle={toggleSidebar}
      />

      <div className="main-area">
        <Navbar
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="page-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
