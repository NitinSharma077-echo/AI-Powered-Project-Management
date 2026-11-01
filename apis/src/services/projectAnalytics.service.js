
const Project = require("../Models/Project");
const Task = require("../Models/Task");
const Milestone = require("../Models/Milestone");
const Dependency = require("../Models/Dependency");
const HttpError = require("../utils/httpError");

async function getProjectOverview({ ownerId, projectId }) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id name description");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  const now = new Date();

  const tasks = await Task.find({
    ownerId,
    projectId,
  }).lean();

  const milestones = await Milestone.find({
    ownerId,
    projectId,
  }).lean();

  const dependencies = await Dependency.find({
    ownerId,
    projectId,
  }).lean();

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < now &&
      !["completed", "cancelled"].includes(task.status)
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const blockedTasks = tasks.filter(
    (task) => task.status === "blocked"
  ).length;

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const statusCounts = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    blocked: 0,
    completed: 0,
    cancelled: 0,
  };

  const priorityCounts = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const task of tasks) {
    statusCounts[task.status] =
      (statusCounts[task.status] || 0) + 1;

    priorityCounts[task.priority] =
      (priorityCounts[task.priority] || 0) + 1;
  }

  const milestoneStats = milestones.map((milestone) => {
    const milestoneTasks = tasks.filter(
      (task) =>
        String(task.milestoneId) === String(milestone._id)
    );

    const completed = milestoneTasks.filter(
      (task) => task.status === "completed"
    ).length;

    const total = milestoneTasks.length;

    const isOverdue =
      milestone.dueDate &&
      new Date(milestone.dueDate) < now &&
      milestone.status !== "completed";

    return {
      _id: milestone._id,
      title: milestone.title,
      dueDate: milestone.dueDate,
      status: milestone.status,
      totalTasks: total,
      completedTasks: completed,
      completionPercentage:
        total === 0 ? 0 : Math.round((completed / total) * 100),
      isOverdue: Boolean(isOverdue),
    };
  });

  return {
    project,
    summary: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      completionPercentage,
      totalMilestones: milestones.length,
      totalDependencies: dependencies.length,
    },
    statusCounts,
    priorityCounts,
    milestones: milestoneStats,
  };
}

module.exports = {
  getProjectOverview,
};
