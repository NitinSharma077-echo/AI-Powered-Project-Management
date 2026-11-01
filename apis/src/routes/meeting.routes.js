
const express = require("express");
const router = express.Router();

const {
  createMeeting,
  getMeetingsForOwner,
  getMeetingById
} = require("../services/meeting.service");

// GET /api/meetings
router.get("/", async (req, res, next) => {
  try {
    const meetings = await getMeetingsForOwner(req.user._id);

    res.status(200).json({ data: meetings });
  } catch (error) {
    next(error);
  }
});

// GET /api/meetings/:meetingId
router.get("/:meetingId", async (req, res, next) => {
  try {
    const meeting = await getMeetingById(req.user._id, req.params.meetingId);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.status(200).json({ data: meeting });
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      projectId,
      meetingDate,
      notes,
      participants
    } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Meeting title is required"
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        error: "Meeting title cannot exceed 200 characters"
      });
    }

    const meeting = await createMeeting({
      ownerId: req.user._id,
      title: title.trim(),
      projectId,
      meetingDate,
      notes,
      participants
    });

    res.status(201).json({ data: meeting });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

