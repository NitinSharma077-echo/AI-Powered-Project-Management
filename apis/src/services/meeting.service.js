const Meeting = require("../Models/Meeting");
const Decision = require("../Models/decision");
const ActionItem = require("../Models/ActionItem");
const HttpError = require("../utils/httpError");

async function createMeeting({ ownerId, title, projectId, meetingDate, notes, participants }) {
  return Meeting.create({
    owner: ownerId,
    title,
    project: projectId || null,
    meetingDate,
    notes,
    participants
  });
}

async function getMeetingsForOwner(ownerId) {
  return Meeting.find({ owner: ownerId }).sort({ meetingDate: -1 });
}

async function getMeetingById(ownerId, meetingId) {
  return Meeting.findOne({ _id: meetingId, owner: ownerId });
}

async function findOwnedMeeting(ownerId, meetingId) {
  const meeting = await getMeetingById(ownerId, meetingId);

  if (!meeting) {
    throw new HttpError("Meeting not found", 404);
  }

  return meeting;
}

// Only the fields present in `updates` are changed.
async function updateMeeting({ ownerId, meetingId, updates }) {
  const meeting = await findOwnedMeeting(ownerId, meetingId);

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || !updates.title.trim()) {
      throw new HttpError("Meeting title is required", 400);
    }
    meeting.title = updates.title.trim();
  }

  if (updates.notes !== undefined) {
    meeting.notes = typeof updates.notes === "string" ? updates.notes : "";
  }

  if (updates.meetingDate !== undefined) {
    meeting.meetingDate = updates.meetingDate || null;
  }

  if (updates.projectId !== undefined) {
    meeting.project = updates.projectId || null;
  }

  return meeting.save();
}

async function deleteMeeting({ ownerId, meetingId }) {
  const meeting = await findOwnedMeeting(ownerId, meetingId);

  await Promise.all([
    Decision.deleteMany({ owner: ownerId, meeting: meeting._id }),
    ActionItem.deleteMany({ owner: ownerId, meeting: meeting._id })
  ]);

  await meeting.deleteOne();
}

async function addFollowUp({ ownerId, meetingId, text }) {
  if (typeof text !== "string" || !text.trim()) {
    throw new HttpError("Follow-up text is required", 400);
  }

  const meeting = await findOwnedMeeting(ownerId, meetingId);
  meeting.followUps.push({ text: text.trim() });

  return meeting.save();
}

async function removeFollowUp({ ownerId, meetingId, followUpId }) {
  const meeting = await findOwnedMeeting(ownerId, meetingId);
  const followUp = meeting.followUps.id(followUpId);

  if (!followUp) {
    throw new HttpError("Follow-up not found", 404);
  }

  followUp.deleteOne();
  return meeting.save();
}

module.exports = {
  createMeeting,
  getMeetingsForOwner,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  addFollowUp,
  removeFollowUp
};
