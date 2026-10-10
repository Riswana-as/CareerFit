"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inMemoryDb = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
class InMemoryDatabase {
    users = [];
    profiles = [];
    templates = [];
    resumes = [];
    jobDescriptions = [];
    resumeVersions = [];
    userSettings = [];
    jobApplications = [];
    constructor() {
        this.seedDefaultData();
    }
    async seedDefaultData() {
        // Seed templates
        this.templates = [
            {
                id: (0, uuid_1.v4)(),
                name: "Classic ATS",
                slug: "classic",
                description: "Timeless single-column ATS layout with clear standard headers and bullet points.",
                layout_config: {
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    lineSpacing: 1.3,
                    margin: 0.75,
                    headerStyle: "classic",
                    accentColor: "#0f172a"
                }
            },
            {
                id: (0, uuid_1.v4)(),
                name: "Modern ATS",
                slug: "modern",
                description: "Polished modern styling with subtle divider lines and prioritized technical hierarchy.",
                layout_config: {
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9.5,
                    lineSpacing: 1.35,
                    margin: 0.65,
                    headerStyle: "modern",
                    accentColor: "#016dc6"
                }
            },
            {
                id: (0, uuid_1.v4)(),
                name: "Executive Classic (Harvard ATS)",
                slug: "executive_classic",
                description: "Classic executive serif template with centered header, horizontal section dividers, right-aligned dates, and balanced two-column skills. High ATS pass rate.",
                layout_config: {
                    fontFamily: "Georgia, Times New Roman, serif",
                    fontSize: 10,
                    lineSpacing: 1.35,
                    margin: 0.75,
                    headerStyle: "centered_serif",
                    accentColor: "#000000"
                }
            }
        ];
        // Seed Demo Account (riswana@example.com / password123)
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash("password123", salt);
        const demoUserId = "84a85381-b1ae-4c7e-a8b5-1f40f6a02c6f";
        this.users.push({
            id: demoUserId,
            email: "riswana@example.com",
            password_hash: passwordHash,
            full_name: "Riswana A S",
            email_verified: true,
            created_at: new Date()
        });
        this.profiles.push({
            id: (0, uuid_1.v4)(),
            user_id: demoUserId,
            headline: "Software Professional",
            created_at: new Date()
        });
        this.userSettings.push({
            id: (0, uuid_1.v4)(),
            user_id: demoUserId,
            default_template: "modern",
            scoring_weights: { skills: 30, experience: 25, keywords: 20, responsibilities: 15, education: 5, structure: 5 }
        });
    }
    async query(sql, params = []) {
        const s = sql.trim();
        const upper = s.toUpperCase();
        // 1. DDL / Migration statements - ignore gracefully
        if (upper.startsWith("CREATE ") ||
            upper.startsWith("ALTER ") ||
            upper.startsWith("DROP ") ||
            upper.startsWith("SELECT 1")) {
            return { rows: [], rowCount: 0 };
        }
        // 2. Count templates
        if (upper.includes("SELECT COUNT(*) AS COUNT FROM TEMPLATES")) {
            return { rows: [{ count: this.templates.length }], rowCount: 1 };
        }
        // 3. Find templates
        if (upper.startsWith("SELECT") && upper.includes("FROM TEMPLATES")) {
            if (upper.includes("WHERE SLUG = $1")) {
                const found = this.templates.filter((t) => t.slug === params[0]);
                return { rows: found, rowCount: found.length };
            }
            return { rows: this.templates, rowCount: this.templates.length };
        }
        // 4. Insert templates
        if (upper.startsWith("INSERT INTO TEMPLATES")) {
            this.templates.push({
                id: params[0],
                name: params[1],
                slug: params[2],
                description: params[3],
                layout_config: typeof params[4] === "string" ? JSON.parse(params[4]) : params[4]
            });
            return { rows: [], rowCount: 1 };
        }
        // 5. Users queries
        if (upper.startsWith("SELECT") && upper.includes("FROM USERS")) {
            if (upper.includes("WHERE EMAIL = $1")) {
                const email = String(params[0] || "").toLowerCase().trim();
                const found = this.users.filter((u) => u.email.toLowerCase().trim() === email);
                return { rows: found, rowCount: found.length };
            }
            if (upper.includes("WHERE ID = $1")) {
                const found = this.users.filter((u) => u.id === params[0]);
                return { rows: found, rowCount: found.length };
            }
        }
        // 6. Insert user
        if (upper.startsWith("INSERT INTO USERS")) {
            const newUser = {
                id: params[0],
                email: String(params[1]).toLowerCase().trim(),
                password_hash: params[2],
                full_name: params[3],
                email_verified: params[4] ?? true,
                created_at: new Date()
            };
            this.users.push(newUser);
            return { rows: [], rowCount: 1 };
        }
        // 7. Profiles
        if (upper.startsWith("INSERT INTO PROFILES")) {
            this.profiles.push({
                id: params[0],
                user_id: params[1],
                headline: params[2] || "Software Professional"
            });
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("SELECT") && upper.includes("FROM PROFILES")) {
            const found = this.profiles.filter((p) => p.user_id === params[0]);
            return { rows: found, rowCount: found.length };
        }
        // 8. User settings
        if (upper.startsWith("INSERT INTO USER_SETTINGS")) {
            this.userSettings.push({
                id: params[0],
                user_id: params[1],
                default_template: "modern"
            });
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("SELECT") && upper.includes("FROM USER_SETTINGS")) {
            const found = this.userSettings.filter((u) => u.user_id === params[0]);
            return { rows: found, rowCount: found.length };
        }
        // 9. Resumes
        if (upper.startsWith("INSERT INTO RESUMES")) {
            const r = {
                id: params[0],
                user_id: params[1],
                title: params[2],
                original_file_name: params[3],
                original_file_path: params[4],
                file_mime_type: params[5],
                file_size: params[6],
                parsed_json: typeof params[7] === "string" ? JSON.parse(params[7]) : params[7],
                created_at: new Date()
            };
            this.resumes.push(r);
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("SELECT") && upper.includes("FROM RESUMES")) {
            if (upper.includes("WHERE USER_ID = $1")) {
                const found = this.resumes.filter((r) => r.user_id === params[0]);
                return { rows: found, rowCount: found.length };
            }
            if (upper.includes("WHERE ID = $1")) {
                const found = this.resumes.filter((r) => r.id === params[0]);
                return { rows: found, rowCount: found.length };
            }
            return { rows: this.resumes, rowCount: this.resumes.length };
        }
        if (upper.startsWith("UPDATE RESUMES")) {
            if (upper.includes("WHERE ID = $2")) {
                const item = this.resumes.find((r) => r.id === params[1]);
                if (item) {
                    item.parsed_json = typeof params[0] === "string" ? JSON.parse(params[0]) : params[0];
                }
            }
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("DELETE FROM RESUMES")) {
            this.resumes = this.resumes.filter((r) => r.id !== params[0]);
            return { rows: [], rowCount: 1 };
        }
        // 10. Job Descriptions
        if (upper.startsWith("INSERT INTO JOB_DESCRIPTIONS")) {
            const jd = {
                id: params[0],
                user_id: params[1],
                title: params[2],
                company: params[3],
                raw_text: params[4],
                source_url: params[5],
                detected_role: params[6],
                detection_confidence: params[7],
                department: params[8],
                experience_level: params[9],
                location: params[10],
                employment_type: params[11],
                parsed_data: typeof params[12] === "string" ? JSON.parse(params[12]) : params[12],
                created_at: new Date()
            };
            this.jobDescriptions.push(jd);
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("SELECT") && upper.includes("FROM JOB_DESCRIPTIONS")) {
            if (upper.includes("WHERE ID = $1")) {
                const found = this.jobDescriptions.filter((j) => j.id === params[0]);
                return { rows: found, rowCount: found.length };
            }
            return { rows: this.jobDescriptions, rowCount: this.jobDescriptions.length };
        }
        // 11. Resume Versions
        if (upper.startsWith("INSERT INTO RESUME_VERSIONS")) {
            const rv = {
                id: params[0],
                resume_id: params[1],
                target_job_id: params[2],
                version_number: params[3],
                version_name: params[4],
                target_role: params[5],
                content: typeof params[6] === "string" ? JSON.parse(params[6]) : params[6],
                ats_score: params[7],
                score_breakdown: typeof params[8] === "string" ? JSON.parse(params[8]) : params[8],
                changes_summary: typeof params[9] === "string" ? JSON.parse(params[9]) : params[9],
                unadded_items: typeof params[10] === "string" ? JSON.parse(params[10]) : params[10],
                template_id: params[11],
                created_at: new Date()
            };
            this.resumeVersions.push(rv);
            return { rows: [], rowCount: 1 };
        }
        if (upper.startsWith("SELECT") && upper.includes("FROM RESUME_VERSIONS")) {
            if (upper.includes("WHERE ID = $1") || upper.includes("WHERE RV.ID = $1")) {
                const found = this.resumeVersions.filter((v) => v.id === params[0]);
                return { rows: found, rowCount: found.length };
            }
            if (upper.includes("WHERE RESUME_ID = $1")) {
                const found = this.resumeVersions.filter((v) => v.resume_id === params[0]);
                return { rows: found, rowCount: found.length };
            }
            return { rows: this.resumeVersions, rowCount: this.resumeVersions.length };
        }
        if (upper.startsWith("UPDATE RESUME_VERSIONS")) {
            const item = this.resumeVersions.find((v) => v.id === params[params.length - 1]);
            if (item && params[0]) {
                try {
                    item.content = typeof params[0] === "string" ? JSON.parse(params[0]) : params[0];
                }
                catch { }
            }
            return { rows: [], rowCount: 1 };
        }
        // 12. Job Applications
        if (upper.startsWith("SELECT") && upper.includes("FROM JOB_APPLICATIONS")) {
            const found = this.jobApplications.filter((a) => a.user_id === params[0]);
            return { rows: found, rowCount: found.length };
        }
        if (upper.startsWith("INSERT INTO JOB_APPLICATIONS")) {
            this.jobApplications.push({
                id: params[0],
                user_id: params[1],
                company: params[2],
                position: params[3],
                status: params[4] || "saved",
                created_at: new Date()
            });
            return { rows: [], rowCount: 1 };
        }
        // Default empty response
        return { rows: [], rowCount: 0 };
    }
}
exports.inMemoryDb = new InMemoryDatabase();
