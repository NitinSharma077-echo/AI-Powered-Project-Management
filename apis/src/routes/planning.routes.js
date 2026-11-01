
const express = require("express");

const taskService = require("../services/task.service");
const milestoneService = require("../services/milestone.service");
const dependencyService = require("../services/dependency.service");
const analyticsService = require("../services/projectAnalytics.service");
const { generatePlanWithAI } = require("../services/aiPlanning.service");
const { approveProjectPlan } = require("../services/plan.service");
const { aiLimiter } = require("../middlewares/rateLimit");
const Project = require("../Models/Project");
const HttpError = require("../utils/httpError");

const router = express.Router();

// Helper: send errors to the existing Express error handler.
const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// ---------------- TASK ROUTES ----------------

// Create a task.
router.post(
  "/projects/:projectId/tasks",
  asyncHandler(async (req, res) => {
    const task = await taskService.createTask({
      ownerId: req.user.id,
      projectId: req.params.projectId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  })
);

// Get all tasks for a project.
router.get(
  "/projects/:projectId/tasks",
  asyncHandler(async (req, res) => {
    const tasks = await taskService.getTasksForProject({
      ownerId: req.user.id,
      projectId: req.params.projectId,
    });

    res.json({
      success: true,
      data: tasks,
    });
  })
);

// Update task details.
router.patch(
  "/tasks/:taskId",
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTask({
      ownerId: req.user.id,
      taskId: req.params.taskId,
      updates: req.body,
    });

    res.json({
      success: true,
      data: task,
    });
  })
);

// Update task status.
router.patch(
  "/tasks/:taskId/status",
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTaskStatus({
      ownerId: req.user.id,
      taskId: req.params.taskId,
      status: req.body.status,
    });

    res.json({
      success: true,
      data: task,
    });
  })
);

// ---------------- MILESTONE ROUTES ----------------

// Create a milestone.
router.post(
  "/projects/:projectId/milestones",
  asyncHandler(async (req, res) => {
    const milestone = await milestoneService.createMilestone({
      ownerId: req.user.id,
      projectId: req.params.projectId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: milestone,
    });
  })
);

// Get project milestones.
router.get(
  "/projects/:projectId/milestones",
  asyncHandler(async (req, res) => {
    const milestones =
      await milestoneService.getMilestonesForProject({
        ownerId: req.user.id,
        projectId: req.params.projectId,
      });

    res.json({
      success: true,
      data: milestones,
    });
  })
);

// Update milestone status.
router.patch(
  "/milestones/:milestoneId/status",
  asyncHandler(async (req, res) => {
    const milestone =
      await milestoneService.updateMilestoneStatus({
        ownerId: req.user.id,
        milestoneId: req.params.milestoneId,
        status: req.body.status,
      });

    res.json({
      success: true,
      data: milestone,
    });
  })
);

// ---------------- DEPENDENCY ROUTES ----------------

// Create a dependency between two tasks.
router.post(
  "/projects/:projectId/dependencies",
  asyncHandler(async (req, res) => {
    const dependency = await dependencyService.createDependency({
      ownerId: req.user.id,
      projectId: req.params.projectId,
      predecessorTaskId: req.body.predecessorTaskId,
      successorTaskId: req.body.successorTaskId,
      description: req.body.description,
    });

    res.status(201).json({
      success: true,
      data: dependency,
    });
  })
);

// Get project dependencies.
router.get(
  "/projects/:projectId/dependencies",
  asyncHandler(async (req, res) => {
    const dependencies =
      await dependencyService.getDependenciesForProject({
        ownerId: req.user.id,
        projectId: req.params.projectId,
      });

    res.json({
      success: true,
      data: dependencies,
    });
  })
);

// Delete a dependency.
router.delete(
  "/dependencies/:dependencyId",
  asyncHandler(async (req, res) => {
    await dependencyService.deleteDependency({
      ownerId: req.user.id,
      dependencyId: req.params.dependencyId,
    });

    res.json({
      success: true,
      message: "Dependency deleted successfully.",
    });
  })
);

// ---------------- ANALYTICS ROUTE ----------------

router.get(
  "/projects/:projectId/overview",
  asyncHandler(async (req, res) => {
    const overview = await analyticsService.getProjectOverview({
      ownerId: req.user.id,
      projectId: req.params.projectId,
    });

    res.json({
      success: true,
      data: overview,
    });
  })
);

// ---------------- AI PLAN ROUTES ----------------

// Generate a draft plan with AI. Nothing is saved yet.
router.post(
  "/projects/:projectId/plan/generate",
  aiLimiter,
  asyncHandler(async (req, res) => {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user.id,
    }).select("name");

    if (!project) {
      throw new HttpError("Project not found.", 404);
    }

    const plan = await generatePlanWithAI({
      projectTitle: project.name,
      projectBrief: req.body.projectBrief,
      targetDate: req.body.targetDate,
    });

    res.status(200).json({
      success: true,
      data: plan,
    });
  })
);

// Persist a reviewed plan as real milestones, tasks and dependencies.
router.post(
  "/projects/:projectId/plan/approve",
  asyncHandler(async (req, res) => {
    const counts = await approveProjectPlan({
      ownerId: req.user.id,
      projectId: req.params.projectId,
      plan: req.body.plan,
    });

    res.status(200).json({
      success: true,
      data: counts,
    });
  })
);

module.exports = router;
