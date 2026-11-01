
const Milestone = require("../Models/Milestone");
const Project = require("../Models/Project");
const HttpError = require("../utils/httpError");

async function createMilestone({
  ownerId,
  projectId,
  title,
  description,
  dueDate,
  order,
}) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return Milestone.create({
    ownerId,
    projectId,
    title,
    description,
    dueDate,
    order: order ?? 0,
  });
}

async function getMilestonesForProject({ ownerId, projectId }) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return Milestone.find({ ownerId, projectId }).sort({
    order: 1,
    dueDate: 1,
  });
}

async function updateMilestoneStatus({ ownerId, milestoneId, status }) {
  const allowedStatuses = [
    "upcoming",
    "in_progress",
    "completed",
    "missed",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new HttpError("Invalid milestone status.", 400);
  }

  const milestone = await Milestone.findOne({
    _id: milestoneId,
    ownerId,
  });

  if (!milestone) {
    throw new HttpError("Milestone not found.", 404);
  }

  milestone.status = status;
  milestone.completedAt =
    status === "completed" ? new Date() : null;

  await milestone.save();

  return milestone;
}

module.exports = {
  createMilestone,
  getMilestonesForProject,
  updateMilestoneStatus,
};
