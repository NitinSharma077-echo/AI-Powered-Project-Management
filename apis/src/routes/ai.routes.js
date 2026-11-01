const express = require("express");
const router = express.Router();

const { analyzeMeeting } = require("../controllers/ai.controller");
const { aiLimiter } = require("../middlewares/rateLimit");

router.post(
  "/meetings/:meetingId/analyze",
  aiLimiter,
  analyzeMeeting
);

module.exports = router;
