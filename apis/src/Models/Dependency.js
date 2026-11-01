
const mongoose = require("mongoose");

const dependencySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The task that must happen first.
    predecessorTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // The task that is waiting for the predecessor.
    successorTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    type: {
      type: String,
      enum: ["finish_to_start"],
      default: "finish_to_start",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

dependencySchema.index(
  { predecessorTaskId: 1, successorTaskId: 1 },
  { unique: true }
);

// projectId is already indexed by `index: true` on the field above.

module.exports = mongoose.model("Dependency", dependencySchema);

