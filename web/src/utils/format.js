// One place for how names, dates and statuses are shown across the app.

// A reference may arrive as a plain id or populated into a document
// (e.g. task.milestoneId -> { _id, title }). Always returns the id string.
export function idOf(ref) {
  if (!ref) return null;
  return typeof ref === "object" ? ref._id || null : ref;
}

export function initialsOf(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Accepts "YYYY-MM-DD" (treated as a local calendar day, so it never shifts
// by a day across time zones) or a full ISO timestamp.
export function toDate(value) {
  if (!value) return null;

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, fallback = "No date") {
  const date = toDate(value);
  if (!date) return fallback;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Value for an <input type="date">.
export function toInputDate(value) {
  const date = toDate(value);
  if (!date) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY = 24 * 60 * 60 * 1000;

// Whole days from today (negative = past).
export function daysFromToday(value) {
  const date = toDate(value);
  if (!date) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day - today) / DAY);
}

export function relativeDue(value) {
  const days = daysFromToday(value);
  if (days === null) return "";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Overdue by 1 day";
  if (days < 0) return `Overdue by ${-days} days`;
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatDate(value)}`;
}

export function isOverdue(value, status) {
  const days = daysFromToday(value);
  return days !== null && days < 0 && !["completed", "cancelled"].includes(status);
}

export const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
  cancelled: "Cancelled",
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
  active: "Active",
  archived: "Archived",
  upcoming: "Upcoming",
  missed: "Missed",
};

export function labelOf(status) {
  return STATUS_LABELS[status] || status;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
