const Decision = require("../Models/decision");
const HttpError = require("../utils/httpError");

const VALID_STATUSES = ["proposed", "approved", "rejected"];

async function createDecision({ ownerId, meetingId, title, description }) {
  return Decision.create({
    owner: ownerId,
    meeting: meetingId,
    title,
    description
  });
}

async function getDecisionsForMeeting({ ownerId, meetingId }) {
  return Decision.find({ owner: ownerId, meeting: meetingId }).sort({ createdAt: -1 });
}

async function findOwnedDecision({ ownerId, meetingId, decisionId }) {
  const decision = await Decision.findOne({
    _id: decisionId,
    owner: ownerId,
    meeting: meetingId
  });

  if (!decision) {
    throw new HttpError("Decision not found", 404);
  }

  return decision;
}

async function updateDecisionStatus({ ownerId, meetingId, decisionId, status }) {
  if (!VALID_STATUSES.includes(status)) {
    throw new HttpError(`Status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }

  const decision = await findOwnedDecision({ ownerId, meetingId, decisionId });

  decision.status = status;
  decision.decidedAt = status === "approved" ? new Date() : null;

  return decision.save();
}

// Only the fields present in `updates` are changed.
async function updateDecision({ ownerId, meetingId, decisionId, updates }) {
  const decision = await findOwnedDecision({ ownerId, meetingId, decisionId });

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || !updates.title.trim()) {
      throw new HttpError("Decision title is required", 400);
    }
    decision.title = updates.title.trim();
  }

  if (updates.description !== undefined) {
    decision.description = updates.description || "";
  }

  return decision.save();
}

async function deleteDecision({ ownerId, meetingId, decisionId }) {
  const decision = await findOwnedDecision({ ownerId, meetingId, decisionId });
  await decision.deleteOne();
}

module.exports = {
  createDecision,
  getDecisionsForMeeting,
  updateDecisionStatus,
  updateDecision,
  deleteDecision
};
