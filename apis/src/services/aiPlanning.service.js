const axios = require("axios");

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function generatePlanWithAI({ projectTitle, projectBrief, targetDate }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/plans/generate`,
      {
        project_title: projectTitle,
        project_brief: projectBrief,
        target_date: targetDate || null,
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

      throw new Error(
        typeof detail === "string"
          ? detail
          : `AI service returned status ${error.response.status}.`
      );
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("AI plan generation timed out.");
    }

    throw new Error("Unable to connect to the AI service.");
  }
}

module.exports = {
  generatePlanWithAI,
};
