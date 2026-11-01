
const mongoose = require("mongoose");

// Define the structure of an action item.
const actionItemSchema = new mongoose.Schema(
  {
    // A short description of the task.
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    // More details about what needs to be done.
    description: {
      type: String,
      trim: true,
      default: ""
    },

    // The meeting that produced this task.
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true
    },

    // The owner of this task record.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // The user responsible for completing the task.
    // This is optional until a person is assigned.
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // Track progress through the task workflow.
    status: {
      type: String,
      enum: [
        "todo",
        "in_progress",
        "blocked",
        "completed",
        "cancelled"
      ],
      default: "todo"
    },

    // Help teams decide which task needs attention first.
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    // The deadline for completing the task.
    dueDate: {
      type: Date,
      default: null
    },

    // Record when the task was marked completed.
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    // Automatically maintain createdAt and updatedAt.
    timestamps: true
  }
);

// Create and export the ActionItem model.
module.exports = mongoose.model("ActionItem", actionItemSchema);
