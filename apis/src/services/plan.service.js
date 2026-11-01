const { createMilestone } = require("./milestone.service");
const { createTask } = require("./task.service");
const { createDependency } = require("./dependency.service");

const Milestone = require("../Models/Milestone");
const Task = require("../Models/Task");
const Dependency = require("../Models/Dependency");

const HttpError = require("../utils/httpError");

async function approveProjectPlan({ ownerId, projectId, plan }) {
  if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new HttpError("The plan must contain at least one task.", 400);
  }

  const createdMilestoneIds = [];
  const createdTaskIds = [];
  const createdDependencyIds = [];

  try {
    const milestoneIdByRef = {};

    for (const milestone of plan.milestones || []) {
      const created = await createMilestone({
        ownerId,
        projectId,
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.due_date,
      });

      createdMilestoneIds.push(created._id);
      milestoneIdByRef[milestone.ref] = created._id;
    }

    const taskIdByRef = {};

    for (const task of plan.tasks) {
      const created = await createTask({
        ownerId,
        projectId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        milestoneId: task.milestone_ref
          ? milestoneIdByRef[task.milestone_ref] || null
          : null,
      });

      createdTaskIds.push(created._id);
      taskIdByRef[task.ref] = created._id;
    }

    for (const dependency of plan.dependencies || []) {
      const predecessorTaskId = taskIdByRef[dependency.predecessor_ref];
      const successorTaskId = taskIdByRef[dependency.successor_ref];

      if (!predecessorTaskId || !successorTaskId) {
        continue;
      }

      const created = await createDependency({
        ownerId,
        projectId,
        predecessorTaskId,
        successorTaskId,
        description: dependency.description,
      });

      createdDependencyIds.push(created._id);
    }

    return {
      milestoneCount: createdMilestoneIds.length,
      taskCount: createdTaskIds.length,
      dependencyCount: createdDependencyIds.length,
    };
  } catch (error) {
    // Undo partial writes so a failed approval never leaves orphans behind.
    try {
      await Dependency.deleteMany({ _id: { $in: createdDependencyIds } });
      await Task.deleteMany({ _id: { $in: createdTaskIds } });
      await Milestone.deleteMany({ _id: { $in: createdMilestoneIds } });
    } catch (cleanupError) {
      console.error("Plan approval rollback failed:", cleanupError);
    }

    throw error;
  }
}

module.exports = {
  approveProjectPlan,
};
