import { Response } from "express";
import { db } from "../db/database";
import { AuthRequest } from "../middleware/auth";
import { ExportService } from "../services/exportService";
import { StructuredResume } from "../types";

export class ExportController {
  static async exportPdf(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { versionId, template } = req.query;

      let resumeContent: StructuredResume;
      let filename = "Resume.pdf";
      let resolvedTemplate = (template as string) || "executive_classic";

      if (versionId) {
        const vResult = await db.query(
          `SELECT v.content, v.version_name, t.slug as template_slug 
           FROM resume_versions v 
           LEFT JOIN templates t ON v.template_id = t.id 
           WHERE v.id = $1`,
          [versionId]
        );
        if (vResult.rows.length === 0) {
          res.status(404).json({ error: "Version not found." });
          return;
        }
        const vRow = vResult.rows[0];
        resumeContent = typeof vRow.content === "string" ? JSON.parse(vRow.content) : vRow.content;
        filename = `${(vRow.version_name || "Tailored_Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        if (!template && vRow.template_slug) {
          resolvedTemplate = vRow.template_slug;
        }
      } else {
        const rResult = await db.query(
          "SELECT parsed_json, title FROM resumes WHERE id = $1",
          [id]
        );
        if (rResult.rows.length === 0) {
          res.status(404).json({ error: "Resume not found." });
          return;
        }
        const rRow = rResult.rows[0];
        resumeContent = typeof rRow.parsed_json === "string" ? JSON.parse(rRow.parsed_json) : rRow.parsed_json;
        filename = `${(rRow.title || "Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      }

      const pdfBuffer = await ExportService.generatePdf(resumeContent, resolvedTemplate);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate PDF." });
    }
  }

  static async exportDocx(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { versionId, template } = req.query;

      let resumeContent: StructuredResume;
      let filename = "Resume.docx";
      let resolvedTemplate = (template as string) || "executive_classic";

      if (versionId) {
        const vResult = await db.query(
          `SELECT v.content, v.version_name, t.slug as template_slug 
           FROM resume_versions v 
           LEFT JOIN templates t ON v.template_id = t.id 
           WHERE v.id = $1`,
          [versionId]
        );
        if (vResult.rows.length === 0) {
          res.status(404).json({ error: "Version not found." });
          return;
        }
        const vRow = vResult.rows[0];
        resumeContent = typeof vRow.content === "string" ? JSON.parse(vRow.content) : vRow.content;
        filename = `${(vRow.version_name || "Tailored_Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
        if (!template && vRow.template_slug) {
          resolvedTemplate = vRow.template_slug;
        }
      } else {
        const rResult = await db.query(
          "SELECT parsed_json, title FROM resumes WHERE id = $1",
          [id]
        );
        if (rResult.rows.length === 0) {
          res.status(404).json({ error: "Resume not found." });
          return;
        }
        const rRow = rResult.rows[0];
        resumeContent = typeof rRow.parsed_json === "string" ? JSON.parse(rRow.parsed_json) : rRow.parsed_json;
        filename = `${(rRow.title || "Resume").replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
      }

      const docxBuffer = await ExportService.generateDocx(resumeContent, resolvedTemplate);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(docxBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate Word DOCX." });
    }
  }
}
