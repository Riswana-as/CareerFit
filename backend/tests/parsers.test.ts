import { describe, it, expect } from "vitest";
import { ResumeParser } from "../src/parsers/resumeParser";
import { JobParser } from "../src/parsers/jobParser";

describe("ResumeParser & JobParser Unit Tests", () => {
  const sampleResumeText = `
Riswana Shaik
Email: riswana@example.com
Phone: (555) 234-5678
Location: San Francisco, CA
LinkedIn: linkedin.com/in/riswana-shaik
GitHub: github.com/riswana

PROFESSIONAL SUMMARY
Software developer with experience in web development, database systems, and REST APIs.

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, HTML, CSS
Databases: PostgreSQL, MySQL
Tools: Git, GitHub

WORK EXPERIENCE
Software Developer | ABC Technologies
2022 - Present
Worked on web applications.
Worked with databases.
Worked with APIs.

EDUCATION
Bachelor of Science in Computer Science
State University, 2022

PROJECTS
Student Management System
Built a full-stack student portal with PostgreSQL database.
E-commerce Website
Developed online store with payment checkout.
`;

  it("should extract contact info, summary, skills, experience, and projects cleanly", () => {
    const parsed = ResumeParser.parse(sampleResumeText);

    expect(parsed.personal.name).toBe("Riswana Shaik");
    expect(parsed.personal.email).toBe("riswana@example.com");
    expect(parsed.personal.phone).toContain("555");
    expect(parsed.summary).toContain("Software developer");
    expect(parsed.skills.rawList).toContain("JavaScript");
    expect(parsed.skills.rawList).toContain("PostgreSQL");
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.experience[0].company).toBe("ABC Technologies");
    expect(parsed.projects.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
  });

  it("should detect Backend Developer role from job description with high confidence", () => {
    const jobText = `
Backend Developer
Looking for an experienced developer to build scalable REST APIs using Node.js and Express.
Requirements:
Node.js, Express.js, REST APIs, PostgreSQL, Git, Docker
Preferred:
AWS, Redis, Microservices
`;

    const job = JobParser.parse(jobText);
    expect(job.detectedRole).toBe("Backend Developer");
    expect(job.roleConfidence).toBeGreaterThanOrEqual(80);
    expect(job.requiredSkills).toContain("PostgreSQL");
    expect(job.requiredSkills).toContain("Git");
  });
});
