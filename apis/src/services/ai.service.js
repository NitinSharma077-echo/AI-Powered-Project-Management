const axios = require("axios");

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function analyzeMeetingWithAI(meeting) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/meeting/analyze`,
      {
        meeting_id: meeting._id.toString(),
        title: meeting.title,
        transcript: meeting.notes,
        meeting_date: meeting.meetingDate
          ? meeting.meetingDate.toISOString().slice(0, 10)
          : null,
        participants: (meeting.participants || []).map(
          (participant) => participant.name || String(participant)
        )
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-AI-Service-Token": process.env.AI_SERVICE_TOKEN
        },
        timeout: 190000
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
      throw new Error("AI analysis timed out.");
    }

    throw new Error("Unable to connect to the AI service.");
  }
}

module.exports = {
  analyzeMeetingWithAI
};
