const Project = require("../Models/Project");

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

module.exports = {
  createProject,
  getProjectForOwner,
  getProjectById
};
