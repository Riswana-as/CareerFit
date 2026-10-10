import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { AuthController } from "../controllers/authController";
import { ResumeController } from "../controllers/resumeController";
import { JobController } from "../controllers/jobController";
import { TailorController } from "../controllers/tailorController";
import { ExportController } from "../controllers/exportController";
import { ApplicationController } from "../controllers/applicationController";
import { AnalyticsController } from "../controllers/analyticsController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// Multer setup for secure resume uploads
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.resolve(__dirname, "../../uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err: any) {
  console.warn("[Upload Dir Warning]", err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file format. Please upload PDF, DOCX, or TXT."));
    }
  }
});

// Auth Routes
router.post("/auth/register", authLimiter, AuthController.register);
router.post("/auth/login", authLimiter, AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);
router.get("/auth/me", authenticate, AuthController.me);

// Resume Routes
router.post("/resumes/upload", authenticate, upload.single("resume"), ResumeController.uploadResume);
router.get("/resumes", authenticate, ResumeController.listResumes);
router.get("/resumes/:id", authenticate, ResumeController.getResume);
router.put("/resumes/:id", authenticate, ResumeController.updateResume);
router.delete("/resumes/:id", authenticate, ResumeController.deleteResume);
router.post("/resumes/:id/duplicate", authenticate, ResumeController.duplicateResume);

// Job Description Routes
router.post("/jobs/analyze", authenticate, JobController.analyzeJob);
router.get("/jobs", authenticate, JobController.listJobs);
router.get("/jobs/:id", authenticate, JobController.getJob);

// Tailoring & Version Routes
router.post("/resumes/:resumeId/tailor", authenticate, TailorController.tailorResume);
router.get("/resumes/:resumeId/versions", authenticate, TailorController.listVersions);
router.get("/versions/:versionId", authenticate, TailorController.getVersion);
router.put("/versions/:versionId", authenticate, TailorController.updateVersion);
router.post("/versions/:versionId/recalculate-score", authenticate, TailorController.recalculateScore);
router.post("/versions/:versionId/generate-better", authenticate, TailorController.generateBetterVersion);

// Export Routes
router.get("/resumes/:id/export/pdf", authenticate, ExportController.exportPdf);
router.get("/resumes/:id/export/docx", authenticate, ExportController.exportDocx);

// Job Application Tracker Routes
router.post("/applications", authenticate, ApplicationController.createApplication);
router.get("/applications", authenticate, ApplicationController.listApplications);
router.put("/applications/:id", authenticate, ApplicationController.updateApplication);
router.delete("/applications/:id", authenticate, ApplicationController.deleteApplication);

// Analytics Route
router.get("/analytics/dashboard", authenticate, AnalyticsController.getDashboard);

export default router;
