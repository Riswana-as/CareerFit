import { describe, it, expect } from "vitest";
import { ResumeParser } from "../src/parsers/resumeParser";
import { JobParser } from "../src/parsers/jobParser";
import { AIService } from "../src/ai/aiService";
import { MatchingEngine } from "../src/services/matchingEngine";

describe("Strict Zero-Fabrication Safety & Matching Engine", () => {
  const sampleResumeText = `
John Doe
Email: john@example.com | Phone: 555-0199
Software Developer

TECHNICAL SKILLS
Java, Python, HTML, CSS, JavaScript, PostgreSQL, Git

WORK EXPERIENCE
Software Developer | Alpha Corp (2022 - 2024)
Worked on web applications.
Worked with databases.
Worked with APIs.

PROJECTS
E-commerce System: Built online catalog with PostgreSQL.
`;

  const jobText = `
Backend Developer
Requirements:
Node.js, Express.js, REST APIs, PostgreSQL, Git, Docker, Kubernetes
`;

  it("MUST NEVER fabricate unearned skills like Docker or Node.js in tailored resume", async () => {
    const resume = ResumeParser.parse(sampleResumeText);
    const job = JobParser.parse(jobText);
    const aiService = new AIService();

    const result = await aiService.tailorResume(resume, job);

    const tailoredSkillsAll = JSON.stringify(result.tailoredResume.skills).toLowerCase();

    // Verify Docker and Kubernetes are NOT in candidate skills
    expect(tailoredSkillsAll).not.toContain("docker");
    expect(tailoredSkillsAll).not.toContain("kubernetes");

    // Verify they are categorized truthfully in unaddedItems
    const unaddedRequirements = result.unaddedItems.map((u) => u.requirement.toLowerCase());
    expect(unaddedRequirements.some((r) => r.includes("docker"))).toBe(true);

    // Verify genuine skills are retained
    expect(tailoredSkillsAll).toContain("postgresql");
    expect(tailoredSkillsAll).toContain("javascript");

    // Verify company name is not changed
    expect(result.tailoredResume.experience[0].company).toBe("Alpha Corp");
  });

  it("should categorize matching skills vs missing skills accurately", () => {
    const resume = ResumeParser.parse(sampleResumeText);
    const job = JobParser.parse(jobText);

    const matches = MatchingEngine.compare(resume, job);
    const keywords = MatchingEngine.extractKeywords(resume, job);

    const postgresMatch = matches.find((m) => m.requirementText.toLowerCase() === "postgresql");
    expect(postgresMatch?.status).toBe("strong");

    const dockerMatch = matches.find((m) => m.requirementText.toLowerCase() === "docker");
    expect(dockerMatch?.status).toBe("missing");

    expect(keywords.existingKeywords.map((k) => k.toLowerCase())).toContain("postgresql");
    expect(keywords.missingKeywords.map((k) => k.toLowerCase())).toContain("docker");
  });
});
