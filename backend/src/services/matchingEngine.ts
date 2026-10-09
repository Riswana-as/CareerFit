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
      resume.summary +
      " " +
      resume.experience.map((e) => e.jobTitle + " " + e.responsibilities.join(" ")).join(" ") +
      " " +
      resume.projects.map((p) => p.title + " " + p.description + " " + p.technologies.join(" ")).join(" ") +
      " " +
      resume.education.map((ed) => ed.degree + " " + ed.institution).join(" ")
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

      // Exact match
      if (allResumeText.includes(lowerReq)) {
        status = "strong";
        matchingText = item.text;
        explanation = `Found exact mention of "${item.text}" in your resume.`;
        confidence = 95;
      } else {
        // Partial/related check
        const related = this.findRelatedInResume(lowerReq, allResumeText);
        if (related) {
          status = "partial";
          matchingText = related;
          explanation = `Found related experience with "${related}", which partially addresses "${item.text}".`;
          confidence = 65;
        } else {
          status = "missing";
          explanation = `No evidence found in your resume for "${item.text}".`;
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
    for (const resp of job.responsibilities.slice(0, 4)) {
      const respLower = resp.toLowerCase();
      const words = respLower.split(/\s+/).filter((w) => w.length > 4);
      const matchedWords = words.filter((w) => allResumeText.includes(w));
      const matchRatio = words.length > 0 ? matchedWords.length / words.length : 0;

      let status: MatchStatus = "missing";
      if (matchRatio >= 0.5) status = "strong";
      else if (matchRatio >= 0.25) status = "partial";

      matches.push({
        requirementId: uuidv4(),
        requirementText: resp,
        category: "responsibility",
        status,
        matchingText: matchedWords.join(", "),
        explanation:
          status === "strong"
            ? "Your experience demonstrates strong alignment with this duty."
            : status === "partial"
            ? "Partial alignment found through related technical activities."
            : "No direct experience identified for this responsibility.",
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
      if (allResumeText.includes(kw.toLowerCase())) {
        existingKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    const relatedKeywords: { [term: string]: string[] } = {
      "REST APIs": ["RESTful API", "API Integration", "HTTP Services"],
      PostgreSQL: ["Relational Database", "SQL", "Database Design"],
      Docker: ["Containers", "Containerization"],
      AWS: ["Cloud Infrastructure", "Cloud Hosting"],
      JavaScript: ["JS", "ECMAScript", "Frontend Scripting"]
    };

    return {
      importantKeywords,
      existingKeywords,
      missingKeywords,
      relatedKeywords
    };
  }

  private static findRelatedInResume(skill: string, resumeText: string): string | null {
    const synonyms: { [key: string]: string[] } = {
      "node.js": ["javascript", "express", "backend"],
      "express.js": ["node.js", "rest api"],
      postgresql: ["sql", "mysql", "database"],
      docker: ["containers", "devops"],
      aws: ["cloud", "gcp", "azure"],
      "rest apis": ["api", "endpoints", "json", "graphql"],
      git: ["github", "version control", "gitlab"],
      react: ["javascript", "frontend", "html", "css"]
    };

    const targetSynonyms = synonyms[skill.toLowerCase()];
    if (targetSynonyms) {
      for (const syn of targetSynonyms) {
        if (resumeText.includes(syn)) return syn;
      }
    }
    return null;
  }
}
