
const mongoose = require("mongoose");

// Define the fields that a MeetFlow AI user can have.
const userSchema = new mongoose.Schema(
  {
    // The user's display name.
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Used for login and account identification.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Store a password hash, NEVER the original password.
    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    // Normal accounts cannot become administrators by default.
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  {
    // Automatically maintain createdAt and updatedAt.
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// Create the User model from the schema.
module.exports = mongoose.model("User", userSchema);
