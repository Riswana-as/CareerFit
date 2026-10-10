"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const database_1 = require("./database");
const uuid_1 = require("uuid");
const schemaSql_1 = require("./schemaSql");
let hasMigrated = false;
async function runMigrations() {
    if (hasMigrated)
        return;
    console.log("[DB] Running schema migrations...");
    const schemaSql = schemaSql_1.SCHEMA_SQL;
    // Execute schema
    const statements = schemaSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    for (const stmt of statements) {
        try {
            await database_1.db.query(stmt);
        }
        catch (err) {
            console.warn("[DB Migration Warning]", err.message);
        }
    }
    // Seed default templates if not present
    const existingTemplates = await database_1.db.query("SELECT COUNT(*) as count FROM templates");
    const count = parseInt(existingTemplates.rows[0]?.count || "0", 10);
    if (count === 0) {
        console.log("[DB] Seeding standard ATS resume templates...");
        const templates = [
            {
                id: (0, uuid_1.v4)(),
                name: "Classic ATS",
                slug: "classic",
                description: "Timeless single-column ATS layout with clear standard headers and bullet points.",
                layout_config: JSON.stringify({
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    lineSpacing: 1.3,
                    margin: 0.75,
                    headerStyle: "classic",
                    accentColor: "#0f172a"
                })
            },
            {
                id: (0, uuid_1.v4)(),
                name: "Modern ATS",
                slug: "modern",
                description: "Polished modern styling with subtle divider lines and prioritized technical hierarchy.",
                layout_config: JSON.stringify({
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9.5,
                    lineSpacing: 1.35,
                    margin: 0.65,
                    headerStyle: "modern",
                    accentColor: "#016dc6"
                })
            },
            {
                id: (0, uuid_1.v4)(),
                name: "Technical Role",
                slug: "technical",
                description: "Optimized for Software Engineers, DevOps, and Technical Architects. Prioritizes skills and repositories.",
                layout_config: JSON.stringify({
                    fontFamily: "JetBrains Mono, Inter, monospace",
                    fontSize: 9.5,
                    lineSpacing: 1.3,
                    margin: 0.65,
                    headerStyle: "tech",
                    accentColor: "#0f766e"
                })
            },
            {
                id: (0, uuid_1.v4)(),
                name: "Fresh Graduate",
                slug: "fresh_graduate",
                description: "Designed for entry-level candidates, elevating education, relevant academic projects, and certifications.",
                layout_config: JSON.stringify({
                    fontFamily: "Merriweather, serif",
                    fontSize: 10,
                    lineSpacing: 1.4,
                    margin: 0.75,
                    headerStyle: "academic",
                    accentColor: "#4338ca"
                })
            }
        ];
        for (const t of templates) {
            await database_1.db.query("INSERT INTO templates (id, name, slug, description, layout_config) VALUES ($1, $2, $3, $4, $5)", [t.id, t.name, t.slug, t.description, t.layout_config]);
        }
    }
    // Ensure Executive Classic template exists
    const hasExec = await database_1.db.query("SELECT id FROM templates WHERE slug = 'executive_classic'");
    if (hasExec.rows.length === 0) {
        const execTemplate = {
            id: (0, uuid_1.v4)(),
            name: "Executive Classic (Harvard ATS)",
            slug: "executive_classic",
            description: "Classic executive serif template with centered header, horizontal section dividers, right-aligned dates, and balanced two-column skills. High ATS pass rate.",
            layout_config: JSON.stringify({
                fontFamily: "Georgia, Times New Roman, serif",
                fontSize: 10,
                lineSpacing: 1.35,
                margin: 0.75,
                headerStyle: "centered_serif",
                accentColor: "#000000"
            })
        };
        await database_1.db.query("INSERT INTO templates (id, name, slug, description, layout_config) VALUES ($1, $2, $3, $4, $5)", [execTemplate.id, execTemplate.name, execTemplate.slug, execTemplate.description, execTemplate.layout_config]);
    }
    // Seed default demo user if not present
    try {
        const existingDemo = await database_1.db.query("SELECT id FROM users WHERE email = $1", ["riswana@example.com"]);
        if (existingDemo.rows.length === 0) {
            console.log("[DB] Seeding default demo account (riswana@example.com)...");
            const bcrypt = await Promise.resolve().then(() => __importStar(require("bcryptjs")));
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash("password123", salt);
            const demoUserId = "84a85381-b1ae-4c7e-a8b5-1f40f6a02c6f";
            await database_1.db.query("INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES ($1, $2, $3, $4, $5)", [demoUserId, "riswana@example.com", passwordHash, "Riswana A S", true]);
            await database_1.db.query("INSERT INTO profiles (id, user_id, headline) VALUES ($1, $2, $3)", [(0, uuid_1.v4)(), demoUserId, "Software Professional"]);
            await database_1.db.query("INSERT INTO user_settings (id, user_id) VALUES ($1, $2)", [(0, uuid_1.v4)(), demoUserId]);
            console.log("[DB] Default demo account seeded.");
        }
    }
    catch (err) {
        console.warn("[DB] Demo user seed warning:", err.message);
    }
    hasMigrated = true;
    console.log("[DB] Migrations and templates verified successfully.");
}
