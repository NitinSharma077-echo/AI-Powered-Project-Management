
const mongoose = require("mongoose");

// Connect the Express backend to MongoDB.
async function connectDatabase() {
  try {
    // Read the connection string from the environment.
    const connectionString = process.env.MONGODB_URI;

    // Stop early if the database URL is missing.
    if (!connectionString) {
      throw new Error("MONGODB_URI is not configured");
    }

    // Catch the copied-from-Atlas-but-never-filled-in case, which otherwise
    // only shows up as an opaque "bad auth" error.
    const placeholder = connectionString.match(/<[^>]+>/);
    if (placeholder) {
      throw new Error(
        `MONGODB_URI still contains the placeholder ${placeholder[0]}. ` +
          "Replace it with the real value in apps/apis/.env"
      );
    }

    // Establish the database connection.
    await mongoose.connect(connectionString);

    // Confirm that the connection succeeded.
    console.log("MongoDB connected successfully");
  } catch (error) {
    // Show the reason if the connection fails.
    console.error("MongoDB connection failed:", error.message);

    // Prevent the application from starting without its database.
    throw error;
  }
}

// Make the function available to server.js.
module.exports = connectDatabase;
