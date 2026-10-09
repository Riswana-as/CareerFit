import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database";
import { AuthRequest } from "../middleware/auth";
import { JobParser } from "../parsers/jobParser";

export class JobController {
  static async analyzeJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { rawText, title, company, manualOverrides } = req.body;

      if (!rawText || rawText.trim().length < 20) {
        res.status(400).json({ error: "Please enter or upload a valid job description." });
        return;
      }

      const parsed = JobParser.parse(rawText, {
        title,
        company,
        ...manualOverrides
      });

      const jobId = uuidv4();

      await db.query(
        `INSERT INTO job_descriptions (id, user_id, title, company, raw_text, detected_role, detection_confidence, department, experience_level, location, employment_type, parsed_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          jobId,
          userId,
          parsed.title,
          parsed.company || "Target Employer",
          parsed.rawText,
          parsed.detectedRole,
          parsed.roleConfidence,
          parsed.department,
          parsed.experienceLevel,
          parsed.location,
          parsed.employmentType,
          JSON.stringify(parsed)
        ]
      );

      // Save requirements to normalized table
      for (const reqSkill of parsed.requiredSkills) {
        await db.query(
          "INSERT INTO job_requirements (id, job_description_id, category, requirement_text, is_mandatory, importance_weight) VALUES ($1, $2, $3, $4, true, 5)",
          [uuidv4(), jobId, "technical_skill", reqSkill]
        );
      }

      for (const prefSkill of parsed.preferredSkills) {
        await db.query(
          "INSERT INTO job_requirements (id, job_description_id, category, requirement_text, is_mandatory, importance_weight) VALUES ($1, $2, $3, $4, false, 3)",
          [uuidv4(), jobId, "technical_skill", prefSkill]
        );
      }

      res.status(201).json({
        message: "Job description analyzed successfully.",
        job: {
          id: jobId,
          ...parsed
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to analyze job description." });
    }
  }

  static async listJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await db.query(
        "SELECT id, title, company, detected_role, detection_confidence, experience_level, location, created_at FROM job_descriptions WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      res.json({ jobs: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list job descriptions." });
    }
  }

  static async getJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await db.query(
        "SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Job description not found." });
        return;
      }

      const job = result.rows[0];
      const parsedData = typeof job.parsed_data === "string" ? JSON.parse(job.parsed_data) : job.parsed_data;

      res.json({ job: { ...job, parsedData } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get job description." });
    }
  }
}
