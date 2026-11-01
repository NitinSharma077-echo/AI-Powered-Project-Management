
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // Optional link to the meeting that produced this task.
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    // Optional link to the original meeting action item.
    sourceActionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActionItem",
      default: null,
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

    status: {
      type: String,
      enum: [
        "backlog",
        "todo",
        "in_progress",
        "blocked",
        "completed",
        "cancelled",
      ],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    estimatedHours: {
      type: Number,
      min: 0,
      default: null,
    },

    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent invalid date ranges.
// Mongoose 9 document hooks are promise-based and receive no `next` callback.
taskSchema.pre("validate", function () {
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate("dueDate", "Due date cannot be before start date.");
  }

  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== "completed") {
    this.completedAt = null;
  }
});

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, dueDate: 1 });
taskSchema.index({ ownerId: 1, projectId: 1 });

module.exports = mongoose.model("Task", taskSchema);
