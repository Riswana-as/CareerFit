import axios from "axios";
import {
  StructuredResume,
  TailoringResult,
  ResumeRecord,
  ResumeVersionSummary,
  JobApplication,
  ExtractedJobDescription,
  ATSScoreBreakdown
} from "../types";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("careerfit_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  // Auth
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data: { resetToken: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  // Resumes
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    return api.post<{ message: string; resume: { id: string; title: string; parsedData: StructuredResume } }>(
      "/resumes/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  listResumes: () => api.get<{ resumes: ResumeRecord[] }>("/resumes"),
  getResume: (id: string) =>
    api.get<{ resume: ResumeRecord }>("/resumes/" + id),
  updateResume: (id: string, data: { title?: string; parsedData?: StructuredResume }) =>
    api.put("/resumes/" + id, data),
  deleteResume: (id: string) => api.delete("/resumes/" + id),
  duplicateResume: (id: string) => api.post("/resumes/" + id + "/duplicate"),

  // Jobs
  analyzeJob: (data: { rawText: string; title?: string; company?: string }) =>
    api.post<{ message: string; job: ExtractedJobDescription }>("/jobs/analyze", data),
  listJobs: () => api.get<{ jobs: any[] }>("/jobs"),
  getJob: (id: string) => api.get<{ job: any }>("/jobs/" + id),

  // Tailoring & Versions
  tailorResume: (
    resumeId: string,
    data: {
      jobId?: string;
      rawJobText?: string;
      manualRole?: string;
      customWeights?: ATSScoreBreakdown["scoringWeights"];
      templateSlug?: string;
    }
  ) =>
    api.post<{
      message: string;
      versionId: string;
      versionName: string;
      result: TailoringResult;
    }>("/resumes/" + resumeId + "/tailor", data),

  listVersions: (resumeId: string) =>
    api.get<{ versions: any[] }>("/resumes/" + resumeId + "/versions"),
  getVersion: (versionId: string) =>
    api.get<{ version: ResumeVersionSummary }>("/versions/" + versionId),
  updateVersion: (
    versionId: string,
    data: { content?: StructuredResume; templateSlug?: string; versionName?: string }
  ) => api.put("/versions/" + versionId, data),

  // Export URL helpers
  getPdfExportUrl: (resumeId: string, versionId?: string, template: string = "modern") =>
    `/api/v1/resumes/${resumeId}/export/pdf?${versionId ? `versionId=${versionId}&` : ""}template=${template}`,
  getDocxExportUrl: (resumeId: string, versionId?: string) =>
    `/api/v1/resumes/${resumeId}/export/docx${versionId ? `?versionId=${versionId}` : ""}`,

  // Applications
  listApplications: () =>
    api.get<{ applications: JobApplication[] }>("/applications"),
  createApplication: (data: Partial<JobApplication>) =>
    api.post("/applications", data),
  updateApplication: (id: string, data: Partial<JobApplication>) =>
    api.put("/applications/" + id, data),
  deleteApplication: (id: string) => api.delete("/applications/" + id),

  // Analytics
  getDashboardAnalytics: () => api.get<{ stats: any }>("/analytics/dashboard")
};

export default api;
