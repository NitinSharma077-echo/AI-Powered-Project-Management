const Decision = require("../Models/decision");

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

const VALID_STATUSES = ["proposed", "approved", "rejected"];

async function updateDecisionStatus({ ownerId, meetingId, decisionId, status }) {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const decision = await Decision.findOne({
    _id: decisionId,
    owner: ownerId,
    meeting: meetingId
  });

  if (!decision) {
    const error = new Error("Decision not found");
    error.statusCode = 404;
    throw error;
  }

  decision.status = status;
  decision.decidedAt = status === "approved" ? new Date() : null;

  return decision.save();
}

module.exports = {
  createDecision,
  getDecisionsForMeeting,
  updateDecisionStatus
};
