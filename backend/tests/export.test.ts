import { describe, it, expect } from "vitest";
import { ResumeParser } from "../src/parsers/resumeParser";
import { ExportService } from "../src/services/exportService";

describe("ExportService PDF & DOCX Generation", () => {
  const sampleResumeText = `
Jane Developer
Email: jane@example.com | Phone: 555-1234
Summary: Experienced software engineer building scalable web solutions.
Skills: TypeScript, React, Node.js, PostgreSQL, Git
Experience:
Full Stack Developer | CloudTech (2022 - Present)
• Engineered high-performance APIs and frontend components.
Education:
BS in Computer Science | Tech University (2022)
Projects:
Task Manager: Interactive project coordination tool.
`;

  it("should generate a valid PDF buffer with PDF headers", async () => {
    const resume = ResumeParser.parse(sampleResumeText);
    const pdfBuffer = await ExportService.generatePdf(resume, "modern");

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF magic bytes %PDF-
    expect(pdfBuffer.slice(0, 5).toString()).toBe("%PDF-");
  });

  it("should generate a valid Microsoft Word DOCX buffer with PK zip headers", async () => {
    const resume = ResumeParser.parse(sampleResumeText);
    const docxBuffer = await ExportService.generateDocx(resume);

    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(1000);
    // ZIP magic bytes PK\x03\x04
    expect(docxBuffer[0]).toBe(0x50); // 'P'
    expect(docxBuffer[1]).toBe(0x4b); // 'K'
  });
});
