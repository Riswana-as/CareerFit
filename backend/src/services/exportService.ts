import PDFDocument from "pdfkit";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { StructuredResume } from "../types";

export class ExportService {
  /**
   * Generates a clean, ATS-compliant PDF document buffer
   */
  static async generatePdf(resume: StructuredResume, templateSlug: string = "modern"): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 45, right: 45 }
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const isClassic = templateSlug === "classic";
      const isTech = templateSlug === "technical";
      const primaryColor = isClassic ? "#111827" : isTech ? "#0f766e" : "#0257a0";

      // 1. Header: Name & Contact
      doc
        .font(isTech ? "Courier-Bold" : "Helvetica-Bold")
        .fontSize(20)
        .fillColor(primaryColor)
        .text(resume.personal.name.toUpperCase(), { align: isClassic ? "center" : "left" });

      if (resume.headline) {
        doc
          .font(isTech ? "Courier" : "Helvetica-Oblique")
          .fontSize(11)
          .fillColor("#475569")
          .text(resume.headline, { align: isClassic ? "center" : "left" });
      }

      const contacts = [
        resume.personal.email,
        resume.personal.phone,
        resume.personal.location,
        resume.personal.linkedin,
        resume.personal.github
      ].filter(Boolean);

      doc
        .font(isTech ? "Courier" : "Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text(contacts.join("  |  "), { align: isClassic ? "center" : "left" });

      doc.moveDown(0.7);

      const renderSectionHeader = (title: string) => {
        doc.moveDown(0.5);
        doc
          .font(isTech ? "Courier-Bold" : "Helvetica-Bold")
          .fontSize(11)
          .fillColor(primaryColor)
          .text(title.toUpperCase());

        // Underline divider
        const y = doc.y + 2;
        doc
          .strokeColor("#cbd5e1")
          .lineWidth(0.75)
          .moveTo(45, y)
          .lineTo(567, y)
          .stroke();

        doc.moveDown(0.3);
      };

      // Order of sections
      const sections = resume.sectionOrder || ["summary", "skills", "experience", "projects", "education", "certifications"];

      for (const section of sections) {
        if (section === "summary" && resume.summary) {
          renderSectionHeader("Professional Summary");
          doc
            .font(isTech ? "Courier" : "Helvetica")
            .fontSize(9.5)
            .fillColor("#1e293b")
            .text(resume.summary, { lineGap: 2 });
        } else if (section === "skills") {
          renderSectionHeader("Technical Skills");
          const skillLines: string[] = [];
          if (resume.skills.languages?.length) skillLines.push(`Languages: ${resume.skills.languages.join(", ")}`);
          if (resume.skills.frontend?.length) skillLines.push(`Frontend: ${resume.skills.frontend.join(", ")}`);
          if (resume.skills.backend?.length) skillLines.push(`Backend: ${resume.skills.backend.join(", ")}`);
          if (resume.skills.databases?.length) skillLines.push(`Databases: ${resume.skills.databases.join(", ")}`);
          if (resume.skills.tools?.length) skillLines.push(`Tools & Platforms: ${resume.skills.tools.join(", ")}`);
          if (resume.skills.rawList?.length && skillLines.length === 0) {
            skillLines.push(`Skills: ${resume.skills.rawList.join(", ")}`);
          }

          for (const line of skillLines) {
            doc
              .font(isTech ? "Courier" : "Helvetica")
              .fontSize(9)
              .fillColor("#1e293b")
              .text(line, { lineGap: 1.5 });
          }
        } else if (section === "experience" && resume.experience.length > 0) {
          renderSectionHeader("Work Experience");
          for (const exp of resume.experience) {
            doc
              .font(isTech ? "Courier-Bold" : "Helvetica-Bold")
              .fontSize(10)
              .fillColor("#0f172a")
              .text(exp.jobTitle, { continued: true })
              .font(isTech ? "Courier" : "Helvetica")
              .fillColor("#475569")
              .text(`  |  ${exp.company}`, { continued: true })
              .fillColor("#64748b")
              .text(` (${exp.startDate} - ${exp.endDate})`, { align: "right" });

            for (const resp of exp.responsibilities) {
              doc
                .font(isTech ? "Courier" : "Helvetica")
                .fontSize(9)
                .fillColor("#334155")
                .text(`•  ${resp}`, { indent: 10, lineGap: 1.5 });
            }
            doc.moveDown(0.3);
          }
        } else if (section === "projects" && resume.projects.length > 0) {
          renderSectionHeader("Key Projects");
          for (const proj of resume.projects) {
            doc
              .font(isTech ? "Courier-Bold" : "Helvetica-Bold")
              .fontSize(9.5)
              .fillColor("#0f172a")
              .text(proj.title, { continued: true })
              .font(isTech ? "Courier" : "Helvetica")
              .fillColor("#475569")
              .text(proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : "");

            if (proj.description) {
              doc
                .font(isTech ? "Courier" : "Helvetica")
                .fontSize(9)
                .fillColor("#334155")
                .text(proj.description, { indent: 10, lineGap: 1 });
            }
            for (const h of proj.highlights || []) {
              doc
                .font(isTech ? "Courier" : "Helvetica")
                .fontSize(9)
                .fillColor("#334155")
                .text(`•  ${h}`, { indent: 15, lineGap: 1 });
            }
            doc.moveDown(0.2);
          }
        } else if (section === "education" && resume.education.length > 0) {
          renderSectionHeader("Education");
          for (const edu of resume.education) {
            doc
              .font(isTech ? "Courier-Bold" : "Helvetica-Bold")
              .fontSize(9.5)
              .fillColor("#0f172a")
              .text(edu.degree, { continued: true })
              .font(isTech ? "Courier" : "Helvetica")
              .fillColor("#475569")
              .text(`  |  ${edu.institution}`, { continued: true })
              .fillColor("#64748b")
              .text(` (${edu.endDate || "Completed"})`, { align: "right" });
          }
        }
      }

      doc.end();
    });
  }

  /**
   * Generates a fully formatted, ATS-compliant Microsoft Word (.docx) document
   */
  static async generateDocx(resume: StructuredResume): Promise<Buffer> {
    const docChildren: any[] = [];

    // Title / Name
    docChildren.push(
      new Paragraph({
        text: resume.personal.name.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
      })
    );

    // Contact details
    const contacts = [
      resume.personal.email,
      resume.personal.phone,
      resume.personal.location,
      resume.personal.linkedin,
      resume.personal.github
    ].filter(Boolean);

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contacts.join("  |  "),
            size: 20 // 10pt
          })
        ]
      })
    );

    const addSectionHeader = (title: string) => {
      docChildren.push(
        new Paragraph({
          text: title.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 }
        })
      );
    };

    // Summary
    if (resume.summary) {
      addSectionHeader("Professional Summary");
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: resume.summary, size: 21 })]
        })
      );
    }

    // Skills
    addSectionHeader("Technical Skills");
    const skillList = [
      ...(resume.skills.languages?.length ? [`Languages: ${resume.skills.languages.join(", ")}`] : []),
      ...(resume.skills.frontend?.length ? [`Frontend: ${resume.skills.frontend.join(", ")}`] : []),
      ...(resume.skills.backend?.length ? [`Backend: ${resume.skills.backend.join(", ")}`] : []),
      ...(resume.skills.databases?.length ? [`Databases: ${resume.skills.databases.join(", ")}`] : []),
      ...(resume.skills.tools?.length ? [`Tools: ${resume.skills.tools.join(", ")}`] : []),
      ...(resume.skills.rawList?.length ? [`Other Skills: ${resume.skills.rawList.join(", ")}`] : [])
    ];
    for (const line of skillList) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 20 })]
        })
      );
    }

    // Experience
    if (resume.experience.length > 0) {
      addSectionHeader("Work Experience");
      for (const exp of resume.experience) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${exp.jobTitle} - ${exp.company}`, bold: true, size: 21 }),
              new TextRun({ text: `   (${exp.startDate} - ${exp.endDate})`, italics: true, size: 19 })
            ],
            spacing: { before: 120, after: 60 }
          })
        );
        for (const resp of exp.responsibilities) {
          docChildren.push(
            new Paragraph({
              text: resp,
              bullet: { level: 0 }
            })
          );
        }
      }
    }

    // Projects
    if (resume.projects.length > 0) {
      addSectionHeader("Key Projects");
      for (const proj of resume.projects) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.title, bold: true, size: 21 }),
              new TextRun({
                text: proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : "",
                italics: true,
                size: 19
              })
            ]
          })
        );
        if (proj.description) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: proj.description, size: 20 })]
            })
          );
        }
        for (const h of proj.highlights || []) {
          docChildren.push(
            new Paragraph({
              text: h,
              bullet: { level: 0 }
            })
          );
        }
      }
    }

    // Education
    if (resume.education.length > 0) {
      addSectionHeader("Education");
      for (const edu of resume.education) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree} - ${edu.institution}`, bold: true, size: 20 }),
              new TextRun({ text: ` (${edu.endDate || "Completed"})`, italics: true, size: 19 })
            ]
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren
        }
      ]
    });

    const { Packer } = await import("docx");
    return await Packer.toBuffer(doc);
  }
}
