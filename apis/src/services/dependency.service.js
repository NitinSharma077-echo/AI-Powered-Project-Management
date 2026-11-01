
const Dependency = require("../Models/Dependency");
const Task = require("../Models/Task");
const Project = require("../Models/Project");
const HttpError = require("../utils/httpError");

// Check whether adding a dependency would create a cycle.
async function wouldCreateCycle({
  projectId,
  predecessorTaskId,
  successorTaskId,
}) {
  // We are adding: predecessor -> successor.
  // A cycle exists if successor can already reach predecessor.
  const dependencies = await Dependency.find({ projectId }).lean();

  const graph = new Map();

  for (const dependency of dependencies) {
    const from = String(dependency.predecessorTaskId);
    const to = String(dependency.successorTaskId);

    if (!graph.has(from)) {
      graph.set(from, []);
    }

    graph.get(from).push(to);
  }

  const target = String(predecessorTaskId);
  const start = String(successorTaskId);

  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === target) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const neighbours = graph.get(current) || [];
    stack.push(...neighbours);
  }

  return false;
}

async function createDependency({
  ownerId,
  projectId,
  predecessorTaskId,
  successorTaskId,
  description,
}) {
  if (String(predecessorTaskId) === String(successorTaskId)) {
    throw new HttpError("A task cannot depend on itself.", 400);
  }

  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  // Both tasks must belong to this user's project.
  const tasks = await Task.find({
    _id: { $in: [predecessorTaskId, successorTaskId] },
    projectId,
    ownerId,
  }).select("_id");

  if (tasks.length !== 2) {
    throw new HttpError(
      "Both tasks must exist in the selected project.",
      404
    );
  }

  const cycleExists = await wouldCreateCycle({
    projectId,
    predecessorTaskId,
    successorTaskId,
  });

  if (cycleExists) {
    throw new HttpError(
      "This dependency would create a circular dependency.",
      400
    );
  }

  try {
    return await Dependency.create({
      ownerId,
      projectId,
      predecessorTaskId,
      successorTaskId,
      description,
    });
  } catch (error) {
    // The unique index prevents duplicate dependency pairs.
    if (error.code === 11000) {
      throw new HttpError("This dependency already exists.", 409);
    }

    throw error;
  }
}

async function getDependenciesForProject({ ownerId, projectId }) {
  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId,
  }).select("_id");

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return Dependency.find({ ownerId, projectId })
    .populate("predecessorTaskId", "title status")
    .populate("successorTaskId", "title status")
    .sort({ createdAt: 1 });
}

async function deleteDependency({ ownerId, dependencyId }) {
  const dependency = await Dependency.findOneAndDelete({
    _id: dependencyId,
    ownerId,
  });

  if (!dependency) {
    throw new HttpError("Dependency not found.", 404);
  }

  return dependency;
}

module.exports = {
  createDependency,
  getDependenciesForProject,
  deleteDependency,
};
