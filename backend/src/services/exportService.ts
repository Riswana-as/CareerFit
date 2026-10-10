import PDFDocument from "pdfkit";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { StructuredResume } from "../types";

export class ExportService {
  /**
   * Helper to merge wrapped bullet points, strip standalone location bullets,
   * and ensure clean sentence endings for professional ATS alignment.
   */
  static cleanBulletList(bullets: string[]): string[] {
    if (!bullets || bullets.length === 0) return [];
    const locationRegex = /^(chennai|mavelikkara|thiruvalla|ernakulam|kochi|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|india|kerala|tamil\s+nadu|remote|hybrid|onsite)$/i;

    const merged: string[] = [];
    for (let i = 0; i < bullets.length; i++) {
      let b = bullets[i].trim().replace(/^[•\-\*]\s*/, "");
      if (!b) continue;

      if (locationRegex.test(b)) {
        continue;
      }

      const isContinuation =
        merged.length > 0 &&
        (
          /^[a-z]/.test(b) ||
          (!/[.!?]$/.test(merged[merged.length - 1]) &&
           !/^(conduct|monitor|review|coordinate|support|manage|lead|develop|maintain|execute|inspect|ensure|perform|direct|spearhead|prepare|recommend|achieve|drive|assisted|implemented|administered|recorded)\b/i.test(b))
        );

      if (isContinuation) {
        merged[merged.length - 1] = `${merged[merged.length - 1].replace(/\s+$/, "")} ${b}`;
      } else {
        merged.push(b);
      }
    }

    return merged.map((b) => (b.endsWith(".") || b.endsWith("!") || b.endsWith("?") ? b : `${b}.`));
  }

  /**
   * Generates a clean, ATS-compliant PDF document buffer
   */
  static async generatePdf(resume: StructuredResume, templateSlug: string = "executive_classic"): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isExecClassic = templateSlug === "executive_classic";
      const isClassic = templateSlug === "classic";
      const isTech = templateSlug === "technical";
      const isGraduate = templateSlug === "fresh_graduate";

