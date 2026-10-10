import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { ExtractedJobDescription, ResumeRecord } from "../types";
import { Target, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Loader2, Key, Settings, HelpCircle, Briefcase, Layout } from "lucide-react";

export const JobAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resumeIdParam = searchParams.get("resumeId");

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumeIdParam || "");
  const [jobText, setJobText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("executive_classic");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [analyzedJob, setAnalyzedJob] = useState<ExtractedJobDescription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gemini API key state
  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem("careerfit_gemini_api_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiKey);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await apiClient.listResumes();
        setResumes(res.data.resumes);
        if (!selectedResumeId && res.data.resumes.length > 0) {
          setSelectedResumeId(res.data.resumes[0].id);
        }
      } catch (err) {
        console.error("Failed to load resumes:", err);
      }
    };
    fetchResumes();
  }, [selectedResumeId]);

  const handleSaveGeminiKey = () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      localStorage.setItem("careerfit_gemini_api_key", trimmed);
      setGeminiKey(trimmed);
    } else {
      localStorage.removeItem("careerfit_gemini_api_key");
      setGeminiKey("");
    }
    setShowKeyModal(false);
  };

  const handleLoadSampleJob = (type: "software" | "nursing" | "marketing" | "finance" | "operations") => {
    if (type === "nursing") {
      setJobText(`Staff Registered Nurse (RN) - Acute Inpatient Care
Company: St. Jude Memorial Hospital
Department: Clinical Inpatient Services
Location: Chicago, IL (On-site)
Employment Type: Full-time

About the Role:
We are seeking a compassionate, skilled Registered Nurse (RN) to deliver direct bedside patient care, clinical assessment, and medical intervention in our acute care medical-surgical unit.

Key Responsibilities:
• Deliver comprehensive direct patient care, triage, and vital signs monitoring for adult inpatient care.
• Conduct thorough initial and ongoing patient assessments, recognizing changes in condition promptly.
• Administer medications, IV therapy, and wound care in strict adherence to hospital safety protocols.
• Maintain detailed and timely electronic medical records in Epic EHR, ensuring 100% HIPAA compliance.
• Partner closely with multidisciplinary care teams, attending physicians, and families on discharge planning.

Qualifications & Requirements:
• Active Registered Nurse (RN) license in good standing
• Bachelor of Science in Nursing (BSN) or Associate Degree in Nursing
• Current Basic Life Support (BLS) certification (AHA accredited)
• 2+ years of acute care, telemetry, or med-surg nursing experience
• Proficiency with Epic EHR or Cerner clinical documentation systems

Preferred Skills:
• Advanced Cardiovascular Life Support (ACLS) certification
• Experience in IV therapy administration and medication reconciliation
• Proven leadership in clinical quality improvement initiatives
`);
    } else if (type === "marketing") {
      setJobText(`Digital Marketing Specialist & Growth Lead
Company: Apex Digital Media
Department: Marketing & Growth
Location: Austin, TX (Hybrid)
Employment Type: Full-time

About the Role:
Apex Digital Media is looking for an analytical, high-energy Digital Marketing Specialist to execute search engine optimization, content marketing campaigns, and conversion rate optimization.

Key Responsibilities:
• Plan and execute SEO and SEM strategies to drive qualified inbound traffic and lead acquisition.
• Manage editorial content calendar, authoring high-performing blogs, case studies, and email copy.
• Monitor website analytics, customer acquisition funnels, and campaign ROI using Google Analytics and HubSpot.
• Conduct keyword research, on-page optimization, competitor analysis, and A/B testing on landing pages.
• Manage automated CRM lead nurture workflows and email marketing campaigns.

Required Skills & Qualifications:
• 3+ years experience in digital marketing, SEO, and content marketing
• Deep expertise with Google Analytics, Google Search Console, and SEO audit tools
• Hands-on proficiency with HubSpot, Mailchimp, or equivalent CRM platforms
• Strong analytical mindset with proven ability to optimize conversion rates (CRO)
• Excellent copywriting, communication, and visual presentation skills

Preferred Skills:
• Experience managing paid search campaigns in Google Ads (PPC)
• Familiarity with WordPress CMS and basic HTML/CSS
• Proven track record in B2B SaaS growth marketing
`);
    } else if (type === "finance") {
      setJobText(`Senior Financial Analyst & Corporate Accounting
Company: Meridian Global Holdings
Department: Finance & Accounting
Location: New York, NY (Hybrid)
Employment Type: Full-time

About the Role:
We are hiring a Senior Financial Analyst to lead corporate financial modeling, variance analysis, budgeting, and financial reporting across our business units.

Key Responsibilities:
• Build and maintain multi-year financial forecast models, cash flow projections, and operating budgets.
• Prepare monthly variance analysis reports comparing actual performance against budget and historicals.
• Present financial insights, key performance indicators (KPIs), and trend analysis to senior leadership.
• Collaborate with corporate accounting on month-end general ledger closing and GAAP compliance.
• Support annual audit preparations, internal controls assessments, and tax reporting requirements.

Required Skills & Qualifications:
• Bachelor's degree in Finance, Accounting, Economics, or Business Administration
• 3+ years of progressive corporate finance, FP&A, or accounting experience
• Advanced proficiency in Microsoft Excel (financial modeling, nested formulas, pivot tables)
• Solid understanding of Generally Accepted Accounting Principles (GAAP) and general ledger accounts
• Hands-on experience with QuickBooks, SAP, NetSuite, or similar ERP systems

Preferred Skills:
• CPA (Certified Public Accountant) or CFA candidate preferred
• Experience with capital expenditure analysis and scenario modeling
• Excellent executive presentation and stakeholder communication abilities
`);
    } else if (type === "operations") {
      setJobText(`Operations & Project Management Specialist
Company: Vanguard Global Logistics
Department: Supply Chain & Operations
Location: Atlanta, GA (Hybrid)
Employment Type: Full-time

About the Role:
Vanguard Logistics seeks an Operations & Project Management Specialist to oversee cross-functional initiatives, streamline warehouse logistics, and drive Lean process improvements.

Key Responsibilities:
• Lead cross-functional operations projects from initiation through delivery, ensuring schedule and budget adherence.
• Map existing business workflows, identify operational bottlenecks, and implement Lean Six Sigma improvements.
• Manage vendor contracts, procurement logistics, and inventory control accuracy across distribution hubs.
• Define and track operational KPI dashboards, delivery SLAs, and customer fulfillment metrics.
• Coordinate daily sprint standups, risk mitigation plans, and stakeholder progress reviews.

Required Qualifications & Skills:
• 3+ years experience in operations management, project management, or supply chain logistics
• Demonstrated proficiency with Agile, Scrum, or Lean Six Sigma methodologies
• Hands-on experience with project management tools (Jira, Asana, Monday.com) and ERP systems
• Strong quantitative analysis and operational problem-solving capabilities
• Proven ability to align diverse cross-functional teams toward measurable deliverables

Preferred Skills:
• PMP (Project Management Professional) or Lean Six Sigma Green/Black Belt certification
• Experience in warehouse inventory optimization and freight transportation management
`);
    } else {
      setJobText(`Backend Developer
Company: Acme Cloud Technologies
Department: Platform Engineering
Location: San Francisco, CA (Hybrid)
Employment Type: Full-time

About the Role:
Looking for an experienced developer to build scalable REST APIs and high-performance backend microservices.

Requirements & Qualifications:
• 3+ years experience with Node.js and Express.js
• Deep knowledge of REST APIs and API architecture
• Hands-on database design with PostgreSQL
• Proficiency with Git version control
• Familiarity with containerization using Docker

Preferred Skills:
• Experience with Redis caching
• Microservices architecture
• AWS cloud infrastructure
• CI/CD pipeline automation

Responsibilities:
• Develop and maintain REST APIs for cloud platform
• Optimize database queries in PostgreSQL
• Maintain high availability and performance across backend microservices
• Collaborate with frontend developers on API contracts
`);
    }
  };

  const handleAnalyzeJob = async () => {
    if (!jobText.trim() || jobText.trim().length < 20) {
      setError("Please paste a realistic job description (at least 20 characters).");
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await apiClient.analyzeJob({
        rawText: jobText,
        title: manualTitle || undefined,
        company: manualCompany || undefined
      });
      setAnalyzedJob(res.data.job);
      setManualRole(res.data.job.detectedRole);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze job description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartTailoring = async () => {
    if (!selectedResumeId) {
      setError("Please select or upload a resume first.");
      return;
    }
    if (!analyzedJob) {
      setError("Please analyze the job description first.");
      return;
    }

    setError(null);
    setIsTailoring(true);

    try {
      const res = await apiClient.tailorResume(selectedResumeId, {
        jobId: analyzedJob.id,
        rawJobText: jobText,
        manualRole: manualRole || analyzedJob.detectedRole,
        templateSlug: selectedTemplate,
        geminiApiKey: geminiKey || undefined
      });

      // Navigate to the Tailor Review Page
      navigate(`/tailor/${res.data.versionId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to tailor resume.");
      setIsTailoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Step 2 of 3</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enter Target Job Description</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Paste any job posting from <strong>any industry</strong> (Healthcare, Tech, Finance, Marketing, Operations, Education, etc.).
          CareerFit AI detects the job role, required skills, and responsibilities to tailor your authentic resume with zero fabrication.
        </p>
      </div>

      {/* AI Engine Status Banner & Settings */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs">
                {geminiKey ? "Google Gemini AI Active" : "Universal Multi-Industry AI Active"}
              </span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Zero Fabrication
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {geminiKey
                ? "Powered by Gemini 2.5 Flash for contextual ATS tailoring and deep phrasing."
                : "Universal Multi-Industry Heuristic AI engine active (supports all professions)."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyInput(geminiKey);
            setShowKeyModal(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all flex-shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{geminiKey ? "Change Gemini Key" : "Add Gemini Key"}</span>
        </button>
      </div>

      {/* Gemini Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900">Configure Google Gemini API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Optionally provide your own Google Gemini API key for advanced generative tailoring across any profession.
              Your key is saved locally in your browser and used securely for your session.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Gemini API Key</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-400">
                Leave blank to use the built-in Universal Multi-Industry AI engine.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Source Resume */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Select Source Resume
        </label>
        {resumes.length > 0 ? (
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({new Date(r.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <span>You have no resumes uploaded yet.</span>
            <button
              onClick={() => navigate("/resumes/upload")}
              className="text-brand-600 font-bold underline"
            >
              Upload Resume First
            </button>
          </div>
        )}
      </div>

      {/* Job Description Input Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-bold text-slate-900">Job Description Text</label>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium">Load Sample:</span>
            <button
              type="button"
              onClick={() => handleLoadSampleJob("software")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold"
            >
              💻 Tech
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleJob("nursing")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold"
            >
              🏥 Healthcare / RN
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleJob("marketing")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold"
            >
              📈 Marketing
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleJob("finance")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold"
            >
              💰 Finance
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleJob("operations")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold"
            >
              📦 Operations
            </button>
          </div>
        </div>

        <textarea
          rows={11}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Paste full job description, qualifications, and responsibilities for any role (Nurse, Accountant, Marketer, Engineer, Manager, etc.)..."
          className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white leading-relaxed"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Job Title (Optional override)</label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Registered Nurse, Senior Accountant, Brand Lead"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Name (Optional)</label>
            <input
              type="text"
              value={manualCompany}
              onChange={(e) => setManualCompany(e.target.value)}
              placeholder="e.g. Metro Memorial Hospital, Acme Corp"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyzeJob}
          disabled={isAnalyzing}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Job Requirements & Detecting Role...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Analyze Job Requirements</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Card */}
      {analyzedJob && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detected Target Job Role & Department
              </span>
              <div className="flex items-center space-x-3 mt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{analyzedJob.detectedRole}</h3>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {analyzedJob.roleConfidence}% Confidence
                </span>
                {analyzedJob.department && (
                  <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {analyzedJob.department}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Manual Role Edit:</label>
              <input
                type="text"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg max-w-[200px]"
              />
            </div>
          </div>

          {/* Extracted requirements grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                Required Core Skills & Competencies ({analyzedJob.requiredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analyzedJob.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-brand-50 text-brand-800 border border-brand-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                Preferred Skills & Tools ({analyzedJob.preferredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analyzedJob.preferredSkills.length > 0 ? (
                  analyzedJob.preferredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None specifically marked as preferred.</span>
                )}
              </div>
            </div>
          </div>

          {/* Extracted responsibilities */}
          {analyzedJob.responsibilities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                Key Job Duties Identified ({analyzedJob.responsibilities.length})
              </h4>
              <ul className="space-y-1 list-disc list-inside text-slate-600 pl-1">
                {analyzedJob.responsibilities.slice(0, 4).map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resume Template Selection */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Layout className="w-4 h-4 text-brand-600" />
                <span>Select Target Resume Template</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Choose the visual layout and ATS structure you want for your generated resume.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: "executive_classic",
                  name: "Executive Classic (Harvard ATS)",
                  badge: "Matches User Sample",
                  recommended: true,
                  desc: "Classic serif typography, centered uppercase header, horizontal section dividers, right-aligned dates & balanced 2-column skills."
                },
                {
                  id: "modern",
                  name: "Modern ATS",
                  badge: "Corporate Clean",
                  recommended: false,
                  desc: "Contemporary sans-serif typography with subtle blue accents and standard single-column sections."
                },
                {
                  id: "technical",
                  name: "Technical Role",
                  badge: "Dev & Eng",
                  recommended: false,
                  desc: "Monospace font styling, high-density technical grouping, and code repository links."
                },
                {
                  id: "classic",
                  name: "Classic ATS",
                  badge: "Standard",
                  recommended: false,
                  desc: "Timeless traditional black-and-white layout with simple bullet points and high compatibility."
                }
              ].map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTemplate === tmpl.id
                      ? "border-brand-600 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 leading-tight">{tmpl.name}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          tmpl.recommended
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{tmpl.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-brand-700">
                      {selectedTemplate === tmpl.id ? "✓ Selected" : "Click to select"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next action button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Ready to generate an ATS-optimized, factual resume targeted for this position.
            </span>
            <button
              type="button"
              onClick={handleStartTailoring}
              disabled={isTailoring}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isTailoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Tailored ATS Resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Tailored ATS Resume Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
