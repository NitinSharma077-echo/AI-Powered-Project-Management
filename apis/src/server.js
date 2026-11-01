const dotenv = require("dotenv");

// Load environment variables from the .env file.
dotenv.config();

// Import the configured Express application.
const app = require("./app");
const connectDatabase = require("./config/db");

// Use the configured port, or 5000 if no port is provided.
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the HTTP server.
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MeetFlow API running on port ${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
