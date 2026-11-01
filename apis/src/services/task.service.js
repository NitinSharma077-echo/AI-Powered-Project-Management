
const Task = require("../Models/Task");
const Project = require("../Models/Project");
const Milestone = require("../Models/Milestone");

const HttpError = require("../utils/httpError");

async function createTask({
  ownerId,
  projectId,
  title,
  description,
  priority,
  assigneeId,
  startDate,
  dueDate,
  estimatedHours,
  milestoneId,
}) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  });

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  if (milestoneId) {
    const milestone = await Milestone.findOne({
      _id: milestoneId,
      projectId,
      ownerId,
    });

    if (!milestone) {
      throw new HttpError("Milestone not found in this project.", 404);
    }
  }

  const task = await Task.create({
    ownerId,
    createdBy: ownerId,
    projectId,
    title,
    description,
    priority,
    assigneeId: assigneeId || null,
    startDate: startDate || null,
    dueDate: dueDate || null,
    estimatedHours: estimatedHours ?? null,
    milestoneId: milestoneId || null,
  });

  return task;
}

async function getTasksForProject({ ownerId, projectId }) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return Task.find({ ownerId, projectId })
    .populate("assigneeId", "name email")
    .populate("milestoneId", "title dueDate status")
    .sort({ createdAt: -1 });
}

async function updateTask({ ownerId, taskId, updates }) {
  const allowedFields = [
    "title",
    "description",
    "priority",
    "assigneeId",
    "startDate",
    "dueDate",
    "estimatedHours",
    "actualHours",
    "milestoneId",
  ];

  const safeUpdates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      safeUpdates[field] = updates[field];
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, ownerId },
    { $set: safeUpdates },
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new HttpError("Task not found.", 404);
  }

  return task;
}

async function updateTaskStatus({ ownerId, taskId, status }) {
  const allowedStatuses = [
    "backlog",
    "todo",
    "in_progress",
    "blocked",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new HttpError("Invalid task status.", 400);
  }

  const task = await Task.findOne({ _id: taskId, ownerId });

  if (!task) {
    throw new HttpError("Task not found.", 404);
  }

  task.status = status;
  task.completedAt = status === "completed" ? new Date() : null;

  await task.save();

  return task;
}

module.exports = {
  createTask,
  getTasksForProject,
  updateTask,
  updateTaskStatus,
};
