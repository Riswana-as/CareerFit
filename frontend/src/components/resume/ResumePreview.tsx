import React from "react";
import { StructuredResume } from "../../types";

interface ResumePreviewProps {
  resume: StructuredResume;
  templateSlug?: string;
  zoom?: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  templateSlug = "executive_classic",
  zoom = 1
}) => {
  const isExecClassic = templateSlug === "executive_classic";
  const isClassic = templateSlug === "classic";
  const isTech = templateSlug === "technical";
  const isGraduate = templateSlug === "fresh_graduate";

  const primaryFont = isExecClassic || isGraduate
    ? "font-serif"
    : isTech
    ? "font-mono"
    : "font-sans";

  const headerBorder = isExecClassic
    ? "border-black text-black"
    : isTech
    ? "border-teal-700 text-teal-800"
    : isClassic
    ? "border-slate-800 text-slate-900"
    : isGraduate
    ? "border-indigo-700 text-indigo-900"
    : "border-brand-600 text-brand-700";

  // Check if we have two skill categories for the 2-column layout
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

  // Final section ordering: if executive_classic, ensure certifications are rendered
  const sections = resume.sectionOrder || ["summary", "skills", "experience", "projects", "education", "certifications"];
  const finalSections = [...sections];
  if (isExecClassic && resume.certifications && resume.certifications.length > 0 && !finalSections.includes("certifications")) {
    finalSections.push("certifications");
  }

  return (
    <div
      id="printable-resume"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      className={`bg-white text-slate-900 shadow-xl shadow-slate-400/20 border border-slate-200/90 rounded-2xl p-8 sm:p-12 max-w-[820px] mx-auto min-h-[1050px] leading-relaxed transition-all ${primaryFont}`}
    >
      {/* Header */}
      {(() => {
        const cleanLoc = (loc?: string) => {
          if (!loc) return "";
          let c = loc.trim().replace(/,\s*(and|or|etc\.?)$/i, "");
          if (/^(and|industrial|operations|engineering|maintenance|safety|experience)\b/i.test(c)) return "";
          return c;
        };
        const validLoc = cleanLoc(resume.personal?.location);

        return (
          <div className={`mb-6 ${isExecClassic || isClassic ? "text-center" : "text-left"}`}>
            <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950 ${isExecClassic ? "tracking-wider" : ""}`}>
              {resume.personal?.name || "Candidate Name"}
            </h1>
            {resume.headline && (
              <p className={`text-xs sm:text-sm font-semibold uppercase mt-1 text-slate-700 ${isExecClassic ? "tracking-widest" : ""}`}>
                {resume.headline}
              </p>
            )}
            <div className={`mt-2 text-xs text-slate-700 flex flex-wrap gap-x-2.5 gap-y-1 ${isExecClassic || isClassic ? "justify-center" : "justify-start"}`}>
              {resume.personal?.email && <span>{resume.personal.email}</span>}
              {resume.personal?.phone && <span>| {resume.personal.phone}</span>}
              {validLoc && <span>| {validLoc}</span>}
              {resume.personal?.linkedin && (
                <span>| <a href={resume.personal.linkedin} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">LinkedIn</a></span>
              )}
              {resume.personal?.github && (
                <span>| <a href={resume.personal.github} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Portfolio/Code</a></span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sections */}
      {finalSections.map((secKey) => {
        if (secKey === "summary" && resume.summary) {
          return (
            <div key="summary" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                Professional Summary
              </h2>
              <p className={`text-xs text-slate-800 leading-normal ${isExecClassic ? "text-justify" : "text-left"}`}>
                {resume.summary}
              </p>
            </div>
          );
        }

        if (secKey === "certifications" && resume.certifications && resume.certifications.length > 0) {
          const seenC = new Set<string>();
          const uniqueCerts = resume.certifications.filter((c) => {
            const key = c.name.toLowerCase().trim();
            if (seenC.has(key)) return false;
            seenC.add(key);
            return true;
          });

          return (
            <div key="certifications" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                Certifications
              </h2>
              <div className="space-y-2 text-xs">
                {uniqueCerts.map((cert, idx) => (
                  <div key={idx}>
                    <p className="font-bold text-slate-900">{cert.name}</p>
                    {(cert.issuingOrganization || cert.issueDate) && (
                      <p className="text-[11px] text-slate-600">
                        {[cert.issuingOrganization, cert.issueDate].filter(Boolean).join(" | ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (secKey === "skills") {
          const hasSkills =
            (resume.skills.categories?.length || 0) > 0 ||
            (resume.skills.rawList?.length || 0) > 0 ||
            (resume.skills.coreSkills?.length || 0) > 0 ||
            (resume.skills.specialized?.length || 0) > 0 ||
            (resume.skills.tools?.length || 0) > 0;

          if (!hasSkills) return null;

          if (isExecClassic) {
            return (
              <div key="skills" className="mb-5">
                <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                  Skills
                </h2>
                <div className="grid grid-cols-2 gap-6 text-xs text-slate-800">
                  {/* Column 1 */}
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-950 mb-1.5">
                      {col1Title}
                    </h3>
                    <ul className="space-y-1">
                      {col1Skills.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="font-bold text-slate-950">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-950 mb-1.5">
                      {col2Title}
                    </h3>
                    <ul className="space-y-1">
                      {col2Skills.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="font-bold text-slate-950">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          }

          const isPureTech =
            (resume.skills.languages?.length || 0) +
            (resume.skills.frontend?.length || 0) +
            (resume.skills.backend?.length || 0) > 0;

          return (
            <div key="skills" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                {isPureTech ? "Technical Skills" : "Core Competencies & Skills"}
              </h2>
              <div className="text-xs text-slate-800 space-y-1">
                {resume.skills.categories && resume.skills.categories.length > 0 ? (
                  resume.skills.categories.map((cat, idx) => (
                    <p key={idx}><strong>{cat.title}:</strong> {cat.skills.join(", ")}</p>
                  ))
                ) : (
                  <>
                    {resume.skills.languages?.length ? (
                      <p><strong>Languages:</strong> {resume.skills.languages.join(", ")}</p>
                    ) : null}
                    {resume.skills.frontend?.length ? (
                      <p><strong>Frontend:</strong> {resume.skills.frontend.join(", ")}</p>
                    ) : null}
                    {resume.skills.backend?.length ? (
                      <p><strong>Backend:</strong> {resume.skills.backend.join(", ")}</p>
                    ) : null}
                    {resume.skills.databases?.length ? (
                      <p><strong>Databases:</strong> {resume.skills.databases.join(", ")}</p>
                    ) : null}
                    {resume.skills.tools?.length ? (
                      <p><strong>Tools & Platforms:</strong> {resume.skills.tools.join(", ")}</p>
                    ) : null}
                    {resume.skills.specialized?.length ? (
                      <p><strong>Specialized:</strong> {resume.skills.specialized.join(", ")}</p>
                    ) : null}
                    {resume.skills.coreSkills?.length ? (
                      <p><strong>Core Competencies:</strong> {resume.skills.coreSkills.join(", ")}</p>
                    ) : null}
                    {resume.skills.rawList?.length && !resume.skills.languages?.length && !resume.skills.coreSkills?.length ? (
                      <p><strong>Core Skills:</strong> {resume.skills.rawList.join(", ")}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        }

        if (secKey === "experience" && resume.experience?.length) {
          return (
            <div key="experience" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                {isExecClassic ? "Experience" : "Professional Experience"}
              </h2>
              <div className="space-y-4">
                {resume.experience.map((exp, idx) => {
                  const titleKeywords = /\b(officer|engineer|developer|specialist|manager|coordinator|analyst|director|lead|apprentice|technician|supervisor|consultant|associate|assistant|intern|executive)\b/i;
                  const companyKeywords = /\b(pvt|ltd|limited|inc|corp|technologies|engineering|systems|corporation|solutions|services|group|company|hospital|clinic)\b/i;

                  let displayTitle = exp.jobTitle;
                  let displayCompany = exp.company;
                  if (companyKeywords.test(displayTitle) || (titleKeywords.test(displayCompany) && !titleKeywords.test(displayTitle))) {
                    displayTitle = exp.company;
                    displayCompany = exp.jobTitle;
                  }

                  // Bullet joiner / cleaner
                  const locationRegex = /^(chennai|mavelikkara|thiruvalla|ernakulam|kochi|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|india|kerala|tamil\s+nadu|remote|hybrid|onsite)$/i;
                  const rawBullets = exp.responsibilities || [];
                  const cleanBullets: string[] = [];
                  for (let b of rawBullets) {
                    const cleanB = b.trim().replace(/^[•\-\*]\s*/, "");
                    if (!cleanB || locationRegex.test(cleanB)) continue;
                    if (
                      cleanBullets.length > 0 &&
                      (/^[a-z]/.test(cleanB) ||
                        (!/[.!?]$/.test(cleanBullets[cleanBullets.length - 1]) &&
                          !/^(conduct|monitor|review|coordinate|support|manage|lead|develop|maintain|execute|inspect|ensure|perform|direct|spearhead|prepare|recommend|achieve|drive|assisted|implemented|administered|recorded)\b/i.test(cleanB)))
                    ) {
                      cleanBullets[cleanBullets.length - 1] = `${cleanBullets[cleanBullets.length - 1].replace(/\s+$/, "")} ${cleanB}`;
                    } else {
                      cleanBullets.push(cleanB);
                    }
                  }

                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-slate-950">
                        <span>{displayCompany} <span className="font-medium text-slate-700">| {displayTitle}</span></span>
                        <span className="text-[11px] text-slate-700 font-normal">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      {exp.location && !locationRegex.test(exp.location.toLowerCase()) && (
                        <div className="text-[11px] text-slate-600 italic">
                          {exp.location}
                        </div>
                      )}
                      <ul className="mt-1 space-y-1 text-slate-800 pl-2">
                        {cleanBullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-snug flex items-start space-x-1.5">
                            <span className="font-bold text-slate-900">•</span>
                            <span>{bullet.endsWith(".") ? bullet : `${bullet}.`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (secKey === "projects" && resume.projects?.length) {
          return (
            <div key="projects" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                Key Initiatives & Projects
              </h2>
              <div className="space-y-3">
                {resume.projects.map((proj, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-950">
                        {proj.title}
                        {proj.technologies?.length ? (
                          <span className="ml-2 font-normal text-slate-500">[{proj.technologies.join(", ")}]</span>
                        ) : null}
                      </span>
                    </div>
                    {proj.description && <p className="mt-0.5 text-slate-700">{proj.description}</p>}
                    {proj.highlights?.length ? (
                      <ul className="mt-1 space-y-0.5 text-slate-800 pl-2">
                        {proj.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="flex items-start space-x-1.5">
                            <span>•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (secKey === "education" && resume.education?.length) {
          const seenE = new Set<string>();
          const isInst = (text: string) => /\b(college|university|institute|school|polytechnic|academy|govt|government)\b/i.test(text);
          const isDeg = (text: string) => /\b(diploma|bachelor|master|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|bba|mba|phd|associate|degree)\b/i.test(text);

          const uniqueEdu = resume.education
            .map((edu) => {
              let degree = edu.degree;
              let institution = edu.institution || "";
              if (isInst(degree) && isDeg(institution)) {
                degree = edu.institution || "";
                institution = edu.degree;
              }
              return { ...edu, degree, institution };
            })
            .filter((edu) => {
              const norm1 = `${edu.degree.toLowerCase().trim()}|${edu.institution.toLowerCase().trim()}`;
              const norm2 = `${edu.institution.toLowerCase().trim()}|${edu.degree.toLowerCase().trim()}`;
              if (seenE.has(norm1) || seenE.has(norm2)) return false;
              seenE.add(norm1);
              seenE.add(norm2);
              return true;
            });

          return (
            <div key="education" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
                Education
              </h2>
              <div className="space-y-2">
                {uniqueEdu.map((edu, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-950">{edu.degree}</span>
                      <span className="text-[11px] text-slate-700">{edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || "Completed"}</span>
                    </div>
                    {edu.institution && (
                      <p className="text-slate-700 italic text-[11px] mt-0.5">{edu.institution}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Languages */}
      {resume.languages && resume.languages.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-0.5 mb-2 ${headerBorder}`}>
            Languages
          </h2>
          <p className="text-xs text-slate-800">
            {resume.languages.join(" | ")}
          </p>
        </div>
      )}
    </div>
  );
};
