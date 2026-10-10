"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const database_1 = require("../db/database");
class AnalyticsController {
    static async getDashboard(req, res) {
        try {
            const userId = req.user?.id;
            // Primary resume
            const resumeRes = await database_1.db.query("SELECT id, title, updated_at FROM resumes WHERE user_id = $1 ORDER BY is_primary DESC, updated_at DESC LIMIT 1", [userId]);
            const currentResume = resumeRes.rows[0] || null;
            // Applications breakdown
            const appCountsRes = await database_1.db.query(`SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'applied') as applied,
           COUNT(*) FILTER (WHERE status = 'interview') as interviews,
           COUNT(*) FILTER (WHERE status = 'offer' OR status = 'accepted') as offers
         FROM job_applications
         WHERE user_id = $1`, [userId]);
            const appStats = appCountsRes.rows[0] || { total: 0, applied: 0, interviews: 0, offers: 0 };
            // Average ATS Score
            const atsRes = await database_1.db.query(`SELECT AVG(v.ats_score) as avg_score, MAX(v.ats_score) as max_score
         FROM resume_versions v
         JOIN resumes r ON v.resume_id = r.id
         WHERE r.user_id = $1`, [userId]);
            const avgAtsScore = Math.round(parseFloat(atsRes.rows[0]?.avg_score || "0"));
            // Target Roles
            const rolesRes = await database_1.db.query(`SELECT DISTINCT target_role, COUNT(*) as count
         FROM resume_versions v
         JOIN resumes r ON v.resume_id = r.id
         WHERE r.user_id = $1 AND target_role IS NOT NULL
         GROUP BY target_role
         ORDER BY count DESC
         LIMIT 4`, [userId]);
            const targetRoles = rolesRes.rows.map((r) => r.target_role);
            // Recent Versions
            const recentVersionsRes = await database_1.db.query(`SELECT v.id, v.version_name, v.target_role, v.ats_score, v.created_at, r.title as original_title
         FROM resume_versions v
         JOIN resumes r ON v.resume_id = r.id
         WHERE r.user_id = $1
         ORDER BY v.created_at DESC
         LIMIT 4`, [userId]);
            res.json({
                stats: {
                    currentResume,
                    atsScore: avgAtsScore || (currentResume ? 78 : 0),
                    applications: {
                        total: parseInt(appStats.total || "0", 10),
                        applied: parseInt(appStats.applied || "0", 10),
                        interviews: parseInt(appStats.interviews || "0", 10),
                        offers: parseInt(appStats.offers || "0", 10)
                    },
                    targetRoles: targetRoles.length > 0 ? targetRoles : ["Backend Developer", "Frontend Developer", "Full Stack Developer"],
                    recentVersions: recentVersionsRes.rows
                }
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to fetch dashboard metrics." });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
