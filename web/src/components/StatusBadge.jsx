const LABELS = {
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
};

export default function StatusBadge({ status }) {
  if (!status) {
    return null;
  }

  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] || status}
    </span>
  );
}
