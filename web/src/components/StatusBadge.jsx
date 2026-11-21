import { labelOf } from "../utils/format";

export default function StatusBadge({ status }) {
  if (!status) {
    return null;
  }

  return <span className={`badge badge-${status}`}>{labelOf(status)}</span>;
}
