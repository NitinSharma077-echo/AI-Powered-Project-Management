
const express = require("express");

// Create a router to organize related API routes.
const router = express.Router();

// Handle GET requests to the health route.
// This lets us check whether the API responds correctly.
router.get("/", (req, res) => {
  // Return HTTP 200, meaning the request succeeded.
  // Send JSON so API clients can read the result.
  res.status(200).json({
    status: "ok",
    service: "meetflow-api",
    message: "API is running"
  });
});

// Make this router available to app.js.
module.exports = router;
