
const mongoose = require("mongoose");

// Define the structure of a project.
const projectSchema = new mongoose.Schema(
  {
    // The project's display name.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    // Optional explanation of the project's purpose.
    description: {
      type: String,
      trim: true,
      default: ""
    },

    // Reference to the user who owns this project.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Track the project's current lifecycle state.
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// Create the Project model.
module.exports = mongoose.model("Project", projectSchema);