      const leftMargin = 45;
      const rightMargin = 45;
      const topMargin = 40;
      const bottomMargin = 40;
      const pageWidth = 612; // Letter
      const pageHeight = 792;
      const contentWidth = pageWidth - leftMargin - rightMargin; // 522
      const contentRight = leftMargin + contentWidth; // 567

      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: topMargin, bottom: bottomMargin, left: leftMargin, right: rightMargin },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = isExecClassic
        ? "#000000"
        : isClassic
        ? "#111827"
        : isTech
        ? "#0f766e"
        : isGraduate
        ? "#3730a3"
        : "#0257a0";

      const fontBold = isExecClassic
        ? "Times-Bold"
        : isTech
        ? "Courier-Bold"
        : isGraduate
        ? "Times-Bold"
        : "Helvetica-Bold";

      const fontRegular = isExecClassic
        ? "Times-Roman"
        : isTech
        ? "Courier"
        : isGraduate
        ? "Times-Roman"
        : "Helvetica";

      const fontItalic = isExecClassic
        ? "Times-Italic"
        : isTech
        ? "Courier-Oblique"
        : isGraduate
        ? "Times-Italic"
        : "Helvetica-Oblique";

      // Helper for intelligent page break prevention
      const checkPageBreak = (neededHeight: number = 55) => {
        if (doc.y + neededHeight > pageHeight - bottomMargin - 15) {
          doc.addPage();
        }
      };

      // Helper to clean messy or false-positive locations
      const cleanLocation = (loc?: string) => {
        if (!loc) return "";
        let cleaned = loc.trim().replace(/,\s*(and|or|etc\.?)$/i, "");
        if (/^(and|industrial|operations|engineering|maintenance|safety|systems|experience)\b/i.test(cleaned)) {
          return "";
        }
        return cleaned;
      };

      // 1. Header: Name & Contact
      doc
        .font(fontBold)
        .fontSize(isExecClassic ? 21 : 20)
        .fillColor(primaryColor)
        .text((resume.personal.name || "Candidate").toUpperCase(), {
          align: isExecClassic || isClassic ? "center" : "left",
          characterSpacing: isExecClassic ? 1 : 0
        });

      if (resume.headline) {
        doc.moveDown(0.2);
        doc
          .font(fontBold)
          .fontSize(10.5)
          .fillColor(isExecClassic ? "#1e293b" : "#475569")
          .text(resume.headline.toUpperCase(), {
            align: isExecClassic || isClassic ? "center" : "left",
            characterSpacing: isExecClassic ? 1.5 : 0.5
          });
      }

      const validLocation = cleanLocation(resume.personal.location);
      const contacts = [
        resume.personal.email,
        resume.personal.phone,
        validLocation,
        resume.personal.linkedin ? resume.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/") : null,
        resume.personal.github ? resume.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/") : null
      ].filter(Boolean);

      doc.moveDown(0.25);
      doc
        .font(fontRegular)
        .fontSize(9.5)
        .fillColor(isExecClassic ? "#111827" : "#334155")
        .text(contacts.join("  |  "), { align: isExecClassic || isClassic ? "center" : "left" });

      doc.moveDown(0.35);

      const renderSectionHeader = (title: string) => {
        checkPageBreak(50);
        doc.moveDown(0.45);
        doc
          .font(fontBold)
          .fontSize(10.5)
          .fillColor(primaryColor)
          .text(title.toUpperCase(), leftMargin, doc.y, { characterSpacing: 0.5 });

        // Underline divider with proper spacing
        const lineY = doc.y + 2;
        doc
          .strokeColor(isExecClassic ? "#000000" : "#94a3b8")
          .lineWidth(isExecClassic ? 1 : 0.75)
          .moveTo(leftMargin, lineY)
          .lineTo(contentRight, lineY)
          .stroke();

        doc.y = lineY + 5;
      };

      // Order of sections
      const sections = resume.sectionOrder || ["summary", "skills", "experience", "projects", "education", "certifications"];
      const finalSections = [...sections];
      if (isExecClassic && resume.certifications && resume.certifications.length > 0 && !finalSections.includes("certifications")) {
        finalSections.push("certifications");
      }

      for (const section of finalSections) {
        if (section === "summary" && resume.summary) {
          renderSectionHeader("Professional Summary");
          doc
            .font(fontRegular)
            .fontSize(9.5)
            .fillColor(isExecClassic ? "#000000" : "#1e293b")
            .text(resume.summary, leftMargin, doc.y, {
              width: contentWidth,
              lineGap: 2.8,
              align: isExecClassic ? "justify" : "left"
            });
          doc.moveDown(0.25);
        } else if (section === "skills") {
          if (isExecClassic) {
            renderSectionHeader("Skills");
            let col1Title = "Technical Skills";
            let col1Skills: string[] = [];
            let col2Title = "Core Safety Skills";
            let col2Skills: string[] = [];

            if (resume.skills.categories && resume.skills.categories.length >= 2) {
              col1Title = resume.skills.categories[0].title;
              col1Skills = resume.skills.categories[0].skills;
              col2Title = resume.skills.categories[1].title;
              col2Skills = resume.skills.categories[1].skills;
            } else {
              const allSkills = [
                ...(resume.skills.coreSkills || []),
                ...(resume.skills.specialized || []),
                ...(resume.skills.tools || []),
                ...(resume.skills.databases || []),
                ...(resume.skills.languages || []),
                ...(resume.skills.rawList || []),
                ...((resume.skills.categories || []).flatMap((c) => c.skills || []))
              ];
              const unique = Array.from(new Set(allSkills));
              const mid = Math.ceil(unique.length / 2);
              col1Skills = unique.slice(0, mid);
              col2Skills = unique.slice(mid);
              col1Title = "Technical Skills";
              col2Title = "Core Competencies";
            }

            const colWidth = 248;
            const col2Left = leftMargin + colWidth + 26; // 45 + 248 + 26 = 319
            const startY = doc.y;

            // Col 1
            doc.font(fontBold).fontSize(9.5).fillColor(primaryColor).text(col1Title.toUpperCase(), leftMargin, startY, { width: colWidth });
            doc.moveDown(0.2);
            for (const s of col1Skills) {
              doc.font(fontRegular).fontSize(9).fillColor("#111827").text(`•  ${s}`, leftMargin, doc.y, { width: colWidth, lineGap: 1.8 });
            }
            const col1EndY = doc.y;

            // Col 2
            doc.y = startY;
            doc.font(fontBold).fontSize(9.5).fillColor(primaryColor).text(col2Title.toUpperCase(), col2Left, startY, { width: colWidth });
            doc.moveDown(0.2);
            for (const s of col2Skills) {
              doc.font(fontRegular).fontSize(9).fillColor("#111827").text(`•  ${s}`, col2Left, doc.y, { width: colWidth, lineGap: 1.8 });
            }
            const col2EndY = doc.y;

            doc.y = Math.max(col1EndY, col2EndY) + 5;
            doc.x = leftMargin;
          } else {
            const isPureTech =
              (resume.skills.languages?.length || 0) +
              (resume.skills.frontend?.length || 0) +
              (resume.skills.backend?.length || 0) > 0;

            renderSectionHeader(isPureTech ? "Technical Skills" : "Core Competencies & Skills");

            const skillLines: { title: string; items: string }[] = [];

            if (resume.skills.categories && resume.skills.categories.length > 0) {
              for (const cat of resume.skills.categories) {
                if (cat.skills.length > 0) {
                  skillLines.push({ title: cat.title, items: cat.skills.join(", ") });
                }
              }
            }

            if (skillLines.length === 0) {
              if (resume.skills.languages?.length) skillLines.push({ title: "Languages", items: resume.skills.languages.join(", ") });
              if (resume.skills.frontend?.length) skillLines.push({ title: "Frontend", items: resume.skills.frontend.join(", ") });
              if (resume.skills.backend?.length) skillLines.push({ title: "Backend", items: resume.skills.backend.join(", ") });
              if (resume.skills.databases?.length) skillLines.push({ title: "Databases", items: resume.skills.databases.join(", ") });
              if (resume.skills.tools?.length) skillLines.push({ title: "Tools & Systems", items: resume.skills.tools.join(", ") });
              if (resume.skills.specialized?.length) skillLines.push({ title: "Specialized Skills", items: resume.skills.specialized.join(", ") });
              if (resume.skills.coreSkills?.length) skillLines.push({ title: "Core Competencies", items: resume.skills.coreSkills.join(", ") });
              if (resume.skills.rawList?.length && skillLines.length === 0) {
                skillLines.push({ title: "Skills", items: resume.skills.rawList.join(", ") });
              }
            }

            for (const row of skillLines) {
              doc
                .font(fontBold)
                .fontSize(9.5)
                .fillColor(primaryColor)
                .text(`${row.title}: `, leftMargin, doc.y, { continued: true })
                .font(fontRegular)
                .fillColor("#1e293b")
                .text(row.items, { lineGap: 2.2, width: contentWidth });
              doc.moveDown(0.1);
            }
          }
        } else if (section === "experience" && resume.experience.length > 0) {
          renderSectionHeader("Professional Experience");
          const titleKeywords = /\b(officer|engineer|developer|specialist|manager|coordinator|analyst|director|lead|apprentice|technician|supervisor|consultant|associate|assistant|intern|executive)\b/i;
          const companyKeywords = /\b(pvt|ltd|limited|inc|corp|technologies|engineering|systems|corporation|solutions|services|group|company|hospital|clinic)\b/i;

          for (const exp of resume.experience) {
            checkPageBreak(85); // Prevent orphaned job headers + initial bullets
            const y = doc.y;
            const dateText = `${exp.startDate} – ${exp.endDate}`;

            let displayTitle = exp.jobTitle;
            let displayCompany = exp.company;

            if (companyKeywords.test(displayTitle) || (titleKeywords.test(displayCompany) && !titleKeywords.test(displayTitle))) {
              displayTitle = exp.company;
              displayCompany = exp.jobTitle;
            }

            const headerText = isExecClassic
              ? `${displayCompany} | ${displayTitle}`
              : `${displayTitle}  |  ${displayCompany}`;

            // Left: Company / Title
            doc
              .font(fontBold)
              .fontSize(10)
              .fillColor(isExecClassic ? "#000000" : "#0f172a")
              .text(headerText, leftMargin, y, { width: 375 });
            const leftEndY = doc.y;

            // Right: Dates
            doc
              .font(fontBold)
              .fontSize(9.5)
              .fillColor(isExecClassic ? "#000000" : "#475569")
              .text(dateText, 425, y, { width: 142, align: "right" });

            // Location beneath on left (clean italic)
            const cleanExpLoc = cleanLocation(exp.location);
            if (cleanExpLoc) {
              doc.y = Math.max(leftEndY, doc.y);
              doc
                .font(fontItalic)
                .fontSize(8.5)
                .fillColor(isExecClassic ? "#475569" : "#64748b")
                .text(cleanExpLoc, leftMargin, doc.y);
            } else {
              doc.y = Math.max(leftEndY, doc.y);
            }

            doc.moveDown(0.2);

            const bullets = ExportService.cleanBulletList(exp.responsibilities || []);
            for (const resp of bullets) {
              const bulletHeight = doc.heightOfString(resp, { width: contentWidth - 14, lineGap: 2.4 });
              checkPageBreak(bulletHeight + 4);
              const bY = doc.y;

              // Bullet symbol with hanging indent
              doc
                .font(fontRegular)
                .fontSize(9)
                .fillColor(isExecClassic ? "#000000" : "#334155")
                .text("•", leftMargin + 2, bY);

              // Bullet text aligned after bullet symbol
              doc
                .font(fontRegular)
                .fontSize(9)
                .fillColor(isExecClassic ? "#000000" : "#1e293b")
                .text(resp, leftMargin + 14, bY, {
                  width: contentWidth - 14,
                  lineGap: 2.4
                });

              doc.y += 3;
            }
            doc.moveDown(0.25);
          }
        } else if (section === "projects" && resume.projects.length > 0) {
          renderSectionHeader("Key Initiatives & Projects");
          for (const proj of resume.projects) {
            checkPageBreak(65);
            doc
              .font(fontBold)
              .fontSize(9.5)
              .fillColor(primaryColor)
              .text(proj.title, leftMargin, doc.y, { continued: true })
              .font(fontRegular)
              .fillColor("#475569")
              .text(proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : "");

            if (proj.description) {
              doc
                .font(fontRegular)
                .fontSize(9)
                .fillColor("#334155")
                .text(proj.description, leftMargin + 6, doc.y, { lineGap: 2, width: contentWidth - 6 });
            }

            const highlights = ExportService.cleanBulletList(proj.highlights || []);
            for (const h of highlights) {
              const hHeight = doc.heightOfString(h, { width: contentWidth - 14, lineGap: 2.4 });
              checkPageBreak(hHeight + 4);
              const hY = doc.y;

              doc
                .font(fontRegular)
                .fontSize(9)
                .fillColor(primaryColor)
                .text("•", leftMargin + 2, hY);

              doc
                .font(fontRegular)
                .fontSize(9)
                .fillColor("#334155")
                .text(h, leftMargin + 14, hY, {
                  width: contentWidth - 14,
                  lineGap: 2.4
                });

              doc.y += 2.5;
            }
            doc.moveDown(0.25);
          }
        } else if (section === "education" && resume.education.length > 0) {
          renderSectionHeader("Education");
          const seenEdu = new Set<string>();
          for (const edu of resume.education) {
            let displayDegree = edu.degree;
            let displayInst = edu.institution || "";

            const isInst = (text: string) => /\b(college|university|institute|school|polytechnic|academy|govt|government)\b/i.test(text);
            const isDeg = (text: string) => /\b(diploma|bachelor|master|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|bba|mba|phd|associate|degree)\b/i.test(text);

            if (isInst(displayDegree) && isDeg(displayInst)) {
              displayDegree = edu.institution || "";
              displayInst = edu.degree;
            }

            const normKey1 = `${displayDegree.toLowerCase().trim()}|${displayInst.toLowerCase().trim()}`;
            const normKey2 = `${displayInst.toLowerCase().trim()}|${displayDegree.toLowerCase().trim()}`;
            if (seenEdu.has(normKey1) || seenEdu.has(normKey2)) continue;
            seenEdu.add(normKey1);
            seenEdu.add(normKey2);

            checkPageBreak(45);
            const y = doc.y;
            const eduDate = edu.endDate ? `${edu.startDate ? edu.startDate + ' – ' : ''}${edu.endDate}` : "Completed";

            doc
              .font(fontBold)
              .fontSize(9.5)
              .fillColor(primaryColor)
              .text(displayDegree, leftMargin, y, { width: 380 });
            const leftEndY = doc.y;

            doc
              .font(fontBold)
              .fontSize(9.5)
              .fillColor(primaryColor)
              .text(eduDate, 425, y, { width: 142, align: "right" });

            if (displayInst) {
              doc.y = Math.max(leftEndY, doc.y);
              doc
                .font(fontItalic)
                .fontSize(9)
                .fillColor(isExecClassic ? "#334155" : "#475569")
                .text(displayInst, leftMargin, doc.y);
            } else {
              doc.y = Math.max(leftEndY, doc.y);
            }
            doc.moveDown(0.25);
          }
        } else if (section === "certifications" && resume.certifications && resume.certifications.length > 0) {
          renderSectionHeader("Certifications");
          const seenCert = new Set<string>();
          for (const cert of resume.certifications) {
            const key = cert.name.toLowerCase().trim();
            if (seenCert.has(key)) continue;
            seenCert.add(key);

            checkPageBreak(38);
            doc
              .font(fontBold)
              .fontSize(9.5)
              .fillColor(primaryColor)
              .text(cert.name, leftMargin, doc.y);

            const meta = [cert.issuingOrganization, cert.issueDate].filter(Boolean).join(" | ");
            if (meta) {
              doc
                .font(fontRegular)
                .fontSize(8.5)
                .fillColor("#475569")
                .text(meta, leftMargin, doc.y);
            }
            doc.moveDown(0.2);
          }
        }
      }

      // Languages Section
      if (resume.languages && resume.languages.length > 0) {
        renderSectionHeader("Languages");
        doc
          .font(fontRegular)
          .fontSize(9.5)
          .fillColor(isExecClassic ? "#000000" : "#334155")
          .text(resume.languages.join("  |  "), leftMargin, doc.y);
      }

      doc.end();
    });
  }

  /**
   * Generates a fully formatted, ATS-compliant Microsoft Word (.docx) document
   */
  static async generateDocx(resume: StructuredResume, templateSlug: string = "executive_classic"): Promise<Buffer> {
    const isExecClassic = templateSlug === "executive_classic";
    const docChildren: any[] = [];

    // Title / Name
    docChildren.push(
      new Paragraph({
        text: (resume.personal.name || "Candidate").toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
      })
    );

    // Headline / Subtitle
    if (resume.headline) {
      docChildren.push(
        new Paragraph({
          text: resume.headline.toUpperCase(),
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 }
        })
      );
    }

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
            size: 19
          })
        ],
        spacing: { after: 180 }
      })
    );

    const addSectionHeader = (title: string) => {
      docChildren.push(
        new Paragraph({
          text: title.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
    };

    // Summary
    if (resume.summary) {
      addSectionHeader("Professional Summary");
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: resume.summary, size: 20 })]
        })
      );
    }

    // Certifications (if present)
    if (resume.certifications && resume.certifications.length > 0) {
      addSectionHeader("Certifications");
      for (const cert of resume.certifications) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: cert.name, bold: true, size: 20 }),
              new TextRun({
                text: [cert.issuingOrganization, cert.issueDate].filter(Boolean).length > 0
                  ? `  |  ${[cert.issuingOrganization, cert.issueDate].filter(Boolean).join(" - ")}`
                  : "",
                italics: true,
                size: 18
              })
            ],
            spacing: { before: 40, after: 40 }
          })
        );
      }
    }

    // Skills
    if (isExecClassic && resume.skills.categories && resume.skills.categories.length >= 2) {
      addSectionHeader("Skills");
      for (const cat of resume.skills.categories) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${cat.title.toUpperCase()}: `, bold: true, size: 20 }),
              new TextRun({ text: cat.skills.join(", "), size: 19 })
            ],
            spacing: { before: 40, after: 40 }
          })
        );
      }
    } else {
      const isPureTech =
        (resume.skills.languages?.length || 0) +
        (resume.skills.frontend?.length || 0) +
        (resume.skills.backend?.length || 0) > 0;

      addSectionHeader(isPureTech ? "Technical Skills" : "Core Competencies & Skills");

      const skillList: string[] = [];
      if (resume.skills.categories && resume.skills.categories.length > 0) {
        for (const cat of resume.skills.categories) {
          if (cat.skills.length > 0) {
            skillList.push(`${cat.title}: ${cat.skills.join(", ")}`);
          }
        }
      }

      if (skillList.length === 0) {
        if (resume.skills.languages?.length) skillList.push(`Languages: ${resume.skills.languages.join(", ")}`);
        if (resume.skills.frontend?.length) skillList.push(`Frontend: ${resume.skills.frontend.join(", ")}`);
        if (resume.skills.backend?.length) skillList.push(`Backend: ${resume.skills.backend.join(", ")}`);
        if (resume.skills.databases?.length) skillList.push(`Databases: ${resume.skills.databases.join(", ")}`);
        if (resume.skills.tools?.length) skillList.push(`Tools & Systems: ${resume.skills.tools.join(", ")}`);
        if (resume.skills.specialized?.length) skillList.push(`Specialized: ${resume.skills.specialized.join(", ")}`);
        if (resume.skills.coreSkills?.length) skillList.push(`Core Competencies: ${resume.skills.coreSkills.join(", ")}`);
        if (resume.skills.rawList?.length && skillList.length === 0) {
          skillList.push(`Skills: ${resume.skills.rawList.join(", ")}`);
        }
      }

      for (const line of skillList) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 20 })]
          })
        );
      }
    }

    // Experience
    if (resume.experience.length > 0) {
      addSectionHeader("Professional Experience");
      const titleKeywords = /\b(officer|engineer|developer|specialist|manager|coordinator|analyst|director|lead|apprentice|technician|supervisor|consultant|associate|assistant|intern|executive)\b/i;
      const companyKeywords = /\b(pvt|ltd|limited|inc|corp|technologies|engineering|systems|corporation|solutions|services|group|company|hospital|clinic)\b/i;

      for (const exp of resume.experience) {
        let displayTitle = exp.jobTitle;
        let displayCompany = exp.company;

        if (companyKeywords.test(displayTitle) || (titleKeywords.test(displayCompany) && !titleKeywords.test(displayTitle))) {
          displayTitle = exp.company;
          displayCompany = exp.jobTitle;
        }

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${displayCompany} | ${displayTitle}`, bold: true, size: 20 }),
              new TextRun({ text: `   (${exp.startDate} – ${exp.endDate})`, italics: true, size: 18 })
            ],
            spacing: { before: 100, after: 40 }
          })
        );
        const bullets = ExportService.cleanBulletList(exp.responsibilities || []);
        for (const resp of bullets) {
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
      addSectionHeader("Key Initiatives & Projects");
      for (const proj of resume.projects) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.title, bold: true, size: 20 }),
              new TextRun({
                text: proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : "",
                italics: true,
                size: 18
              })
            ]
          })
        );
        if (proj.description) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: proj.description, size: 19 })]
            })
          );
        }
        const highlights = ExportService.cleanBulletList(proj.highlights || []);
        for (const h of highlights) {
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
      const seenEduDocx = new Set<string>();
      for (const edu of resume.education) {
        let displayDegree = edu.degree;
        let displayInst = edu.institution || "";

        const isInst = (text: string) => /\b(college|university|institute|school|polytechnic|academy|govt|government)\b/i.test(text);
        const isDeg = (text: string) => /\b(diploma|bachelor|master|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|bba|mba|phd|associate|degree)\b/i.test(text);

        if (isInst(displayDegree) && isDeg(displayInst)) {
          displayDegree = edu.institution || "";
          displayInst = edu.degree;
        }

        const normKey1 = `${displayDegree.toLowerCase().trim()}|${displayInst.toLowerCase().trim()}`;
        const normKey2 = `${displayInst.toLowerCase().trim()}|${displayDegree.toLowerCase().trim()}`;
        if (seenEduDocx.has(normKey1) || seenEduDocx.has(normKey2)) continue;
        seenEduDocx.add(normKey1);
        seenEduDocx.add(normKey2);

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: displayDegree, bold: true, size: 20 }),
              new TextRun({ text: ` - ${displayInst}`, size: 19 }),
              new TextRun({ text: ` (${edu.endDate || "Completed"})`, italics: true, size: 18 })
            ]
          })
        );
      }
    }

    // Languages
    if (resume.languages && resume.languages.length > 0) {
      addSectionHeader("Languages");
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: resume.languages.join("  |  "), size: 19 })]
        })
      );
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
