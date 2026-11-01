const Meeting = require("../Models/Meeting");
const { analyzeMeetingWithAI } = require("../services/ai.service");

async function analyzeMeeting(req, res, next) {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({
      _id: meetingId,
      owner: req.user._id
    }).populate("participants", "name");

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.notes || meeting.notes.trim().length < 20) {
      return res.status(400).json({
        error: "Add at least 20 characters of meeting notes before analyzing."
      });
    }

    const analysis = await analyzeMeetingWithAI(meeting);

    res.status(200).json({ data: analysis });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeMeeting
};
