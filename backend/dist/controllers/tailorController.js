"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TailorController = void 0;
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const aiService_1 = require("../ai/aiService");
const jobParser_1 = require("../parsers/jobParser");
const resumeParser_1 = require("../parsers/resumeParser");
const matchingEngine_1 = require("../services/matchingEngine");
const atsScoreService_1 = require("../services/atsScoreService");
class TailorController {
    static async tailorResume(req, res) {
        try {
            const userId = req.user?.id;
            const { resumeId } = req.params;
            const { jobId, rawJobText, manualRole, customWeights, templateSlug, geminiApiKey, optimizationMode = "standard" } = req.body;
            const userApiKey = (geminiApiKey || req.headers["x-gemini-key"] || undefined);
            // 1. Fetch source resume
            const resumeResult = await database_1.db.query("SELECT * FROM resumes WHERE id = $1 AND user_id = $2", [resumeId, userId]);
            if (resumeResult.rows.length === 0) {
                res.status(404).json({ error: "Resume not found." });
                return;
            }
            let originalResume = typeof resumeResult.rows[0].parsed_json === "string"
                ? JSON.parse(resumeResult.rows[0].parsed_json)
                : resumeResult.rows[0].parsed_json;
            const filePath = resumeResult.rows[0].original_file_path;
            if (filePath && fs_1.default.existsSync(filePath)) {
                try {
                    const rawText = await resumeParser_1.ResumeParser.extractRawText(filePath, resumeResult.rows[0].file_mime_type);
                    originalResume = resumeParser_1.ResumeParser.parse(rawText);
                    await database_1.db.query("UPDATE resumes SET parsed_json = $1 WHERE id = $2", [JSON.stringify(originalResume), resumeId]);
                }
                catch (e) {
                    console.warn("[TailorController] Could not re-parse original file, using cached json:", e);
                }
            }
            // 2. Fetch or parse Job Description
            let job;
            let resolvedJobId = jobId;
            if (jobId) {
                const jobResult = await database_1.db.query("SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2", [jobId, userId]);
                if (jobResult.rows.length === 0) {
                    res.status(404).json({ error: "Target job description not found." });
                    return;
                }
                const jobRow = jobResult.rows[0];
                job = typeof jobRow.parsed_data === "string" ? JSON.parse(jobRow.parsed_data) : jobRow.parsed_data;
            }
            else if (rawJobText) {
                job = jobParser_1.JobParser.parse(rawJobText, { detectedRole: manualRole });
                resolvedJobId = (0, uuid_1.v4)();
                await database_1.db.query(`INSERT INTO job_descriptions (id, user_id, title, company, raw_text, detected_role, detection_confidence, department, experience_level, location, parsed_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
                    resolvedJobId,
                    userId,
                    job.title || job.detectedRole,
                    job.company || "Target Employer",
                    job.rawText,
                    job.detectedRole,
                    job.roleConfidence || 0,
                    job.department || "General",
                    job.experienceLevel || "Mid-Level",
                    job.location || "Remote",
                    JSON.stringify(job)
                ]);
            }
            else {
                res.status(400).json({ error: "Please provide a valid jobId or rawJobText." });
                return;
            }
            if (manualRole) {
                job.detectedRole = manualRole;
            }
            // 3. Execute AI Tailoring with Zero-Fabrication Safety
            const tailoringResult = await aiService_1.aiService.tailorResume(originalResume, job, customWeights, userApiKey, optimizationMode);
            // 4. Calculate Version Number & Name
            const existingVersions = await database_1.db.query("SELECT COUNT(*) as count FROM resume_versions WHERE resume_id = $1", [resumeId]);
            const nextVersionNumber = parseInt(existingVersions.rows[0]?.count || "0", 10) + 1;
            const modeSuffix = optimizationMode === "aggressive_keywords"
                ? " (Max ATS Match)"
                : optimizationMode === "executive"
                    ? " (Executive Focus)"
                    : optimizationMode === "fresher"
                        ? " (Foundational)"
                        : "";
            const versionName = `${job.detectedRole} – v${nextVersionNumber}${modeSuffix}`;
            const versionId = (0, uuid_1.v4)();
            // Resolve template
            const templateResult = await database_1.db.query("SELECT id FROM templates WHERE slug = $1 LIMIT 1", [templateSlug || "executive_classic"]);
            const templateId = templateResult.rows[0]?.id || null;
            // 5. Store version in database
            await database_1.db.query(`INSERT INTO resume_versions (
           id, resume_id, target_job_id, version_number, version_name, target_role,
           content, ats_score, score_breakdown, changes_summary, unadded_items, template_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
                versionId,
                resumeId,
                resolvedJobId || null,
                nextVersionNumber,
                versionName,
                job.detectedRole,
                JSON.stringify(tailoringResult.tailoredResume),
                tailoringResult.atsScore.overallScore,
                JSON.stringify({ ...tailoringResult.atsScore, keywords: tailoringResult.keywords }),
                JSON.stringify(tailoringResult.changesMade),
                JSON.stringify(tailoringResult.unaddedItems),
                templateId
            ]);
            // Store suggestions
            for (const sugg of tailoringResult.suggestions) {
                await database_1.db.query("INSERT INTO ai_suggestions (id, resume_version_id, section, suggestion_type, content, reason, actionable_step) VALUES ($1, $2, $3, $4, $5, $6, $7)", [sugg.id, versionId, sugg.section, sugg.type, sugg.content, sugg.reason, sugg.actionableStep || null]);
            }
            res.status(201).json({
                message: "Resume tailored successfully.",
                versionId,
                versionName,
                result: tailoringResult
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to tailor resume." });
        }
    }
    static async generateBetterVersion(req, res) {
        try {
            const userId = req.user?.id;
            const { versionId } = req.params;
            const { optimizationMode = "aggressive_keywords", templateSlug, geminiApiKey } = req.body;
            const userApiKey = (geminiApiKey || req.headers["x-gemini-key"] || undefined);
            // Fetch existing version and its source resume & job
            const vResult = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.original_file_path, r.file_mime_type, j.parsed_data as job_data
         FROM resume_versions v
         JOIN resumes r ON v.resume_id = r.id
         LEFT JOIN job_descriptions j ON v.target_job_id = j.id
         WHERE v.id = $1`, [versionId]);
            if (vResult.rows.length === 0) {
                res.status(404).json({ error: "Source version not found." });
                return;
            }
            const vRow = vResult.rows[0];
            let originalResume = typeof vRow.original_json === "string" ? JSON.parse(vRow.original_json) : vRow.original_json;
            if (vRow.original_file_path && fs_1.default.existsSync(vRow.original_file_path)) {
                try {
                    const rawText = await resumeParser_1.ResumeParser.extractRawText(vRow.original_file_path, vRow.file_mime_type);
                    originalResume = resumeParser_1.ResumeParser.parse(rawText);
                    await database_1.db.query("UPDATE resumes SET parsed_json = $1 WHERE id = $2", [JSON.stringify(originalResume), vRow.resume_id]);
                }
                catch (e) {
                    console.warn("[TailorController] Could not re-parse original file, using cached json:", e);
                }
            }
            let job = null;
            let targetJobId = vRow.target_job_id;
            if (vRow.job_data) {
                job = typeof vRow.job_data === "string" ? JSON.parse(vRow.job_data) : vRow.job_data;
            }
            // If target_job_id was null or job_data has no required skills, look up the user's matching job description
            if (!job || !job.requiredSkills || job.requiredSkills.length === 0) {
                const matchingJobRes = await database_1.db.query(`SELECT id, parsed_data FROM job_descriptions 
           WHERE user_id = $1 
           ORDER BY CASE WHEN LOWER(detected_role) = LOWER($2) THEN 0 ELSE 1 END, created_at DESC 
           LIMIT 1`, [userId, vRow.target_role]);
                if (matchingJobRes.rows.length > 0) {
                    const jdRow = matchingJobRes.rows[0];
                    job = typeof jdRow.parsed_data === "string" ? JSON.parse(jdRow.parsed_data) : jdRow.parsed_data;
                    targetJobId = jdRow.id;
                    await database_1.db.query("UPDATE resume_versions SET target_job_id = $1 WHERE id = $2", [targetJobId, versionId]);
                }
            }
            if (!job) {
                job = jobParser_1.JobParser.parse(vRow.target_role || "Target Role");
            }
            // Execute tailored re-optimization with requested strategy
            const tailoringResult = await aiService_1.aiService.tailorResume(originalResume, job, undefined, userApiKey, optimizationMode);
            const countRes = await database_1.db.query("SELECT COUNT(*) as count FROM resume_versions WHERE resume_id = $1", [vRow.resume_id]);
            const nextVersionNumber = parseInt(countRes.rows[0]?.count || "0", 10) + 1;
            const modeLabel = optimizationMode === "aggressive_keywords"
                ? "Max ATS Match"
                : optimizationMode === "executive"
                    ? "Executive Focus"
                    : optimizationMode === "fresher"
                        ? "Foundational"
                        : "Alternative";
            const newVersionName = `${job.detectedRole} – v${nextVersionNumber} (${modeLabel})`;
            const newVersionId = (0, uuid_1.v4)();
            let resolvedTemplateId = vRow.template_id;
            if (templateSlug) {
                const tRes = await database_1.db.query("SELECT id FROM templates WHERE slug = $1 LIMIT 1", [templateSlug]);
                if (tRes.rows.length > 0)
                    resolvedTemplateId = tRes.rows[0].id;
            }
            await database_1.db.query(`INSERT INTO resume_versions (
           id, resume_id, target_job_id, version_number, version_name, target_role,
           content, ats_score, score_breakdown, changes_summary, unadded_items, template_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
                newVersionId,
                vRow.resume_id,
                targetJobId || null,
                nextVersionNumber,
                newVersionName,
                job.detectedRole,
                JSON.stringify(tailoringResult.tailoredResume),
                tailoringResult.atsScore.overallScore,
                JSON.stringify({ ...tailoringResult.atsScore, keywords: tailoringResult.keywords }),
                JSON.stringify(tailoringResult.changesMade),
                JSON.stringify(tailoringResult.unaddedItems),
                resolvedTemplateId
            ]);
            for (const sugg of tailoringResult.suggestions) {
                await database_1.db.query("INSERT INTO ai_suggestions (id, resume_version_id, section, suggestion_type, content, reason, actionable_step) VALUES ($1, $2, $3, $4, $5, $6, $7)", [sugg.id, newVersionId, sugg.section, sugg.type, sugg.content, sugg.reason, sugg.actionableStep || null]);
            }
            res.status(201).json({
                message: "New alternative ATS version generated successfully.",
                versionId: newVersionId,
                versionName: newVersionName,
                result: tailoringResult
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to generate better version." });
        }
    }
    static async recalculateScore(req, res) {
        try {
            const userId = req.user?.id;
            const { versionId } = req.params;
            const { content, customWeights } = req.body;
            const vResult = await database_1.db.query(`SELECT v.id, v.target_role, v.target_job_id, j.parsed_data as job_data
         FROM resume_versions v
         LEFT JOIN job_descriptions j ON v.target_job_id = j.id
         WHERE v.id = $1`, [versionId]);
            if (vResult.rows.length === 0) {
                res.status(404).json({ error: "Version not found." });
                return;
            }
            const vRow = vResult.rows[0];
            let job = null;
            if (vRow.job_data) {
                job = typeof vRow.job_data === "string" ? JSON.parse(vRow.job_data) : vRow.job_data;
            }
            if (!job || !job.requiredSkills || job.requiredSkills.length === 0) {
                const matchingJobRes = await database_1.db.query(`SELECT id, parsed_data FROM job_descriptions 
           WHERE user_id = $1 
           ORDER BY CASE WHEN LOWER(detected_role) = LOWER($2) THEN 0 ELSE 1 END, created_at DESC 
           LIMIT 1`, [userId, vRow.target_role]);
                if (matchingJobRes.rows.length > 0) {
                    const jdRow = matchingJobRes.rows[0];
                    job = typeof jdRow.parsed_data === "string" ? JSON.parse(jdRow.parsed_data) : jdRow.parsed_data;
                    await database_1.db.query("UPDATE resume_versions SET target_job_id = $1 WHERE id = $2", [jdRow.id, versionId]);
                }
            }
            if (!job) {
                job = jobParser_1.JobParser.parse(vRow.target_role || "Target Professional Role");
            }
            const resumeData = content;
            const matches = matchingEngine_1.MatchingEngine.compare(resumeData, job);
            const keywords = matchingEngine_1.MatchingEngine.extractKeywords(resumeData, job);
            const atsScore = atsScoreService_1.ATSScoreService.calculateScore(resumeData, job, matches, keywords, customWeights);
            // Persist the recalculated score in DB
            await database_1.db.query(`UPDATE resume_versions
         SET ats_score = $1,
             score_breakdown = $2,
             content = COALESCE($3, content),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`, [
                atsScore.overallScore,
                JSON.stringify({ ...atsScore, keywords }),
                content ? JSON.stringify(content) : null,
                versionId
            ]);
            res.json({
                message: "ATS compatibility score recalculated successfully.",
                atsScore,
                keywords,
                matches
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to recalculate score." });
        }
    }
    static async listVersions(req, res) {
        try {
            const { resumeId } = req.params;
            const result = await database_1.db.query(`SELECT v.id, v.resume_id, v.version_number, v.version_name, v.target_role,
                v.ats_score, v.created_at, t.slug as template_slug
         FROM resume_versions v
         LEFT JOIN templates t ON v.template_id = t.id
         WHERE v.resume_id = $1
         ORDER BY v.version_number DESC`, [resumeId]);
            res.json({ versions: result.rows });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to list versions." });
        }
    }
    static async getVersion(req, res) {
        try {
            const { versionId } = req.params;
            const userId = req.user?.id;
            let result;
            if (versionId === "latest" || versionId === "default") {
                // Query user's latest version
                result = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
           FROM resume_versions v
           JOIN resumes r ON v.resume_id = r.id
           LEFT JOIN templates t ON v.template_id = t.id
           WHERE r.user_id = $1
           ORDER BY v.created_at DESC
           LIMIT 1`, [userId]);
                // Fallback to any latest version in database if user has none under their ID
                if (result.rows.length === 0) {
                    result = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
             FROM resume_versions v
             JOIN resumes r ON v.resume_id = r.id
             LEFT JOIN templates t ON v.template_id = t.id
             ORDER BY v.created_at DESC
             LIMIT 1`);
                }
            }
            else {
                result = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
           FROM resume_versions v
           JOIN resumes r ON v.resume_id = r.id
           LEFT JOIN templates t ON v.template_id = t.id
           WHERE v.id = $1`, [versionId]);
                // If specific versionId wasn't found (e.g. stale bookmark or updated ID), gracefully fallback to user's latest version
                if (result.rows.length === 0) {
                    result = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
             FROM resume_versions v
             JOIN resumes r ON v.resume_id = r.id
             LEFT JOIN templates t ON v.template_id = t.id
             WHERE r.user_id = $1
             ORDER BY v.created_at DESC
             LIMIT 1`, [userId]);
                    if (result.rows.length === 0) {
                        result = await database_1.db.query(`SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
               FROM resume_versions v
               JOIN resumes r ON v.resume_id = r.id
               LEFT JOIN templates t ON v.template_id = t.id
               ORDER BY v.created_at DESC
               LIMIT 1`);
                    }
                }
            }
            if (result.rows.length === 0) {
                res.status(404).json({ error: "No tailored resume versions found yet. Please tailor a resume first." });
                return;
            }
            const row = result.rows[0];
            const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
            const originalJson = typeof row.original_json === "string" ? JSON.parse(row.original_json) : row.original_json;
            const scoreBreakdown = typeof row.score_breakdown === "string" ? JSON.parse(row.score_breakdown) : row.score_breakdown;
            const changesSummary = typeof row.changes_summary === "string" ? JSON.parse(row.changes_summary) : row.changes_summary;
            const unaddedItems = typeof row.unadded_items === "string" ? JSON.parse(row.unadded_items) : row.unadded_items;
            const suggestions = await database_1.db.query("SELECT id, section, suggestion_type, content, reason, actionable_step, dismissed FROM ai_suggestions WHERE resume_version_id = $1", [versionId]);
            // Fetch all sibling versions for easy switching
            const siblingVersions = await database_1.db.query(`SELECT id, version_number, version_name, ats_score, created_at
         FROM resume_versions
         WHERE resume_id = $1
         ORDER BY version_number DESC`, [row.resume_id]);
            res.json({
                version: {
                    id: row.id,
                    resumeId: row.resume_id,
                    versionNumber: row.version_number,
                    versionName: row.version_name,
                    targetRole: row.target_role,
                    templateSlug: row.template_slug || "executive_classic",
                    atsScore: row.ats_score,
                    scoreBreakdown,
                    changesSummary,
                    unaddedItems,
                    content,
                    originalResume: originalJson,
                    suggestions: suggestions.rows,
                    keywords: scoreBreakdown?.keywords || null,
                    allVersions: siblingVersions.rows,
                    createdAt: row.created_at
                }
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to get version." });
        }
    }
    static async updateVersion(req, res) {
        try {
            const { versionId } = req.params;
            const { content, templateSlug, versionName } = req.body;
            let templateId = null;
            if (templateSlug) {
                const tRes = await database_1.db.query("SELECT id FROM templates WHERE slug = $1 LIMIT 1", [templateSlug]);
                if (tRes.rows.length > 0)
                    templateId = tRes.rows[0].id;
            }
            const result = await database_1.db.query(`UPDATE resume_versions
         SET content = COALESCE($1, content),
             version_name = COALESCE($2, version_name),
             template_id = COALESCE($3, template_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, version_name, updated_at`, [content ? JSON.stringify(content) : null, versionName || null, templateId, versionId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: "Version not found." });
                return;
            }
            res.json({ message: "Version updated successfully.", version: result.rows[0] });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to update version." });
        }
    }
}
exports.TailorController = TailorController;
