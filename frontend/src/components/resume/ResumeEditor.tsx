import React, { useState } from "react";
import { StructuredResume } from "../../types";
import { Plus, Trash2, Save, Sparkles } from "lucide-react";

interface ResumeEditorProps {
  resume: StructuredResume;
  onChange: (updated: StructuredResume) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  resume,
  onChange,
  onSave,
  isSaving = false
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "skills" | "experience" | "projects" | "education">("summary");

  const updatePersonal = (field: string, value: string) => {
    onChange({
      ...resume,
      personal: {
        ...resume.personal,
        [field]: value
      }
    });
  };

  const updateSummary = (val: string) => {
    onChange({ ...resume, summary: val });
  };

  const updateSkillCategory = (cat: keyof StructuredResume["skills"], val: string) => {
    const list = val.split(",").map((s) => s.trim()).filter(Boolean);
    onChange({
      ...resume,
      skills: {
        ...resume.skills,
        [cat]: list
      }
    });
  };

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, val: string) => {
    const exps = [...resume.experience];
    exps[expIdx].responsibilities[bulletIdx] = val;
    onChange({ ...resume, experience: exps });
  };

  const addExperienceBullet = (expIdx: number) => {
    const exps = [...resume.experience];
    exps[expIdx].responsibilities.push("Delivered key software capabilities and verified performance.");
    onChange({ ...resume, experience: exps });
  };

  const removeExperienceBullet = (expIdx: number, bulletIdx: number) => {
    const exps = [...resume.experience];
    exps[expIdx].responsibilities.splice(bulletIdx, 1);
    onChange({ ...resume, experience: exps });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top bar with tabs */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 sm:px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex space-x-1">
          {(["summary", "skills", "experience", "projects", "education"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white text-brand-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
        {/* Contact info always quick-editable */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={resume.personal.name || ""}
              onChange={(e) => updatePersonal("name", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={resume.personal.email || ""}
              onChange={(e) => updatePersonal("email", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* SUMMARY TAB */}
        {activeTab === "summary" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">Professional Summary</label>
              <span className="text-xs text-slate-400">Aim for 3-4 impactful sentences</span>
            </div>
            <textarea
              rows={6}
              value={resume.summary || ""}
              onChange={(e) => updateSummary(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 leading-relaxed font-sans"
              placeholder="Highlight authentic experience and domain strengths..."
            />
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Edit comma-separated skills in each category. Only authentic skills you possess should be included.
            </p>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Languages</label>
              <input
                type="text"
                value={(resume.skills.languages || []).join(", ")}
                onChange={(e) => updateSkillCategory("languages", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Frontend</label>
              <input
                type="text"
                value={(resume.skills.frontend || []).join(", ")}
                onChange={(e) => updateSkillCategory("frontend", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Backend</label>
              <input
                type="text"
                value={(resume.skills.backend || []).join(", ")}
                onChange={(e) => updateSkillCategory("backend", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Databases</label>
              <input
                type="text"
                value={(resume.skills.databases || []).join(", ")}
                onChange={(e) => updateSkillCategory("databases", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Tools & Platforms</label>
              <input
                type="text"
                value={(resume.skills.tools || []).join(", ")}
                onChange={(e) => updateSkillCategory("tools", e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            {resume.experience.map((exp, expIdx) => (
              <div key={expIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={exp.jobTitle}
                      onChange={(e) => {
                        const exps = [...resume.experience];
                        exps[expIdx].jobTitle = e.target.value;
                        onChange({ ...resume, experience: exps });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const exps = [...resume.experience];
                        exps[expIdx].company = e.target.value;
                        onChange({ ...resume, experience: exps });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Responsibilities & Achievements</label>
                    <button
                      type="button"
                      onClick={() => addExperienceBullet(expIdx)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Bullet</span>
                    </button>
                  </div>

                  {exp.responsibilities.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start space-x-2">
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                        className="flex-1 p-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeExperienceBullet(expIdx, bIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        title="Delete bullet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {resume.projects.map((proj, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const projs = [...resume.projects];
                        projs[idx].title = e.target.value;
                        onChange({ ...resume, projects: projs });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Technologies (comma separated)</label>
                    <input
                      type="text"
                      value={(proj.technologies || []).join(", ")}
                      onChange={(e) => {
                        const projs = [...resume.projects];
                        projs[idx].technologies = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        onChange({ ...resume, projects: projs });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const projs = [...resume.projects];
                      projs[idx].description = e.target.value;
                      onChange({ ...resume, projects: projs });
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === "education" && (
          <div className="space-y-4">
            {resume.education.map((edu, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const edus = [...resume.education];
                        edus[idx].degree = e.target.value;
                        onChange({ ...resume, education: edus });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const edus = [...resume.education];
                        edus[idx].institution = e.target.value;
                        onChange({ ...resume, education: edus });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
