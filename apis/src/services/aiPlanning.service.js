const axios = require("axios");

const HttpError = require("../utils/httpError");

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function generatePlanWithAI({
  projectTitle,
  projectBrief,
  targetDate,
  source = "brief",
  documentName = null,
}) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/plans/generate`,
      {
        project_title: projectTitle,
        project_brief: projectBrief,
        target_date: targetDate || null,
        source,
        document_name: documentName,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-AI-Service-Token": process.env.AI_SERVICE_TOKEN,
        },
        timeout: 190000,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.detail;

      const upstream = error.response.status;

      // Surface the AI service's reason to the client instead of letting it
      // collapse into a generic 500: bad input stays a 400, anything else is
      // an upstream failure (502).
      throw new HttpError(
        typeof detail === "string"
          ? detail
          : `AI service returned status ${upstream}.`,
        upstream === 400 || upstream === 422 ? 400 : 502
      );
    }

    if (error.code === "ECONNABORTED") {
      throw new HttpError("AI plan generation timed out. Please try again.", 504);
    }

    throw new HttpError("Unable to connect to the AI service.", 503);
  }
}

module.exports = {
  generatePlanWithAI,
};
