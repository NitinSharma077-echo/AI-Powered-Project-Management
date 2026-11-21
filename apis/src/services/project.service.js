const Project = require("../Models/Project");
const Meeting = require("../Models/Meeting");
const Task = require("../Models/Task");
const Milestone = require("../Models/Milestone");
const Dependency = require("../Models/Dependency");
const HttpError = require("../utils/httpError");

const STATUSES = ["active", "completed", "archived"];

async function createProject(data, ownerId) {
  return Project.create({
    name: data.name,
    description: data.description,
    owner: ownerId
  });
}

async function getProjectForOwner(ownerId) {
  return Project.find({ owner: ownerId }).sort({ createdAt: -1 });
}

async function getProjectById(ownerId, projectId) {
  return Project.findOne({ _id: projectId, owner: ownerId });
}

async function findOwnedProject(ownerId, projectId) {
  const project = await getProjectById(ownerId, projectId);

  if (!project) {
    throw new HttpError("Project not found", 404);
  }

  return project;
}

// Only the fields present in `updates` are changed.
async function updateProject(ownerId, projectId, updates) {
  const project = await findOwnedProject(ownerId, projectId);

  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || !updates.name.trim()) {
      throw new HttpError("Project name is required", 400);
    }
    project.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    project.description = updates.description || "";
  }

  if (updates.status !== undefined) {
    if (!STATUSES.includes(updates.status)) {
      throw new HttpError(`Status must be one of: ${STATUSES.join(", ")}`, 400);
    }
    project.status = updates.status;
  }

  return project.save();
}

// Removes the project and its plan (tasks, milestones, dependencies).
// Meetings are kept and only unlinked: they record what was discussed.
async function deleteProject(ownerId, projectId) {
  const project = await findOwnedProject(ownerId, projectId);

  await Promise.all([
    Task.deleteMany({ ownerId, projectId: project._id }),
    Milestone.deleteMany({ ownerId, projectId: project._id }),
    Dependency.deleteMany({ ownerId, projectId: project._id }),
    Meeting.updateMany(
      { owner: ownerId, project: project._id },
      { $set: { project: null } }
    )
  ]);

  await project.deleteOne();
}

module.exports = {
  createProject,
  getProjectForOwner,
  getProjectById,
  updateProject,
  deleteProject
};
