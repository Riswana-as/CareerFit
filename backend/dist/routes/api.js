"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const authController_1 = require("../controllers/authController");
const resumeController_1 = require("../controllers/resumeController");
const jobController_1 = require("../controllers/jobController");
const tailorController_1 = require("../controllers/tailorController");
const exportController_1 = require("../controllers/exportController");
const applicationController_1 = require("../controllers/applicationController");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Multer setup for secure resume uploads
const uploadDir = process.env.VERCEL
    ? path_1.default.join(os_1.default.tmpdir(), "uploads")
    : path_1.default.resolve(__dirname, "../../uploads");
try {
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
}
catch (err) {
    console.warn("[Upload Dir Warning]", err.message);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".docx", ".txt"];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error("Unsupported file format. Please upload PDF, DOCX, or TXT."));
        }
    }
});
// Auth Routes
router.post("/auth/register", rateLimiter_1.authLimiter, authController_1.AuthController.register);
router.post("/auth/login", rateLimiter_1.authLimiter, authController_1.AuthController.login);
router.post("/auth/logout", authController_1.AuthController.logout);
router.post("/auth/forgot-password", authController_1.AuthController.forgotPassword);
router.post("/auth/reset-password", authController_1.AuthController.resetPassword);
router.get("/auth/me", auth_1.authenticate, authController_1.AuthController.me);
// Resume Routes
router.post("/resumes/upload", auth_1.authenticate, upload.single("resume"), resumeController_1.ResumeController.uploadResume);
router.get("/resumes", auth_1.authenticate, resumeController_1.ResumeController.listResumes);
router.get("/resumes/:id", auth_1.authenticate, resumeController_1.ResumeController.getResume);
router.put("/resumes/:id", auth_1.authenticate, resumeController_1.ResumeController.updateResume);
router.delete("/resumes/:id", auth_1.authenticate, resumeController_1.ResumeController.deleteResume);
router.post("/resumes/:id/duplicate", auth_1.authenticate, resumeController_1.ResumeController.duplicateResume);
// Job Description Routes
router.post("/jobs/analyze", auth_1.authenticate, jobController_1.JobController.analyzeJob);
router.get("/jobs", auth_1.authenticate, jobController_1.JobController.listJobs);
router.get("/jobs/:id", auth_1.authenticate, jobController_1.JobController.getJob);
// Tailoring & Version Routes
router.post("/resumes/:resumeId/tailor", auth_1.authenticate, tailorController_1.TailorController.tailorResume);
router.get("/resumes/:resumeId/versions", auth_1.authenticate, tailorController_1.TailorController.listVersions);
router.get("/versions/:versionId", auth_1.authenticate, tailorController_1.TailorController.getVersion);
router.put("/versions/:versionId", auth_1.authenticate, tailorController_1.TailorController.updateVersion);
router.post("/versions/:versionId/recalculate-score", auth_1.authenticate, tailorController_1.TailorController.recalculateScore);
router.post("/versions/:versionId/generate-better", auth_1.authenticate, tailorController_1.TailorController.generateBetterVersion);
// Export Routes
router.get("/resumes/:id/export/pdf", auth_1.authenticate, exportController_1.ExportController.exportPdf);
router.get("/resumes/:id/export/docx", auth_1.authenticate, exportController_1.ExportController.exportDocx);
// Job Application Tracker Routes
router.post("/applications", auth_1.authenticate, applicationController_1.ApplicationController.createApplication);
router.get("/applications", auth_1.authenticate, applicationController_1.ApplicationController.listApplications);
router.put("/applications/:id", auth_1.authenticate, applicationController_1.ApplicationController.updateApplication);
router.delete("/applications/:id", auth_1.authenticate, applicationController_1.ApplicationController.deleteApplication);
// Analytics Route
router.get("/analytics/dashboard", auth_1.authenticate, analyticsController_1.AnalyticsController.getDashboard);
exports.default = router;
