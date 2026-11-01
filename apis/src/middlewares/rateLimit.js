const { rateLimit } = require("express-rate-limit");

// Tight limit on credential endpoints so logins cannot be brute forced.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many attempts. Please try again in 15 minutes."
  }
});

// Broad ceiling for the rest of the API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down."
  }
});

// AI calls cost money per request, so they get their own hourly budget.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "AI request limit reached. Please try again later."
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter
};
