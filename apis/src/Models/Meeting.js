
const mongoose = require("mongoose");

// Define the structure of a meeting.
const meetingSchema = new mongoose.Schema(
  {
    // A short title for the meeting.
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    // The project this meeting belongs to, if any.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },

    // The user account that owns this meeting record.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // When the meeting took place.
    meetingDate: {
      type: Date,
      default: Date.now
    },

    // Free-form notes captured during the meeting.
    notes: {
      type: String,
      trim: true,
      default: ""
    },

    // The users who attended the meeting.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create and export the Meeting model.
module.exports = mongoose.model("Meeting", meetingSchema);
