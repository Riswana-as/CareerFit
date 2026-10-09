import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database";
import { AuthRequest } from "../middleware/auth";
import { aiService } from "../ai/aiService";
import { StructuredResume, ExtractedJobDescription } from "../types";
import { JobParser } from "../parsers/jobParser";

export class TailorController {
  static async tailorResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { resumeId } = req.params;
      const { jobId, rawJobText, manualRole, customWeights, templateSlug } = req.body;

      // 1. Fetch source resume
      const resumeResult = await db.query(
        "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
        [resumeId, userId]
      );

      if (resumeResult.rows.length === 0) {
        res.status(404).json({ error: "Resume not found." });
        return;
      }

      const originalResume: StructuredResume =
        typeof resumeResult.rows[0].parsed_json === "string"
          ? JSON.parse(resumeResult.rows[0].parsed_json)
          : resumeResult.rows[0].parsed_json;

      // 2. Fetch or parse Job Description
      let job: ExtractedJobDescription;

      if (jobId) {
        const jobResult = await db.query(
          "SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2",
          [jobId, userId]
        );
        if (jobResult.rows.length === 0) {
          res.status(404).json({ error: "Target job description not found." });
          return;
        }
        const jobRow = jobResult.rows[0];
        job = typeof jobRow.parsed_data === "string" ? JSON.parse(jobRow.parsed_data) : jobRow.parsed_data;
      } else if (rawJobText) {
        job = JobParser.parse(rawJobText, { detectedRole: manualRole });
      } else {
        res.status(400).json({ error: "Please provide a valid jobId or rawJobText." });
        return;
      }

      if (manualRole) {
        job.detectedRole = manualRole;
      }

      // 3. Execute AI Tailoring with Zero-Fabrication Safety
      const tailoringResult = await aiService.tailorResume(originalResume, job, customWeights);

      // 4. Calculate Version Number
      const existingVersions = await db.query(
        "SELECT COUNT(*) as count FROM resume_versions WHERE resume_id = $1",
        [resumeId]
      );
      const nextVersionNumber = parseInt(existingVersions.rows[0]?.count || "0", 10) + 1;
      const versionName = `${job.detectedRole} – v${nextVersionNumber}`;
      const versionId = uuidv4();

      // Resolve template
      const templateResult = await db.query(
        "SELECT id FROM templates WHERE slug = $1 LIMIT 1",
        [templateSlug || "modern"]
      );
      const templateId = templateResult.rows[0]?.id || null;

      // 5. Store version in database
      await db.query(
        `INSERT INTO resume_versions (
           id, resume_id, target_job_id, version_number, version_name, target_role,
           content, ats_score, score_breakdown, changes_summary, unadded_items, template_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          versionId,
          resumeId,
          jobId || null,
          nextVersionNumber,
          versionName,
          job.detectedRole,
          JSON.stringify(tailoringResult.tailoredResume),
          tailoringResult.atsScore.overallScore,
          JSON.stringify(tailoringResult.atsScore),
          JSON.stringify(tailoringResult.changesMade),
          JSON.stringify(tailoringResult.unaddedItems),
          templateId
        ]
      );

      // Store suggestions
      for (const sugg of tailoringResult.suggestions) {
        await db.query(
          "INSERT INTO ai_suggestions (id, resume_version_id, section, suggestion_type, content, reason, actionable_step) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [sugg.id, versionId, sugg.section, sugg.type, sugg.content, sugg.reason, sugg.actionableStep || null]
        );
      }

      res.status(201).json({
        message: "Resume tailored successfully.",
        versionId,
        versionName,
        result: tailoringResult
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to tailor resume." });
    }
  }

  static async listVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { resumeId } = req.params;
      const result = await db.query(
        `SELECT v.id, v.resume_id, v.version_number, v.version_name, v.target_role,
                v.ats_score, v.created_at, t.slug as template_slug
         FROM resume_versions v
         LEFT JOIN templates t ON v.template_id = t.id
         WHERE v.resume_id = $1
         ORDER BY v.version_number DESC`,
        [resumeId]
      );
      res.json({ versions: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list versions." });
    }
  }

  static async getVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;

      const result = await db.query(
        `SELECT v.*, r.parsed_json as original_json, r.title as original_title, t.slug as template_slug
         FROM resume_versions v
         JOIN resumes r ON v.resume_id = r.id
         LEFT JOIN templates t ON v.template_id = t.id
         WHERE v.id = $1`,
        [versionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Resume version not found." });
        return;
      }

      const row = result.rows[0];
      const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
      const originalJson = typeof row.original_json === "string" ? JSON.parse(row.original_json) : row.original_json;
      const scoreBreakdown = typeof row.score_breakdown === "string" ? JSON.parse(row.score_breakdown) : row.score_breakdown;
      const changesSummary = typeof row.changes_summary === "string" ? JSON.parse(row.changes_summary) : row.changes_summary;
      const unaddedItems = typeof row.unadded_items === "string" ? JSON.parse(row.unadded_items) : row.unadded_items;

      const suggestions = await db.query(
        "SELECT id, section, suggestion_type, content, reason, actionable_step, dismissed FROM ai_suggestions WHERE resume_version_id = $1",
        [versionId]
      );

      res.json({
        version: {
          id: row.id,
          resumeId: row.resume_id,
          versionNumber: row.version_number,
          versionName: row.version_name,
          targetRole: row.target_role,
          templateSlug: row.template_slug || "modern",
          atsScore: row.ats_score,
          scoreBreakdown,
          changesSummary,
          unaddedItems,
          content,
          originalResume: originalJson,
          suggestions: suggestions.rows,
          createdAt: row.created_at
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get version." });
    }
  }

  static async updateVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;
      const { content, templateSlug, versionName } = req.body;

      let templateId: string | null = null;
      if (templateSlug) {
        const tRes = await db.query("SELECT id FROM templates WHERE slug = $1 LIMIT 1", [templateSlug]);
        if (tRes.rows.length > 0) templateId = tRes.rows[0].id;
      }

      const result = await db.query(
        `UPDATE resume_versions
         SET content = COALESCE($1, content),
             version_name = COALESCE($2, version_name),
             template_id = COALESCE($3, template_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, version_name, updated_at`,
        [content ? JSON.stringify(content) : null, versionName || null, templateId, versionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Version not found." });
        return;
      }

      res.json({ message: "Version updated successfully.", version: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update version." });
    }
  }
}
