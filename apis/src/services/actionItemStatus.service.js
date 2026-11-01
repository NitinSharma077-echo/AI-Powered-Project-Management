const ActionItem = require("../Models/ActionItem");

const VALID_STATUSES = ["todo", "in_progress", "blocked", "completed", "cancelled"];

async function updateActionItemStatus({ ownerId, meetingId, actionItemId, status }) {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const actionItem = await ActionItem.findOne({
    _id: actionItemId,
    owner: ownerId,
    meeting: meetingId
  });

  if (!actionItem) {
    const error = new Error("Action item not found");
    error.statusCode = 404;
    throw error;
  }

  actionItem.status = status;
  actionItem.completedAt = status === "completed" ? new Date() : null;

  return actionItem.save();
}

module.exports = {
  updateActionItemStatus
};
