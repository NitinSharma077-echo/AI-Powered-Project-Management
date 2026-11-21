import api from "./api";

// Projects

export async function getProjects() {
  const { data } = await api.get("/projects");
  return data;
}

export async function getProject(projectId) {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

// Meetings

export async function getMeetings() {
  const { data } = await api.get("/meetings");
  return data.data;
}

export async function getMeeting(meetingId) {
  const { data } = await api.get(`/meetings/${meetingId}`);
  return data.data;
}

export async function createMeeting(payload) {
  const { data } = await api.post("/meetings", payload);
  return data.data;
}

export async function analyzeMeeting(meetingId) {
  const { data } = await api.post(`/meetings/${meetingId}/analyze`);
  return data.data;
}

// Decisions

export async function getMeetingDecisions(meetingId) {
  const { data } = await api.get(`/meetings/${meetingId}/decisions`);
  return data.data;
}

export async function createDecision(meetingId, payload) {
  const { data } = await api.post(`/meetings/${meetingId}/decisions`, payload);
  return data.data;
}

export async function updateDecisionStatus(meetingId, decisionId, status) {
  const { data } = await api.patch(
    `/meetings/${meetingId}/decisions/${decisionId}/status`,
    { status }
  );
  return data.data;
}

// Action items

export async function getMeetingActionItems(meetingId) {
  const { data } = await api.get(`/meetings/${meetingId}/action-items`);
  return data.data;
}

export async function createActionItem(meetingId, payload) {
  const { data } = await api.post(
    `/meetings/${meetingId}/action-items`,
    payload
  );
  return data.data;
}

export async function updateActionItemStatus(meetingId, actionItemId, status) {
  const { data } = await api.patch(
    `/meetings/${meetingId}/action-items/${actionItemId}/status`,
    { status }
  );
  return data.data;
}

// Cross-meeting aggregates for the standalone Decisions / Action Items pages.

export async function getAllDecisions() {
  const meetings = await getMeetings();

  const results = await Promise.all(
    meetings.map((meeting) =>
      getMeetingDecisions(meeting._id)
        .then((decisions) =>
          decisions.map((decision) => ({
            ...decision,
            meetingTitle: meeting.title,
            meetingId: meeting._id,
          }))
        )
        .catch(() => [])
    )
  );

  return results.flat();
}

export async function getAllActionItems() {
  const meetings = await getMeetings();

  const results = await Promise.all(
    meetings.map((meeting) =>
      getMeetingActionItems(meeting._id)
        .then((items) =>
          items.map((item) => ({
            ...item,
            meetingTitle: meeting.title,
            meetingId: meeting._id,
          }))
        )
        .catch(() => [])
    )
  );

  return results.flat();
}

// ---------- Editing ----------

export async function updateProject(projectId, payload) {
  const { data } = await api.patch(`/projects/${projectId}`, payload);
  return data;
}

export async function deleteProject(projectId) {
  await api.delete(`/projects/${projectId}`);
}

export async function updateMeeting(meetingId, payload) {
  const { data } = await api.patch(`/meetings/${meetingId}`, payload);
  return data.data;
}

export async function deleteMeeting(meetingId) {
  await api.delete(`/meetings/${meetingId}`);
}

// Points remembered after the meeting ended.
export async function addFollowUp(meetingId, text) {
  const { data } = await api.post(`/meetings/${meetingId}/follow-ups`, { text });
  return data.data;
}

export async function removeFollowUp(meetingId, followUpId) {
  const { data } = await api.delete(
    `/meetings/${meetingId}/follow-ups/${followUpId}`
  );
  return data.data;
}

export async function updateDecision(meetingId, decisionId, payload) {
  const { data } = await api.patch(
    `/meetings/${meetingId}/decisions/${decisionId}`,
    payload
  );
  return data.data;
}

export async function deleteDecision(meetingId, decisionId) {
  await api.delete(`/meetings/${meetingId}/decisions/${decisionId}`);
}

export async function updateActionItem(meetingId, actionItemId, payload) {
  const { data } = await api.patch(
    `/meetings/${meetingId}/action-items/${actionItemId}`,
    payload
  );
  return data.data;
}

export async function deleteActionItem(meetingId, actionItemId) {
  await api.delete(`/meetings/${meetingId}/action-items/${actionItemId}`);
}
