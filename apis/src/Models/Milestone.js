
const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
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
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "in_progress", "completed", "missed"],
      default: "upcoming",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Mongoose 9 document hooks are promise-based and receive no `next` callback.
milestoneSchema.pre("validate", function () {
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== "completed") {
    this.completedAt = null;
  }
});

milestoneSchema.index({ projectId: 1, dueDate: 1 });

module.exports = mongoose.model("Milestone", milestoneSchema);
