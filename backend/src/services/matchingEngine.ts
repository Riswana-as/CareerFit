import {
  StructuredResume,
  ExtractedJobDescription,
  RequirementMatch,
  KeywordAnalysis,
  MatchStatus
} from "../types";
import { v4 as uuidv4 } from "uuid";

export class MatchingEngine {
  static compare(resume: StructuredResume, job: ExtractedJobDescription): RequirementMatch[] {
    const matches: RequirementMatch[] = [];
    const allResumeText = (
      JSON.stringify(resume.skills) +
      " " +
      (resume.headline || "") +
      " " +
      (resume.summary || "") +
      " " +
      (resume.experience || []).map((e) => e.jobTitle + " " + (e.company || "") + " " + (e.responsibilities || []).join(" ")).join(" ") +
      " " +
      (resume.projects || []).map((p) => p.title + " " + (p.description || "") + " " + (p.technologies || []).join(" ")).join(" ") +
      " " +
      (resume.education || []).map((ed) => (ed.degree || "") + " " + (ed.institution || "")).join(" ") +
      " " +
      (resume.certifications || []).map((c) => (c.name || "") + " " + (c.issuingOrganization || "")).join(" ") +
      " " +
      (resume.languages || []).join(" ")
    ).toLowerCase();

    // 1. Evaluate required and preferred skills
    const allSkillsToTest = [
      ...job.requiredSkills.map((s) => ({ text: s, category: "technical_skill" })),
      ...job.preferredSkills.map((s) => ({ text: s, category: "preferred_skill" }))
    ];

    for (const item of allSkillsToTest) {
      const lowerReq = item.text.toLowerCase();
      let status: MatchStatus = "missing";
      let matchingText = "";
      let explanation = "";
      let confidence = 0;

      // Extract acronym inside parens and clean base name
      const parenMatch = item.text.match(/\(([^)]+)\)/);
      const acronym = parenMatch ? parenMatch[1].toLowerCase() : null;
      const baseName = item.text.replace(/\s*\([^)]+\)/g, "").trim().toLowerCase();
      const baseAmpersand = baseName.replace(/\band\b/g, "&");

      const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const baseRegex = new RegExp(`\\b${escapedBase}\\b`, "i");

