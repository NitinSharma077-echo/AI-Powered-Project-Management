
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
const multer = require("multer");
const { extractDocumentText } = require("../services/documentText.service");

// Documents are read in memory and never written to disk.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

// Turn multer's own errors (e.g. file too large) into readable 400s.
function receiveDocument(req, res, next) {
  upload.single("document")(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      return next(new HttpError("The document must be 10 MB or smaller.", 400));
    }

    return next(new HttpError(error.message || "Upload failed.", 400));
  });
}

async function findOwnedProjectName(ownerId, projectId) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("name");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return project.name;
}

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
    const brief =
      typeof req.body.projectBrief === "string"
        ? req.body.projectBrief.trim()
        : "";

    if (brief.length < 20 || brief.length > 20000) {
      throw new HttpError(
        "The project brief must be between 20 and 20,000 characters.",
        400
      );
    }

    const projectName = await findOwnedProjectName(
      req.user.id,
      req.params.projectId
    );

    const plan = await generatePlanWithAI({
      projectTitle: projectName,
      projectBrief: brief,
      targetDate: req.body.targetDate,
    });

    res.status(200).json({
      success: true,
      data: plan,
    });
  })
);

// Generate a draft plan from an uploaded document (PDF, DOCX, TXT, MD, CSV).
// The AI extracts the items the document lists, grouped by milestone.
// Nothing is saved until the plan is approved.
router.post(
  "/projects/:projectId/plan/from-document",
  aiLimiter,
  receiveDocument,
  asyncHandler(async (req, res) => {
    const projectName = await findOwnedProjectName(
      req.user.id,
      req.params.projectId
    );

    const document = await extractDocumentText(req.file);

    const plan = await generatePlanWithAI({
      projectTitle: projectName,
      projectBrief: document.text,
      targetDate: req.body.targetDate || null,
      source: "document",
      documentName: req.file.originalname,
    });

    res.status(200).json({
      success: true,
      data: plan,
      document: {
        name: req.file.originalname,
        characters: document.characters,
        truncated: document.truncated,
      },
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
