const axios = require("axios");

const HttpError = require("../utils/httpError");

const { resolveAiServiceUrl } = require("../utils/aiServiceUrl");

const AI_SERVICE_URL = resolveAiServiceUrl();

// Notes plus any points added after the meeting, so the analysis covers
// everything that was recorded, not just what was typed in the room.
function buildTranscript(meeting) {
  const followUps = (meeting.followUps || []).filter((item) => item.text);

  if (followUps.length === 0) {
    return meeting.notes;
  }

  const added = followUps
    .map((item) => `- ${item.text}`)
    .join("\n");

  return `${meeting.notes || ""}\n\nPoints added after the meeting:\n${added}`.trim();
}

async function analyzeMeetingWithAI(meeting) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/meeting/analyze`,
      {
        meeting_id: meeting._id.toString(),
        title: meeting.title,
        transcript: buildTranscript(meeting),
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
      throw new HttpError("AI analysis timed out. Please try again.", 504);
    }

    // Log where we tried and why it failed (e.g. ECONNREFUSED = nothing
    // listening, ENOTFOUND = bad hostname) so the server logs show the cause.
    console.error(
      `AI service unreachable at ${AI_SERVICE_URL}: ${error.code || error.message}`
    );
    throw new HttpError("Unable to connect to the AI service.", 503);
  }
}

module.exports = {
  analyzeMeetingWithAI
};
