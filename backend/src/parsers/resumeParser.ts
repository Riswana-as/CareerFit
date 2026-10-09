import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { StructuredResume, ExperienceItem, EducationItem, ProjectItem, CertificationItem } from "../types";

export class ResumeParser {
  static async extractRawText(filePath: string, mimeType?: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);

    if (filePath.endsWith(".pdf") || mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    if (
      filePath.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    }

    // Default to plain text
    return buffer.toString("utf-8");
  }

  static parse(rawText: string): StructuredResume {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const personal = this.extractContactInfo(lines, rawText);
    const sections = this.segmentSections(lines);

    const summary = this.extractSummary(sections.summary || []);
    const skills = this.extractSkills(sections.skills || []);
    const experience = this.extractExperience(sections.experience || []);
    const education = this.extractEducation(sections.education || []);
    const projects = this.extractProjects(sections.projects || []);
    const certifications = this.extractCertifications(sections.certifications || []);
    const achievements = this.extractListItems(sections.achievements || []);
    const languages = this.extractListItems(sections.languages || []);

    const sectionOrder = [
      "summary",
      "skills",
      experience.length > 0 ? "experience" : "projects",
      experience.length > 0 ? "projects" : "experience",
      "education",
      "certifications"
    ];

    return {
      personal,
      headline: this.extractHeadline(lines, personal.name),
      summary,
      skills,
      experience,
      education,
      projects,
      certifications,
      achievements,
      languages,
      sectionOrder
    };
  }

