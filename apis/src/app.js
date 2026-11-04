
const express = require("express");
const cors = require("cors");

// Import the health routes we created in the routes folder.
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const meetingRoutes = require("./routes/meeting.routes");
const decisionRoutes = require("./routes/decision.routes");
const actionItemRoutes = require("./routes/actionItem.routes");
const aiRoutes = require("./routes/ai.routes");
const planningRoutes = require("./routes/planning.routes");

const { auth } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimit");

// Create the Express application.
const app = express();

// Render (and most hosts) terminate TLS at a proxy and pass the caller on
// in X-Forwarded-For. Without this, req.ip is the proxy's address for every
// request, so the rate limiters below bucket all users together and the
// auth limit locks out everyone at once. 1 = trust a single proxy hop;
// `true` would let a client spoof the header and bypass the limiter.
app.set("trust proxy", 1);

// Allow requests from our React frontend.
// CLIENT_URL may list several origins, separated by commas.
// Browsers send Origin with no trailing slash, so a CLIENT_URL pasted as
// "https://example.com/" would never match. Normalise instead of making
// that a deploy-breaking typo.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Vite picks the next free port when one is taken, so accept any
      // local port while developing rather than failing with a CORS error.
      if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }

      // A rejected origin is a configuration mismatch, not a server fault.
      // Without a statusCode the error handler calls it a 500, which makes
      // the preflight look like a crash and hides the real cause.
      console.warn(
        `Blocked by CORS: ${origin} is not in CLIENT_URL (${allowedOrigins.join(", ")})`
      );

      const error = new Error(`Origin ${origin} is not allowed`);
      error.statusCode = 403;

      return callback(error);
    }
  })
);

// Allow Express to read JSON request bodies.
app.use(express.json());

// Health is mounted first so uptime checks are never throttled.
app.use("/api/health", healthRoutes);

// Single global ceiling, counted once per request, for all other API traffic.
app.use("/api", apiLimiter);

// Public, with a stricter limit so credentials cannot be brute forced.
app.use("/api/auth", authLimiter, authRoutes);

// Everything below requires a valid Bearer token.
app.use("/api/projects", auth, projectRoutes);
app.use("/api/meetings", auth, meetingRoutes);
app.use("/api/meetings/:meetingId/decisions", auth, decisionRoutes);
app.use("/api/meetings/:meetingId/action-items", auth, actionItemRoutes);
app.use("/api", auth, aiRoutes);
app.use("/api", auth, planningRoutes);

// Catch errors from any route above and format the response.
app.use(errorHandler);

// Export the app so server.js can start it.
module.exports = app;
