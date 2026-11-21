import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  description = "Create your first item to get started.",
  icon: Icon = Inbox,
  action = null,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
