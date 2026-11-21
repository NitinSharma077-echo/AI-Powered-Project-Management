const ActionItem = require("../Models/ActionItem");
const HttpError = require("../utils/httpError");

const PRIORITIES = ["low", "medium", "high", "urgent"];

async function createActionItem({ ownerId, meetingId, title, description, assigneeId, dueDate, priority }) {
  return ActionItem.create({
    owner: ownerId,
    meeting: meetingId,
    title,
    description,
    assignee: assigneeId || null,
    dueDate,
    priority
  });
}

async function getActionItemsForMeeting({ ownerId, meetingId }) {
  return ActionItem.find({ owner: ownerId, meeting: meetingId }).sort({ createdAt: -1 });
}

async function findOwnedActionItem({ ownerId, meetingId, actionItemId }) {
  const item = await ActionItem.findOne({
    _id: actionItemId,
    owner: ownerId,
    meeting: meetingId
  });

  if (!item) {
    throw new HttpError("Action item not found", 404);
  }

  return item;
}

// Only the fields present in `updates` are changed.
async function updateActionItem({ ownerId, meetingId, actionItemId, updates }) {
  const item = await findOwnedActionItem({ ownerId, meetingId, actionItemId });

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || !updates.title.trim()) {
      throw new HttpError("Action item title is required", 400);
    }
    if (updates.title.trim().length > 200) {
      throw new HttpError("Action item title cannot exceed 200 characters", 400);
    }
    item.title = updates.title.trim();
  }

  if (updates.description !== undefined) {
    item.description = updates.description || "";
  }

  if (updates.dueDate !== undefined) {
    item.dueDate = updates.dueDate || null;
  }

  if (updates.priority !== undefined) {
    if (!PRIORITIES.includes(updates.priority)) {
      throw new HttpError(`Priority must be one of: ${PRIORITIES.join(", ")}`, 400);
    }
    item.priority = updates.priority;
  }

  return item.save();
}

async function deleteActionItem({ ownerId, meetingId, actionItemId }) {
  const item = await findOwnedActionItem({ ownerId, meetingId, actionItemId });
  await item.deleteOne();
}

module.exports = {
  createActionItem,
  getActionItemsForMeeting,
  updateActionItem,
  deleteActionItem
};
