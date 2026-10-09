import {
  StructuredResume,
  ExtractedJobDescription,
  ExperienceItem,
  ProjectItem,
  AISuggestion
} from "../types";
import { v4 as uuidv4 } from "uuid";

export class HeuristicProvider {
  static optimizeSummary(
    originalSummary: string,
    resume: StructuredResume,
    job: ExtractedJobDescription
  ): { summary: string; changes: string } {
    const role = job.detectedRole || "Software Professional";
    const allSkills = [
      ...(resume.skills.languages || []),
      ...(resume.skills.frontend || []),
      ...(resume.skills.backend || []),
      ...(resume.skills.databases || []),
      ...(resume.skills.tools || [])
    ];

    // Find overlapping skills with the target job
    const relevantSkills = allSkills.filter((skill) =>
      job.rawText.toLowerCase().includes(skill.toLowerCase())
    );

    const skillsClause =
      relevantSkills.length > 0
        ? ` specializing in ${relevantSkills.slice(0, 4).join(", ")}`
        : "";

    let tailoredSummary = "";
    if (originalSummary && originalSummary.length > 30) {
      tailoredSummary = `${role}-focused professional with demonstrated experience${skillsClause}. ${originalSummary.replace(
        /^(software developer|engineer|professional)/i,
        ""
      ).trim()}`;
    } else {
      tailoredSummary = `Results-oriented professional targeted toward ${role} roles${skillsClause}, delivering scalable code, modular architecture, and reliable system solutions.`;
    }

    return {
      summary: tailoredSummary.trim(),
      changes: `Targeted summary toward ${role} emphasizing genuine skills (${relevantSkills.slice(0, 3).join(", ") || "core competencies"}).`
    };
  }

  static optimizeExperience(
    experiences: ExperienceItem[],
    job: ExtractedJobDescription
  ): { experiences: ExperienceItem[]; changes: string[] } {
    const changes: string[] = [];

    const actionVerbMap: { [word: string]: string } = {
      worked: "Engineered and delivered",
      handled: "Spearheaded and maintained",
      helped: "Collaborated cross-functionally to build",
      made: "Architected and implemented",
      created: "Developed and deployed",
      used: "Leveraged",
      assisted: "Partnered to implement",
      did: "Executed and verified"
    };

    const optimized = experiences.map((exp) => {
      const optimizedResponsibilities = exp.responsibilities.map((bullet) => {
        let enhanced = bullet.trim();

        // Swap weak beginning verbs with strong engineering action verbs
        for (const [weak, strong] of Object.entries(actionVerbMap)) {
          const regex = new RegExp(`^${weak}\\s+`, "i");
          if (regex.test(enhanced)) {
            enhanced = enhanced.replace(regex, `${strong} `);
            changes.push(`Refined bullet "${bullet.slice(0, 30)}..." with active verb "${strong}"`);
            break;
          }
        }

        // Add ATS context if mentions database or APIs
        if (
          enhanced.toLowerCase().includes("api") &&
          !enhanced.toLowerCase().includes("rest") &&
          job.rawText.toLowerCase().includes("rest api")
        ) {
          enhanced = enhanced.replace(/\bapi(s)?\b/gi, "RESTful API$1");
        }

        return enhanced;
      });

      return {
        ...exp,
        responsibilities: optimizedResponsibilities
      };
    });

    return { experiences: optimized, changes };
  }

  static optimizeProjects(
    projects: ProjectItem[],
    job: ExtractedJobDescription
  ): { projects: ProjectItem[]; changes: string[] } {
    const changes: string[] = [];
    const jobText = job.rawText.toLowerCase();

    const scoredProjects = projects.map((proj) => {
      let score = 50; // base score
      const projText = (proj.title + " " + proj.description + " " + proj.technologies.join(" ")).toLowerCase();

      for (const req of job.requiredSkills) {
        if (projText.includes(req.toLowerCase())) score += 12;
      }
      for (const pref of job.preferredSkills) {
        if (projText.includes(pref.toLowerCase())) score += 8;
      }

      const relevanceScore = Math.min(98, score);
      return { ...proj, relevanceScore };
    });

    // Sort descending by relevance score
    scoredProjects.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    if (scoredProjects.length > 1) {
      changes.push(`Prioritized project "${scoredProjects[0].title}" (${scoredProjects[0].relevanceScore}% match) for target role.`);
    }

    return { projects: scoredProjects, changes };
  }

  static prioritizeSkills(
    skills: StructuredResume["skills"],
    job: ExtractedJobDescription
  ): { skills: StructuredResume["skills"]; changes: string[] } {
    const changes: string[] = [];
    const jobText = job.rawText.toLowerCase();

    const sortFn = (list: string[] = []) => {
      return [...list].sort((a, b) => {
        const aInJob = jobText.includes(a.toLowerCase()) ? 1 : 0;
        const bInJob = jobText.includes(b.toLowerCase()) ? 1 : 0;
        return bInJob - aInJob;
      });
    };

    const reordered: StructuredResume["skills"] = {
      languages: sortFn(skills.languages),
      frontend: sortFn(skills.frontend),
      backend: sortFn(skills.backend),
      databases: sortFn(skills.databases),
      tools: sortFn(skills.tools),
      cloudDevops: sortFn(skills.cloudDevops),
      other: sortFn(skills.other),
      rawList: sortFn(skills.rawList)
    };

    changes.push("Reordered technical skills to surface job-matching technologies first.");
    return { skills: reordered, changes };
  }

  static generateSuggestions(
    resume: StructuredResume,
    job: ExtractedJobDescription,
    missingSkills: string[]
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggestions for missing skills (Never fabricate!)
    for (const missing of missingSkills.slice(0, 3)) {
      suggestions.push({
        id: uuidv4(),
        section: "skills",
        type: "gap_warning",
        content: `Target job requires "${missing}", but no evidence exists in your resume.`,
        reason: "CareerFit AI strictly preserves factual truth and will not falsely add skills.",
        actionableStep: `If you have genuine experience with ${missing}, add a project or coursework in the editor. Otherwise consider completing a tutorial before applying.`
      });
    }

    // Suggestions for experience bullets
    const hasShortBullets = resume.experience.some((e) =>
      e.responsibilities.some((r) => r.split(" ").length < 6)
    );
    if (hasShortBullets) {
      suggestions.push({
        id: uuidv4(),
        section: "experience",
        type: "action_verb",
        content: "Several bullet points in your work experience are concise.",
        reason: "ATS algorithms favor bullet points detailing technical approach and positive outcome.",
        actionableStep: "Include context on the problem solved, tools leveraged, and verified outcome."
      });
    }

    // Suggestions for summary
    suggestions.push({
      id: uuidv4(),
      section: "summary",
      type: "relevance",
      content: `Your summary was customized for the ${job.detectedRole} position.`,
      reason: "Aligning your summary with the employer's role keyword increases recruiter relevance.",
      actionableStep: "Review the tailored summary to ensure it reflects your professional identity."
    });

    return suggestions;
  }
}
