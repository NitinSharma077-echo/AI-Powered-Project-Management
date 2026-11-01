const Meeting = require("../Models/Meeting");

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

module.exports = {
  createMeeting,
  getMeetingsForOwner,
  getMeetingById
};
