import fs from "fs";
import path from "path";
import { db } from "./database";
import { v4 as uuidv4 } from "uuid";

export async function runMigrations(): Promise<void> {
  console.log("[DB] Running schema migrations...");
  let schemaPath = path.resolve(__dirname, "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, "../../src/db/schema.sql");
  }
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  // Execute schema
  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.query(stmt);
    } catch (err: any) {
      console.warn("[DB Migration Warning]", err.message);
    }
  }

  // Seed default templates if not present
  const existingTemplates = await db.query("SELECT COUNT(*) as count FROM templates");
  const count = parseInt((existingTemplates.rows[0] as any)?.count || "0", 10);

  if (count === 0) {
    console.log("[DB] Seeding standard ATS resume templates...");
    const templates = [
      {
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
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
      await db.query(
        "INSERT INTO templates (id, name, slug, description, layout_config) VALUES ($1, $2, $3, $4, $5)",
        [t.id, t.name, t.slug, t.description, t.layout_config]
      );
    }
  }

  // Ensure Executive Classic template exists
  const hasExec = await db.query("SELECT id FROM templates WHERE slug = 'executive_classic'");
  if (hasExec.rows.length === 0) {
    const execTemplate = {
      id: uuidv4(),
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
    await db.query(
      "INSERT INTO templates (id, name, slug, description, layout_config) VALUES ($1, $2, $3, $4, $5)",
      [execTemplate.id, execTemplate.name, execTemplate.slug, execTemplate.description, execTemplate.layout_config]
    );
  }

  console.log("[DB] Migrations and templates verified successfully.");
}