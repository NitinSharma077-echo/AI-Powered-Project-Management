
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

    // Points added after the meeting ("I forgot to mention..."). Kept
    // separate from the original notes so the record of what was said in
    // the room stays intact, but included when the meeting is analyzed.
    followUps: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 5000
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

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