      // Check if resume contains exact text, base name, ampersand variant, or acronym
      const hasExact = allResumeText.includes(lowerReq);
      const hasBase = (baseName.length > 3 && (baseRegex.test(allResumeText) || allResumeText.includes(baseName)));
      const hasAmpersand = allResumeText.includes(baseAmpersand);
      const hasAcronym = acronym ? new RegExp(`\\b${acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(allResumeText) : false;

      if (hasExact || hasBase || hasAmpersand || hasAcronym) {
        status = "strong";
        matchingText = item.text;
        explanation = `Found direct evidence of "${item.text}" in your resume.`;
        confidence = 95;
      } else {
        // Multi-industry partial / synonym check
        const related = this.findRelatedInResume(lowerReq, allResumeText);
        if (related) {
          status = "partial";
          matchingText = related;
          explanation = `Found related competency "${related}", which partially aligns with "${item.text}".`;
          confidence = 68;
        } else {
          status = "missing";
          explanation = `No direct or related evidence found in your resume for "${item.text}".`;
          confidence = 0;
        }
      }

      matches.push({
        requirementId: uuidv4(),
        requirementText: item.text,
        category: item.category,
        status,
        matchingText,
        explanation,
        confidence
      });
    }

    // 2. Evaluate Responsibilities
    for (const resp of job.responsibilities.slice(0, 5)) {
      const respLower = resp.toLowerCase();
      const words = respLower.split(/\s+/).filter((w) => w.length > 3 && !/^(with|that|this|have|from|will|your|about)$/i.test(w));
      const matchedWords = words.filter((w) => allResumeText.includes(w));
      const matchRatio = words.length > 0 ? matchedWords.length / words.length : 0;

      let status: MatchStatus = "missing";
      if (matchRatio >= 0.45) status = "strong";
      else if (matchRatio >= 0.2) status = "partial";

      matches.push({
        requirementId: uuidv4(),
        requirementText: resp,
        category: "responsibility",
        status,
        matchingText: matchedWords.slice(0, 5).join(", "),
        explanation:
          status === "strong"
            ? "Your experience demonstrates strong alignment with this responsibility."
            : status === "partial"
            ? "Partial alignment found through related professional activities."
            : "No direct experience identified for this specific duty.",
        confidence: Math.round(matchRatio * 100)
      });
    }

    return matches;
  }

  static extractKeywords(resume: StructuredResume, job: ExtractedJobDescription): KeywordAnalysis {
    const importantKeywords = Array.from(
      new Set([
        ...job.requiredSkills,
        ...job.preferredSkills,
        job.detectedRole,
        job.experienceLevel || ""
      ])
    ).filter(Boolean);

    const allResumeText = JSON.stringify(resume).toLowerCase();

    const existingKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of importantKeywords) {
      const lowerKw = kw.toLowerCase();

      // Experience level alignment
      if (lowerKw === "mid" || lowerKw === "mid-level") {
        if (/mid|mid-level|\b[2-5]\+?\s*years|\b[2-5]\s*years/i.test(allResumeText) || resume.experience.length >= 2) {
          existingKeywords.push(kw);
          continue;
        }
      } else if (lowerKw === "senior") {
        if (/senior|sr\.|\b[5-9]\+?\s*years|\b1[0-9]\+?\s*years/i.test(allResumeText)) {
          existingKeywords.push(kw);
          continue;
        }
      } else if (lowerKw === "entry") {
        if (/entry|graduate|associate|junior|jr\.|intern/i.test(allResumeText) || resume.experience.length <= 1) {
          existingKeywords.push(kw);
          continue;
        }
      }

      const parenMatch = kw.match(/\(([^)]+)\)/);
      const acronym = parenMatch ? parenMatch[1].toLowerCase() : null;
      const baseName = kw.replace(/\s*\([^)]+\)/g, "").trim().toLowerCase();
      const baseAmpersand = baseName.replace(/\band\b/g, "&");

      const hasExact = allResumeText.includes(lowerKw);
      const hasBase = baseName.length > 3 && allResumeText.includes(baseName);
      const hasAmpersand = allResumeText.includes(baseAmpersand);
      const hasAcronym = acronym ? new RegExp(`\\b${acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(allResumeText) : false;
      const related = this.findRelatedInResume(lowerKw, allResumeText);

      if (hasExact || hasBase || hasAmpersand || hasAcronym || !!related) {
        existingKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    // Multi-industry synonyms dictionary
    const relatedKeywords: { [term: string]: string[] } = {
      // Healthcare
      "Patient Care": ["Bedside Care", "Clinical Support", "Patient Assessment"],
      "Triage": ["Patient Assessment", "Acuity Scoring", "Vital Signs"],
      "EHR": ["EMR", "Epic", "Cerner", "Electronic Charting"],
      "BLS": ["CPR", "Basic Life Support", "ACLS"],
      "HIPAA": ["Patient Privacy", "Medical Compliance", "Confidentiality"],
      // Finance & Accounting
      "GAAP": ["Accounting Standards", "General Ledger", "Financial Controls"],
      "Accounts Payable": ["AP Processing", "Invoice Processing", "Vendor Payments"],
      "QuickBooks": ["Bookkeeping", "General Ledger", "Accounting Software"],
      "Variance Analysis": ["Budget Forecasting", "Financial Modeling", "FP&A"],
      // Marketing
      "SEO": ["Organic Search", "Search Engine Optimization", "Keyword Strategy"],
      "SEM": ["Google Ads", "Paid Search", "PPC Campaigns"],
      "Content Marketing": ["Copywriting", "Editorial Strategy", "Content Creation"],
      "CRM": ["HubSpot", "Salesforce", "Customer Lifecycle"],
      // Tech
      "REST APIs": ["RESTful API", "API Integration", "HTTP Endpoints", "Microservices", "CRUD"],
      "PostgreSQL": ["Relational Database", "SQL Queries", "Database Design", "MySQL", "SQLite", "Supabase"],
      "MongoDB": ["NoSQL", "Document Database", "Supabase", "MySQL", "Database"],
      "Docker": ["Containers", "Containerization", "Kubernetes"],
      "AWS": ["Cloud Infrastructure", "Cloud Hosting", "Supabase", "Deployment"],
      "JavaScript": ["TypeScript", "Frontend Scripting", "Web Development", "React"],
      "TypeScript": ["JavaScript", "Frontend Development", "Type Safety"],
      "Node.js": ["Express.js", "Backend Development", "JavaScript", "REST APIs", "Django"],
      "Express.js": ["Node.js", "REST APIs", "Backend Routing", "Django"],
      "Git": ["GitHub", "Version Control", "GitLab", "Repository"],
      "GitHub": ["Git", "Version Control", "Repository"],
      "software testing": ["Application Testing", "Bug Fixing", "Debugging", "QA Testing", "Validation"],
      "Technical Documentation": ["System Documentation", "Document Tracking", "Requirements Analysis", "Workflow Design"],
      "CI/CD": ["Automated Workflows", "Build Pipelines", "Continuous Deployment", "DevOps"],
      // Occupational Health & Safety
      "HIRA": ["Hazard Identification", "Risk Assessment", "Job Safety Analysis (JSA)"],
      "Permit to Work (PTW)": ["PTW System", "Safe Work Permit", "High-Risk Authorizations"],
      "Tool Box Talks (TBT)": ["Safety Briefings", "Tailgate Talks", "Crew Communication"],
      "PPE Compliance": ["Safety Equipment", "Protective Gear", "Safety Harnesses"],
      "Incident Investigation": ["Root Cause Analysis (RCA)", "Near-Miss Reporting", "CAPA"],
      "NEBOSH IGC": ["Occupational Health & Safety", "IOSH Managing Safely", "Safety Compliance"],
      "Work at Height Safety": ["Fall Protection", "Anchored Lifelines", "Scaffolding Safety"],
      "Confined Space Safety": ["Atmospheric Testing", "Entry Permits", "Rescue Procedures"]
    };

    return {
      importantKeywords,
      existingKeywords,
      missingKeywords,
      relatedKeywords
    };
  }

  private static findRelatedInResume(skill: string, resumeText: string): string | null {
    const multiIndustrySynonyms: { [key: string]: string[] } = {
      // Software & IT
      "software testing": ["application testing", "testing", "bug fixing", "debugging", "qa testing", "test cases", "data validation", "validation", "tested"],
      "testing": ["application testing", "software testing", "bug fixing", "debugging", "validation", "tested"],
      "technical documentation": ["document tracking", "documentation", "user requirement analysis", "technical issue resolution", "case processing", "reporting", "financial documentation", "requirements"],
      "node.js": ["javascript", "express", "backend", "typescript", "python", "django", "rest apis"],
      "express.js": ["node.js", "rest api", "backend", "django", "apis"],
      "postgresql": ["sql", "mysql", "sqlite", "database", "relational database", "supabase"],
      "mongodb": ["database", "nosql", "supabase", "mysql", "sqlite", "relational database"],
      "docker": ["containers", "devops", "kubernetes"],
      "aws": ["cloud", "gcp", "azure", "supabase", "serverless", "deployment"],
      "rest apis": ["api", "endpoints", "json", "graphql", "crud", "restful"],
      "git": ["github", "version control", "gitlab", "repository"],
      "github": ["git", "version control", "gitlab", "repository"],
      "react": ["javascript", "frontend", "html", "css"],
      "ci/cd": ["deployment", "workflows", "automation", "continuous integration", "pipeline"],
      "typescript": ["javascript", "frontend", "web applications"],
      // Occupational Health, Safety & Industrial Operations
      "hira": ["hazard identification", "risk assessment", "job safety analysis", "safety observation"],
      "hazard identification": ["hira", "risk assessment", "jsa", "hazard analysis", "inspections"],
      "risk assessment": ["hira", "hazard identification", "risk matrix", "jsa"],
      "ptw": ["permit to work", "work permit", "hot work", "confined space permit"],
      "permit to work": ["ptw", "work permit", "safe system of work"],
      "tbt": ["tool box talk", "toolbox talk", "safety briefing", "tailgate meeting"],
      "tool box talks": ["tbt", "toolbox talk", "safety briefing", "safety training"],
      "ppe": ["personal protective equipment", "safety harness", "safety gear", "helmets", "respirator"],
      "ppe compliance": ["ppe", "personal protective equipment", "safety violations"],
      "capa": ["corrective and preventive actions", "corrective actions", "root cause", "preventive actions"],
      "jsa": ["job safety analysis", "job hazard analysis", "safe work practices", "hira"],
      "nebosh": ["nebosh igc", "occupational safety", "safety certification", "iosh"],
      "iosh": ["iosh ms", "managing safely", "safety certification", "nebosh"],
      "work at height": ["working at height", "work at heights", "fall protection", "scaffolding", "safety harness", "lifeline"],
      "work at heights": ["work at height", "working at height", "fall protection", "scaffolding", "safety harness"],
      "confined space": ["confined space entry", "confined space safety", "gas testing", "atmospheric testing"],
      "near-miss reporting": ["near-miss", "incident reporting", "safety observation", "incident investigation"],
      "root cause analysis": ["rca", "incident investigation", "corrective actions", "capa"],
      "electrical safety": ["isolation", "grounding", "earthing", "loto", "lockout tagout"],
      // Healthcare
      "patient care": ["vital signs", "triage", "clinical care", "bedside", "nursing", "patient assessment", "charting"],
      "iv therapy": ["infusion", "phlebotomy", "venipuncture", "catheter"],
      "ehr": ["emr", "epic", "cerner", "electronic health record", "meditech"],
      "emr": ["ehr", "epic", "cerner", "electronic health record"],
      "bls": ["cpr", "acls", "basic life support"],
      "acls": ["bls", "cpr", "advanced cardiac life support"],
      "triage": ["patient assessment", "acuity", "vital signs"],
      "hipaa": ["patient privacy", "compliance", "medical confidentiality"],

      // Finance & Accounting
      "gaap": ["accounting principles", "financial reporting", "general ledger", "ifrs"],
      "accounts payable": ["invoicing", "ap", "vendor payments", "disbursements"],
      "accounts receivable": ["collections", "ar", "billing"],
      "quickbooks": ["bookkeeping", "sap", "xero", "accounting software"],
      "variance analysis": ["budgeting", "financial modeling", "forecasting", "fp&a"],
      "financial modeling": ["excel", "forecasting", "cash flow", "dcf"],

      // Marketing & Growth
      "seo": ["organic search", "keyword research", "search engine optimization", "google analytics"],
      "sem": ["google ads", "ppc", "paid search"],
      "content marketing": ["copywriting", "blogging", "content creation", "editorial"],
      "crm": ["hubspot", "salesforce", "customer relationship"],
      "social media marketing": ["social media", "instagram", "linkedin", "content creation"],

      // Operations & Management
      "project management": ["pmp", "agile", "scrum", "workflow", "stakeholder management"],
      "lean six sigma": ["process improvement", "continuous improvement", "kaizen"],
      "supply chain": ["logistics", "procurement", "inventory"]
    };

    const targetSynonyms = multiIndustrySynonyms[skill.toLowerCase()];
    if (targetSynonyms) {
      for (const syn of targetSynonyms) {
        if (resumeText.includes(syn)) return syn;
      }
    }

    // Word-level partial token matching for multi-word phrases
    const words = skill.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (resumeText.includes(w)) {
        return w;
      }
    }

    return null;
  }
}
