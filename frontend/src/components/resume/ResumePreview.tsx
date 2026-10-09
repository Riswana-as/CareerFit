import React from "react";
import { StructuredResume } from "../../types";

interface ResumePreviewProps {
  resume: StructuredResume;
  templateSlug?: string;
  zoom?: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  templateSlug = "modern",
  zoom = 1
}) => {
  const isClassic = templateSlug === "classic";
  const isTech = templateSlug === "technical";
  const isGraduate = templateSlug === "fresh_graduate";

  const primaryFont = isTech
    ? "font-mono"
    : isGraduate
    ? "font-serif"
    : "font-sans";

  const headerBorder = isTech
    ? "border-teal-700 text-teal-800"
    : isClassic
    ? "border-slate-800 text-slate-900"
    : isGraduate
    ? "border-indigo-700 text-indigo-900"
    : "border-brand-600 text-brand-700";

  return (
    <div
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      className={`bg-white text-slate-800 shadow-md border border-slate-200 rounded-lg p-8 sm:p-12 max-w-[800px] mx-auto min-h-[1050px] leading-relaxed transition-all ${primaryFont}`}
    >
      {/* Header */}
      <div className={`mb-6 ${isClassic ? "text-center" : "text-left"}`}>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900">
          {resume.personal?.name || "Candidate Name"}
        </h1>
        {resume.headline && (
          <p className="text-sm font-semibold text-slate-600 mt-0.5">{resume.headline}</p>
        )}
        <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-x-2 gap-y-1 justify-start">
          {resume.personal?.email && <span>{resume.personal.email}</span>}
          {resume.personal?.phone && <span>• {resume.personal.phone}</span>}
          {resume.personal?.location && <span>• {resume.personal.location}</span>}
          {resume.personal?.linkedin && (
            <span>• <a href={resume.personal.linkedin} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">LinkedIn</a></span>
          )}
          {resume.personal?.github && (
            <span>• <a href={resume.personal.github} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">GitHub</a></span>
          )}
        </div>
      </div>

      {/* Sections according to sectionOrder */}
      {(resume.sectionOrder || ["summary", "skills", "experience", "projects", "education"]).map((secKey) => {
        if (secKey === "summary" && resume.summary) {
          return (
            <div key="summary" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2 ${headerBorder}`}>
                Professional Summary
              </h2>
              <p className="text-xs text-slate-700 leading-normal">{resume.summary}</p>
            </div>
          );
        }

        if (secKey === "skills") {
          const hasSkills =
            (resume.skills.languages?.length || 0) +
            (resume.skills.frontend?.length || 0) +
            (resume.skills.backend?.length || 0) +
            (resume.skills.databases?.length || 0) +
            (resume.skills.tools?.length || 0) +
            (resume.skills.rawList?.length || 0) > 0;

          if (!hasSkills) return null;

          return (
            <div key="skills" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2 ${headerBorder}`}>
                Technical Skills
              </h2>
              <div className="text-xs text-slate-700 space-y-1">
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
                {resume.skills.rawList?.length && !resume.skills.languages?.length ? (
                  <p><strong>Core Skills:</strong> {resume.skills.rawList.join(", ")}</p>
                ) : null}
              </div>
            </div>
          );
        }

        if (secKey === "experience" && resume.experience?.length) {
          return (
            <div key="experience" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2 ${headerBorder}`}>
                Work Experience
              </h2>
              <div className="space-y-3.5">
                {resume.experience.map((exp, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-baseline font-semibold text-slate-900">
                      <span>{exp.jobTitle} <span className="font-normal text-slate-600">| {exp.company}</span></span>
                      <span className="text-[11px] text-slate-500 font-normal">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-slate-700 pl-1">
                      {exp.responsibilities?.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-snug">{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (secKey === "projects" && resume.projects?.length) {
          return (
            <div key="projects" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2 ${headerBorder}`}>
                Key Projects
              </h2>
              <div className="space-y-3">
                {resume.projects.map((proj, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-slate-900">
                        {proj.title}
                        {proj.technologies?.length ? (
                          <span className="ml-2 font-normal text-slate-500">[{proj.technologies.join(", ")}]</span>
                        ) : null}
                      </span>
                    </div>
                    {proj.description && <p className="mt-0.5 text-slate-700">{proj.description}</p>}
                    {proj.highlights?.length ? (
                      <ul className="mt-1 space-y-0.5 list-disc list-inside text-slate-700 pl-1">
                        {proj.highlights.map((h, hIdx) => (
                          <li key={hIdx}>{h}</li>
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
          return (
            <div key="education" className="mb-5">
              <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2 ${headerBorder}`}>
                Education
              </h2>
              <div className="space-y-2">
                {resume.education.map((edu, idx) => (
                  <div key={idx} className="text-xs flex justify-between items-baseline">
                    <div>
                      <span className="font-semibold text-slate-900">{edu.degree}</span>
                      <span className="text-slate-600"> | {edu.institution}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{edu.endDate || "Completed"}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
