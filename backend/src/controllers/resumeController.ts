import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database";
import { AuthRequest } from "../middleware/auth";
import { ResumeParser } from "../parsers/resumeParser";
import { StructuredResume } from "../types";

export class ResumeController {
  static async uploadResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "Please provide a resume file (PDF, DOCX, or TXT)." });
        return;
      }

      const rawText = await ResumeParser.extractRawText(file.path, file.mimetype);
      if (!rawText || rawText.trim().length < 20) {
        res.status(400).json({ error: "Could not extract readable text from the uploaded document." });
        return;
      }

      const structured = ResumeParser.parse(rawText);
      const resumeId = uuidv4();
      const title = structured.personal.name
        ? `${structured.personal.name}'s Resume`
        : file.originalname.replace(/\.[^/.]+$/, "");

      await db.query(
        `INSERT INTO resumes (id, user_id, title, original_file_name, original_file_path, file_mime_type, file_size, parsed_json, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          resumeId,
          userId,
          title,
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          JSON.stringify(structured),
          true
        ]
      );

      // Populate normalized sub-tables
      if (structured.experience) {
        for (const exp of structured.experience) {
          await db.query(
            `INSERT INTO experiences (id, resume_id, company, job_title, start_date, end_date, is_current, responsibilities, achievements)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              uuidv4(),
              resumeId,
              exp.company,
              exp.jobTitle,
              exp.startDate,
              exp.endDate,
              exp.isCurrent || false,
              JSON.stringify(exp.responsibilities || []),
              JSON.stringify(exp.achievements || [])
            ]
          );
        }
      }

      if (structured.education) {
        for (const edu of structured.education) {
          await db.query(
            `INSERT INTO educations (id, resume_id, institution, degree, field_of_study, start_date, end_date, gpa)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              uuidv4(),
              resumeId,
              edu.institution,
              edu.degree,
              edu.fieldOfStudy || "",
              edu.startDate || "",
              edu.endDate || "",
              edu.gpa || ""
            ]
          );
        }
      }

      if (structured.projects) {
        for (const proj of structured.projects) {
          await db.query(
            `INSERT INTO projects (id, resume_id, title, description, technologies, url, relevance_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              uuidv4(),
              resumeId,
              proj.title,
              proj.description,
              JSON.stringify(proj.technologies || []),
              proj.url || "",
              proj.relevanceScore || 0
            ]
          );
        }
      }

      res.status(201).json({
        message: "Resume uploaded and parsed successfully.",
        resume: {
          id: resumeId,
          title,
          originalFileName: file.originalname,
          parsedData: structured
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to process resume upload." });
    }
  }

  static async listResumes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await db.query(
        `SELECT r.id, r.title, r.original_file_name, r.is_primary, r.created_at, r.updated_at,
                (SELECT COUNT(*) FROM resume_versions WHERE resume_id = r.id) as version_count,
                (SELECT ats_score FROM resume_versions WHERE resume_id = r.id ORDER BY created_at DESC LIMIT 1) as latest_ats_score
         FROM resumes r
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      );
      res.json({ resumes: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list resumes." });
    }
  }

  static async getResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await db.query(
        "SELECT id, title, original_file_name, parsed_json, is_primary, created_at, updated_at FROM resumes WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Resume not found." });
        return;
      }

      const resume = result.rows[0];
      const parsed = typeof resume.parsed_json === "string" ? JSON.parse(resume.parsed_json) : resume.parsed_json;

      res.json({
        resume: {
          id: resume.id,
          title: resume.title,
          originalFileName: resume.original_file_name,
          parsedData: parsed,
          createdAt: resume.created_at,
          updatedAt: resume.updated_at
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch resume." });
    }
  }

  static async updateResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { title, parsedData } = req.body;

      const result = await db.query(
        `UPDATE resumes
         SET title = COALESCE($1, title),
             parsed_json = COALESCE($2, parsed_json),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4
         RETURNING id, title, parsed_json, updated_at`,
        [title, parsedData ? JSON.stringify(parsedData) : null, id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Resume not found." });
        return;
      }

      res.json({ message: "Resume updated successfully.", resume: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update resume." });
    }
  }

  static async deleteResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await db.query(
        "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Resume not found." });
        return;
      }

      res.json({ message: "Resume deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete resume." });
    }
  }

  static async duplicateResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const original = await db.query(
        "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (original.rows.length === 0) {
        res.status(404).json({ error: "Resume not found." });
        return;
      }

      const orig = original.rows[0];
      const newId = uuidv4();
      const newTitle = `${orig.title} (Copy)`;

      await db.query(
        `INSERT INTO resumes (id, user_id, title, original_file_name, original_file_path, file_mime_type, file_size, parsed_json, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
        [
          newId,
          userId,
          newTitle,
          orig.original_file_name,
          orig.original_file_path,
          orig.file_mime_type,
          orig.file_size,
          orig.parsed_json
        ]
      );

      res.status(201).json({ message: "Resume duplicated successfully.", newResumeId: newId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to duplicate resume." });
    }
  }
}
