import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FolderKanban,
  CalendarDays,
  ListTodo,
  GitBranch,
  LayoutDashboard,
  UserRound,
  CornerDownLeft,
} from "lucide-react";

import useWorkspaceData from "../hooks/useWorkspaceData";
import { Spinner } from "./Loading";

const PAGES = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", path: "/projects", icon: FolderKanban },
  { label: "Meetings", path: "/meetings", icon: CalendarDays },
  { label: "Action items", path: "/action-items", icon: ListTodo },
  { label: "Decisions", path: "/decisions", icon: GitBranch },
  { label: "Profile", path: "/profile", icon: UserRound },
];

const MAX_PER_GROUP = 5;

function matches(query, ...fields) {
  return fields.some((field) => field && field.toLowerCase().includes(query));
}

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { data, loading } = useWorkspaceData();

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();

    const pages = PAGES.filter((page) => !q || matches(q, page.label)).map(
      (page) => ({ ...page, key: `page-${page.path}`, hint: "Page" })
    );

    if (!q || !data) {
      return [{ title: q ? "Pages" : "Jump to", items: pages }];
    }

    const projects = data.projects
      .filter((p) => matches(q, p.name, p.description))
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        key: `project-${p._id}`,
        label: p.name,
        hint: p.description || "Project",
        path: `/projects/${p._id}`,
        icon: FolderKanban,
      }));

    const meetings = data.meetings
      .filter((m) => matches(q, m.title, m.notes))
      .slice(0, MAX_PER_GROUP)
      .map((m) => ({
        key: `meeting-${m._id}`,
        label: m.title,
        hint: m.meetingDate
          ? new Date(m.meetingDate).toLocaleDateString(undefined, { dateStyle: "medium" })
          : "Meeting",
        path: `/meetings/${m._id}`,
        icon: CalendarDays,
      }));

    const actions = data.actionItems
      .filter((a) => matches(q, a.title, a.description))
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({
        key: `action-${a._id}`,
        label: a.title,
        hint: a.meetingTitle,
        path: `/meetings/${a.meetingId}?tab=actions`,
        icon: ListTodo,
      }));

    const decisions = data.decisions
      .filter((d) => matches(q, d.title, d.description))
      .slice(0, MAX_PER_GROUP)
      .map((d) => ({
        key: `decision-${d._id}`,
        label: d.title,
        hint: d.meetingTitle,
        path: `/meetings/${d.meetingId}?tab=decisions`,
        icon: GitBranch,
      }));

    return [
      { title: "Projects", items: projects },
      { title: "Meetings", items: meetings },
      { title: "Action items", items: actions },
      { title: "Decisions", items: decisions },
      { title: "Pages", items: pages },
    ].filter((group) => group.items.length > 0);
  }, [query, data]);

  const flat = groups.flatMap((group) => group.items);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(item) {
    if (!item) return;
    onClose();
    navigate(item.path);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(flat[active]);
    } else if (event.key === "Escape") {
      onClose();
    }
  }

  let index = -1;
  const searching = query.trim().length > 0;

  return (
    <div className="palette-overlay" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-input">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, meetings, action items, decisions…"
            aria-label="Search"
          />
          {loading && searching && <Spinner size={16} />}
          <kbd>Esc</kbd>
        </div>

        <div className="palette-results" ref={listRef}>
          {groups.length === 0 ? (
            <div className="palette-empty">
              <strong>No results for “{query}”</strong>
              <span>Try a project name, meeting title or task.</span>
            </div>
          ) : (
            groups.map((group) => (
              <div className="palette-group" key={group.title}>
                <div className="palette-group-title">{group.title}</div>
                {group.items.map((item) => {
                  index += 1;
                  const Icon = item.icon;
                  const isActive = index === active;
                  const itemIndex = index;

                  return (
                    <button
                      type="button"
                      key={item.key}
                      data-index={itemIndex}
                      className={`palette-item ${isActive ? "active" : ""}`}
                      onMouseMove={() => setActive(itemIndex)}
                      onClick={() => go(item)}
                    >
                      <span className="palette-item-icon">
                        <Icon size={16} />
                      </span>
                      <span className="palette-item-text">
                        <strong>{item.label}</strong>
                        {item.hint && <small>{item.hint}</small>}
                      </span>
                      {isActive && <CornerDownLeft size={14} className="palette-enter" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to open</span>
          <span><kbd>Ctrl</kbd><kbd>K</kbd> to toggle</span>
        </div>
      </div>
    </div>
  );
}
