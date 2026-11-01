
const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createActionItem,
  getActionItemsForMeeting
} = require("../services/actionItem.service");

const {
  updateActionItemStatus
} = require("../services/actionItemStatus.service");

// GET /api/meetings/:meetingId/action-items
router.get("/", async (req, res, next) => {
  try {
    const items = await getActionItemsForMeeting({
      ownerId: req.user._id,
      meetingId: req.params.meetingId
    });

    res.status(200).json({ data: items });
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:meetingId/action-items
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      description,
      assigneeId,
      dueDate,
      priority
    } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Action item title is required"
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        error: "Action item title cannot exceed 200 characters"
      });
    }

    const item = await createActionItem({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      title: title.trim(),
      description,
      assigneeId,
      dueDate,
      priority
    });

    res.status(201).json({ data: item });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/meetings/:meetingId/action-items/:actionItemId/status
router.patch("/:actionItemId/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    const item = await updateActionItemStatus({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      actionItemId: req.params.actionItemId,
      status
    });

    res.status(200).json({ data: item });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
