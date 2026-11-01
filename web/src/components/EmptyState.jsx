import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  description = "Create your first item to get started.",
}) {
  return (
    <div className="empty-state">
      <Inbox size={35} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}