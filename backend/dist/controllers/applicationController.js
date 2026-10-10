"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationController = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
class ApplicationController {
    static async createApplication(req, res) {
        try {
            const userId = req.user?.id;
            const { company, position, jobUrl, appliedDate, resumeVersionId, status, notes, interviewDate } = req.body;
            if (!company || !position) {
                res.status(400).json({ error: "Company and position are required." });
                return;
            }
            const id = (0, uuid_1.v4)();
            await database_1.db.query(`INSERT INTO job_applications (id, user_id, company, position, job_url, applied_date, resume_version_id, status, notes, interview_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
                id,
                userId,
                company.trim(),
                position.trim(),
                jobUrl || null,
                appliedDate || new Date().toISOString().split("T")[0],
                resumeVersionId || null,
                status || "applied",
                notes || null,
                interviewDate || null
            ]);
            res.status(201).json({ message: "Job application tracked successfully.", applicationId: id });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to create application entry." });
        }
    }
    static async listApplications(req, res) {
        try {
            const userId = req.user?.id;
            const result = await database_1.db.query(`SELECT a.*, v.version_name, v.ats_score
         FROM job_applications a
         LEFT JOIN resume_versions v ON a.resume_version_id = v.id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC`, [userId]);
            res.json({ applications: result.rows });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to list applications." });
        }
    }
    static async updateApplication(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { status, notes, interviewDate, company, position } = req.body;
            const result = await database_1.db.query(`UPDATE job_applications
         SET status = COALESCE($1, status),
             notes = COALESCE($2, notes),
             interview_date = COALESCE($3, interview_date),
             company = COALESCE($4, company),
             position = COALESCE($5, position),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`, [status, notes, interviewDate, company, position, id, userId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: "Application not found." });
                return;
            }
            res.json({ message: "Application updated.", application: result.rows[0] });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to update application." });
        }
    }
    static async deleteApplication(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await database_1.db.query("DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: "Application not found." });
                return;
            }
            res.json({ message: "Application removed from tracker." });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to delete application." });
        }
    }
}
exports.ApplicationController = ApplicationController;
