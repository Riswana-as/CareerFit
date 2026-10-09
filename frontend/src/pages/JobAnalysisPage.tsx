import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { ExtractedJobDescription, ResumeRecord } from "../types";
import { Target, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Loader2, FileText } from "lucide-react";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [analyzedJob, setAnalyzedJob] = useState<ExtractedJobDescription | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleLoadSampleJob = () => {
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
        manualRole: manualRole || analyzedJob.detectedRole
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
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Step 2 of 3</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enter Target Job Description</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Paste the job posting you want to target. CareerFit AI detects the job role, required skills, 
          and qualifications to align your authentic experience.
        </p>
      </div>

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
              Upload Resume
            </button>
          </div>
        )}
      </div>

      {/* Job Description Input Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900">Job Posting Text</label>
          <button
            type="button"
            onClick={handleLoadSampleJob}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Load Sample Backend Developer Job
          </button>
        </div>

        <textarea
          rows={10}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Paste full job description, qualifications, and responsibilities here..."
          className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white leading-relaxed"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title (Optional override)</label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Senior Backend Developer"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company (Optional)</label>
            <input
              type="text"
              value={manualCompany}
              onChange={(e) => setManualCompany(e.target.value)}
              placeholder="e.g. Acme Cloud Corp"
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
              <span>Analyzing Job Description & Detecting Role...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Analyze Job Requirements</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analyzedJob && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detected Target Job Role
              </span>
              <div className="flex items-center space-x-3 mt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{analyzedJob.detectedRole}</h3>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {analyzedJob.roleConfidence}% Confidence
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Manual Role Edit:</label>
              <input
                type="text"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg max-w-[180px]"
              />
            </div>
          </div>

          {/* Extracted requirements grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                Required Technical Skills ({analyzedJob.requiredSkills.length})
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
                Preferred Skills ({analyzedJob.preferredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analyzedJob.preferredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Next action button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleStartTailoring}
              disabled={isTailoring}
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
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

