const ActionItem = require("../Models/ActionItem");

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

module.exports = {
  createActionItem,
  getActionItemsForMeeting
};
