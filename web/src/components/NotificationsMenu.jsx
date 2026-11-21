import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, AlertCircle, Clock, GitBranch, CheckCheck } from "lucide-react";

import useWorkspaceData from "../hooks/useWorkspaceData";
import { Spinner } from "./Loading";

const SEEN_KEY = "meetflow_seen_notifications";
const DUE_SOON_DAYS = 3;
const REFRESH_MS = 5 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSeen(ids) {
  try {
    // Keep the list bounded; old ids drop off naturally.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-300)));
  } catch {
    // Storage blocked - read state lasts for this page view only.
  }
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function dayLabel(days) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days < 0 ? `${-days} days ago` : `in ${days} days`;
}

// Turn workspace data into notifications, most urgent first.
function buildNotifications(data) {
  if (!data) return [];

  const today = startOfToday();
  const list = [];

  for (const item of data.actionItems) {
    if (!item.dueDate || ["completed", "cancelled"].includes(item.status)) continue;

    const due = new Date(item.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const days = Math.round((dueDay - today) / DAY);

    if (days < 0 || days <= DUE_SOON_DAYS) {
      list.push({
        id: `action-${item._id}-${item.dueDate}`,
        kind: days < 0 ? "overdue" : "due",
        title: item.title,
        detail: `${days < 0 ? "Overdue" : "Due"} ${dayLabel(days)} · ${item.meetingTitle}`,
        path: `/meetings/${item.meetingId}?tab=actions`,
        rank: days,
      });
    }
  }

  for (const decision of data.decisions) {
    if (decision.status !== "proposed") continue;

    list.push({
      id: `decision-${decision._id}`,
      kind: "decision",
      title: decision.title,
      detail: `Decision awaiting approval · ${decision.meetingTitle}`,
      path: `/meetings/${decision.meetingId}?tab=decisions`,
      rank: 100,
    });
  }

  return list.sort((a, b) => a.rank - b.rank);
}

const ICONS = {
  overdue: AlertCircle,
  due: Clock,
  decision: GitBranch,
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const ref = useRef(null);

  const { data, loading, error, refresh } = useWorkspaceData({ refreshMs: REFRESH_MS });
  const notifications = useMemo(() => buildNotifications(data), [data]);
  const unread = notifications.filter((item) => !seen.has(item.id)).length;

  useEffect(() => {
    if (!open) return undefined;

    function handleClick(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggle() {
    if (!open) refresh(false);
    setOpen((value) => !value);
  }

  function markAllRead() {
    const next = new Set([...seen, ...notifications.map((item) => item.id)]);
    setSeen(next);
    writeSeen(next);
  }

  function markRead(id) {
    const next = new Set([...seen, id]);
    setSeen(next);
    writeSeen(next);
    setOpen(false);
  }

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        type="button"
        className={`icon-button ${open ? "is-active" : ""}`}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        data-tooltip="Notifications"
        onClick={toggle}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notify-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="popover notifications" role="dialog" aria-label="Notifications">
          <div className="popover-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="text-link" onClick={markAllRead}>
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="popover-body">
            {loading && !data ? (
              <div className="popover-empty">
                <Spinner />
                <span>Checking for updates…</span>
              </div>
            ) : error && !data ? (
              <div className="popover-empty">
                <strong>Couldn’t load notifications</strong>
                <span>Check your connection and try again.</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="popover-empty">
                <span className="popover-empty-icon">
                  <CheckCheck size={20} />
                </span>
                <strong>You’re all caught up</strong>
                <span>Overdue tasks and decisions needing review appear here.</span>
              </div>
            ) : (
              notifications.map((item) => {
                const Icon = ICONS[item.kind];
                const isUnread = !seen.has(item.id);

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`notification ${isUnread ? "unread" : ""}`}
                    onClick={() => markRead(item.id)}
                  >
                    <span className={`notification-icon ${item.kind}`}>
                      <Icon size={15} />
                    </span>
                    <span className="notification-text">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    {isUnread && <span className="unread-dot" aria-label="Unread" />}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
