
import api from "./api";

// Ask the backend to generate an AI project plan.
export async function generateProjectPlan(projectId, projectBrief, targetDate) {
  const response = await api.post(
    `/projects/${projectId}/plan/generate`,
    {
      projectBrief,
      targetDate: targetDate || null,
    }
  );

  return response.data.data;
}

// Submit the reviewed plan for approval and persistence.
export async function approveProjectPlan(projectId, plan) {
  const response = await api.post(
    `/projects/${projectId}/plan/approve`,
    { plan }
  );

  return response.data;
}
