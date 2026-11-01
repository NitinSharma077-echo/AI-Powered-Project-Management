
const mongoose = require("mongoose");

// Define the structure of a meeting decision.
const decisionSchema = new mongoose.Schema(
  {
    // A short description of the decision.
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    // Additional context explaining the decision.
    description: {
      type: String,
      trim: true,
      default: ""
    },

    // The meeting where this decision was recorded.
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true
    },

    // The user account that owns this decision record.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // AI-suggested decisions must be reviewed before approval.
    status: {
      type: String,
      enum: ["proposed", "approved", "rejected"],
      default: "proposed"
    },

    // Record when the decision was formally approved.
    decidedAt: {
      type: Date,
      default: null
    }
  },
  {
    // Automatically maintain createdAt and updatedAt.
    timestamps: true
  }
);

// Create and export the Decision model.
module.exports = mongoose.model("Decision", decisionSchema);
