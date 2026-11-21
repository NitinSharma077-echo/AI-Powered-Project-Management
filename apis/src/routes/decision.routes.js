
const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createDecision,
  getDecisionsForMeeting,
  updateDecisionStatus,
  updateDecision,
  deleteDecision
} = require("../services/decision.service");

// GET /api/meetings/:meetingId/decisions
router.get("/", async (req, res, next) => {
  try {
    const decisions = await getDecisionsForMeeting({
      ownerId: req.user._id,
      meetingId: req.params.meetingId
    });

    res.status(200).json({ data: decisions });
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:meetingId/decisions
router.post("/", async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Decision title is required"
      });
    }

    const decision = await createDecision({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      title: title.trim(),
      description
    });

    res.status(201).json({ data: decision });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/meetings/:meetingId/decisions/:decisionId/status
router.patch("/:decisionId/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    const decision = await updateDecisionStatus({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      decisionId: req.params.decisionId,
      status
    });

    res.status(200).json({ data: decision });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/meetings/:meetingId/decisions/:decisionId
router.patch("/:decisionId", async (req, res, next) => {
  try {
    const decision = await updateDecision({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      decisionId: req.params.decisionId,
      updates: req.body
    });

    res.status(200).json({ data: decision });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/meetings/:meetingId/decisions/:decisionId
router.delete("/:decisionId", async (req, res, next) => {
  try {
    await deleteDecision({
      ownerId: req.user._id,
      meetingId: req.params.meetingId,
      decisionId: req.params.decisionId
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