  private static extractContactInfo(lines: string[], rawText: string) {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/)([a-zA-Z0-9_-]+)/i;
    const githubRegex = /(?:github\.com\/)([a-zA-Z0-9_-]+)/i;
    const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?)/i;

    const emailMatch = rawText.match(emailRegex);
    const phoneMatch = rawText.match(phoneRegex);
    const linkedinMatch = rawText.match(linkedinRegex);
    const githubMatch = rawText.match(githubRegex);

    // First non-empty line without emails/symbols is often candidate name
    let name = "Candidate";
    for (const line of lines.slice(0, 5)) {
      if (!line.includes("@") && !line.match(phoneRegex) && line.length < 50 && !line.toLowerCase().includes("resume")) {
        name = line.replace(/[^a-zA-Z\s.-]/g, "").trim();
        if (name.length > 2) break;
      }
    }

    // Location detection (city, state or country)
    let location = "";
    for (const line of lines.slice(0, 8)) {
      const locMatch = line.match(/([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*,\s*[A-Z]{2,})/);
      if (locMatch) {
        location = locMatch[0];
        break;
      }
    }

    return {
      name: name || "Candidate",
      email: emailMatch ? emailMatch[1] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: location || undefined,
      linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined,
      github: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
      portfolio: undefined
    };
  }

  private static extractHeadline(lines: string[], name: string): string {
    for (const line of lines.slice(0, 6)) {
      if (line !== name && !line.includes("@") && line.length < 80) {
        const lower = line.toLowerCase();
        if (
          lower.includes("engineer") ||
          lower.includes("developer") ||
          lower.includes("architect") ||
          lower.includes("analyst") ||
          lower.includes("manager") ||
          lower.includes("specialist")
        ) {
          return line;
        }
      }
    }
    return "Software Professional";
  }

  private static segmentSections(lines: string[]) {
    const sectionHeaders: { [key: string]: RegExp } = {
      summary: /^(professional\s+summary|summary|profile|about\s+me|objective)/i,
      skills: /^(technical\s+skills|skills|core\s+competencies|technologies|tools\s+&\s+technologies)/i,
      experience: /^(work\s+experience|professional\s+experience|experience|employment\s+history)/i,
      education: /^(education|academic\s+background|qualifications)/i,
      projects: /^(projects|personal\s+projects|key\s+projects|academic\s+projects)/i,
      certifications: /^(certifications|licenses\s+&\s+certifications|certificates)/i,
      achievements: /^(achievements|honors\s+&\s+awards|awards)/i,
      languages: /^(languages|spoken\s+languages)/i
    };

    const sections: { [key: string]: string[] } = {};
    let currentSection = "header";

    for (const line of lines) {
      let matched = false;
      for (const [sec, regex] of Object.entries(sectionHeaders)) {
        if (regex.test(line) && line.length < 40) {
          currentSection = sec;
          if (!sections[currentSection]) sections[currentSection] = [];
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (!sections[currentSection]) sections[currentSection] = [];
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  private static extractSummary(lines: string[]): string {
    return lines.join(" ").trim();
  }

  private static extractSkills(lines: string[]) {
    const rawSkills: string[] = [];
    for (const line of lines) {
      // Split by commas, bullets, pipes, or semicolons
      const parts = line
        .replace(/^[•\-\*]\s*/, "")
        .replace(/^.*?:/, "") // Remove category prefixes like "Languages:"
        .split(/[,|;•\n\t]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 40);
      rawSkills.push(...parts);
    }

    const uniqueSkills = Array.from(new Set(rawSkills));

    // Categorization
    const frontendTerms = ["react", "vue", "angular", "html", "css", "tailwind", "typescript", "javascript", "next.js", "redux", "sass"];
    const backendTerms = ["node.js", "express", "python", "django", "fastapi", "java", "spring", "c#", ".net", "go", "ruby", "rails", "rest api", "graphql"];
    const dbTerms = ["postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "sql server", "dynamodb", "cassandra"];
    const toolTerms = ["git", "github", "docker", "kubernetes", "aws", "gcp", "azure", "linux", "jira", "ci/cd", "postman"];

    const categorized: StructuredResume["skills"] = {
      languages: [],
      frontend: [],
      backend: [],
      databases: [],
      tools: [],
      other: [],
      rawList: uniqueSkills
    };

    for (const skill of uniqueSkills) {
      const lower = skill.toLowerCase();
      if (frontendTerms.some((t) => lower.includes(t))) {
        categorized.frontend?.push(skill);
      } else if (backendTerms.some((t) => lower.includes(t))) {
        categorized.backend?.push(skill);
      } else if (dbTerms.some((t) => lower.includes(t))) {
        categorized.databases?.push(skill);
      } else if (toolTerms.some((t) => lower.includes(t))) {
        categorized.tools?.push(skill);
      } else {
        categorized.other?.push(skill);
      }
    }

    return categorized;
  }

  private static extractExperience(lines: string[]): ExperienceItem[] {
    const experiences: ExperienceItem[] = [];
    let currentExp: ExperienceItem | null = null;

    const datePattern = /\(?\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Present|Current)\s*\)?/i;

    for (const line of lines) {
      const hasDate = datePattern.test(line);

      // New role heading if has date or looks like "Title at Company"
      if (hasDate || line.includes(" - ") || line.includes(" | ")) {
        if (currentExp && (currentExp.responsibilities.length > 0 || currentExp.company)) {
          experiences.push(currentExp);
        }

        const dateMatch = line.match(datePattern);
        const dateStr = dateMatch ? dateMatch[0] : "Recent";
        const isCurrent = /present|current/i.test(dateStr);
        const withoutDate = line.replace(datePattern, "").trim();

        const parts = withoutDate.split(/\s*[-–—|]\s*|\s+\bat\b\s*|\s*,\s*/i).map((p) => p.trim()).filter(Boolean);
        const jobTitle = (parts[0] || "Software Engineer").replace(/[\(\)]/g, "").trim();
        const company = (parts[1] || "Company").replace(/[\(\)]/g, "").trim();

        currentExp = {
          jobTitle,
          company,
          startDate: dateStr.split(/[-–—to]+/)[0]?.trim() || "2023",
          endDate: dateStr.split(/[-–—to]+/)[1]?.trim() || (isCurrent ? "Present" : "2024"),
          isCurrent,
          responsibilities: [],
          achievements: []
        };
      } else if (currentExp) {
        const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
        if (cleanLine.length > 5) {
          if (cleanLine.match(/increased|reduced|boosted|achieved|awarded|optimized by/i)) {
            currentExp.achievements = currentExp.achievements || [];
            currentExp.achievements.push(cleanLine);
          } else {
            currentExp.responsibilities.push(cleanLine);
          }
        }
      }
    }

    if (currentExp && (currentExp.responsibilities.length > 0 || currentExp.company)) {
      experiences.push(currentExp);
    }

    return experiences;
  }

  private static extractEducation(lines: string[]): EducationItem[] {
    const educations: EducationItem[] = [];
    const degreeKeywords = /bachelor|master|phd|b\.s|m\.s|b\.e|b\.tech|diploma|associate/i;
    const datePattern = /\b\d{4}\b/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (degreeKeywords.test(line)) {
        const dateMatch = line.match(datePattern) || lines[i + 1]?.match(datePattern);
        const schoolLine = lines[i - 1] || lines[i + 1] || "University";

        educations.push({
          degree: line.replace(/^[•\-\*]\s*/, "").trim(),
          institution: schoolLine.replace(/^[•\-\*]\s*/, "").trim(),
          endDate: dateMatch ? dateMatch[0] : "Graduated"
        });
      }
    }

    if (educations.length === 0 && lines.length > 0) {
      educations.push({
        institution: lines[0] || "University",
        degree: lines[1] || "Degree in Computer Science",
        endDate: "Recent"
      });
    }

    return educations;
  }

  private static extractProjects(lines: string[]): ProjectItem[] {
    const projects: ProjectItem[] = [];
    let currentProj: ProjectItem | null = null;

    for (const line of lines) {
      const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
      if (!cleanLine) continue;

      if (cleanLine.length < 60 && !cleanLine.endsWith(".") && (cleanLine.includes(" - ") || cleanLine.includes(":") || !currentProj)) {
        if (currentProj) projects.push(currentProj);

        const parts = cleanLine.split(/[:\-–—]/).map((p) => p.trim());
        currentProj = {
          title: parts[0] || "Featured Project",
          description: parts[1] || "",
          technologies: [],
          highlights: []
        };
      } else if (currentProj) {
        if (cleanLine.toLowerCase().startsWith("tech:") || cleanLine.toLowerCase().startsWith("technologies:")) {
          currentProj.technologies = cleanLine.replace(/^[^:]+:\s*/, "").split(/[,|]/).map((t) => t.trim());
        } else {
          currentProj.highlights = currentProj.highlights || [];
          currentProj.highlights.push(cleanLine);
          if (!currentProj.description) currentProj.description = cleanLine;
        }
      }
    }

    if (currentProj) projects.push(currentProj);
    return projects;
  }

  private static extractCertifications(lines: string[]): CertificationItem[] {
    return lines
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 4)
      .map((name) => ({
        name,
        issuingOrganization: "Professional Certification"
      }));
  }

  private static extractListItems(lines: string[]): string[] {
    return lines
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 1);
  }
}


