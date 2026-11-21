
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

// Upload a document (PDF, DOCX, TXT, MD, CSV) and get a draft plan built
// from the items it lists. Returns { plan, document }.
export async function generatePlanFromDocument(projectId, file, targetDate, onProgress) {
  const form = new FormData();
  form.append("document", file);
  if (targetDate) form.append("targetDate", targetDate);

  const response = await api.post(
    `/projects/${projectId}/plan/from-document`,
    form,
    {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    }
  );

  return { plan: response.data.data, document: response.data.document };
}

// Saved plan data for the roadmap view.
export async function getProjectRoadmap(projectId) {
  const [milestones, tasks] = await Promise.all([
    api.get(`/projects/${projectId}/milestones`),
    api.get(`/projects/${projectId}/tasks`),
  ]);

  return {
    milestones: milestones.data.data || [],
    tasks: tasks.data.data || [],
  };
}
