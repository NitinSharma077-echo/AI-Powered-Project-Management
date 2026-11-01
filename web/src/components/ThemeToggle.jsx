import { useState } from "react";
import { Sun, Moon } from "lucide-react";

// The initial theme is applied by the bootstrap script in index.html,
// so read it back off the document rather than re-deriving it here.
function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme);
  const isDark = theme === "dark";

  function toggle() {
    const next = isDark ? "light" : "dark";

    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    try {
      localStorage.setItem("meetflow_theme", next);
    } catch {
      // Private browsing - the theme still applies for this session.
    }

    setTheme(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className="switch"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      data-tooltip={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="switch-thumb">
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}
