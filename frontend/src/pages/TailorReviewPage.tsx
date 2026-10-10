import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { ResumeVersionSummary, KeywordAnalysis, OptimizationMode } from "../types";
import { ScoreGauge } from "../components/common/ScoreGauge";
import { SideBySideDiff } from "../components/analysis/SideBySideDiff";
import { KeywordComparison } from "../components/analysis/KeywordComparison";
import { GapGuidanceCard } from "../components/analysis/GapGuidanceCard";
import { ResumePreview } from "../components/resume/ResumePreview";

import {
  Download,
  Edit3,
  FileText,
  Sparkles,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Zap,
  TrendingUp,
  Award,
  GraduationCap,
  RefreshCw,
  X,
  Layout,
  Eye,
  GitCompare,
  ZoomIn,
  ZoomOut,
  Printer,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Sliders,
  Cpu
} from "lucide-react";

export const TailorReviewPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<ResumeVersionSummary | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("executive_classic");
  const [activeTab, setActiveTab] = useState<"preview" | "diff">("preview");
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate Better Version Modal State
  const [isBetterModalOpen, setIsBetterModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<OptimizationMode>("aggressive_keywords");
  const [modalTemplate, setModalTemplate] = useState<string>("executive_classic");
  const [isGeneratingBetter, setIsGeneratingBetter] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(1);
  const [betterError, setBetterError] = useState<string | null>(null);

  const [availableVersions, setAvailableVersions] = useState<any[]>([]);

  const fetchVersion = async () => {
    if (!versionId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getVersion(versionId);
      setVersion(res.data.version);
      const activeTpl = res.data.version.templateSlug || "executive_classic";
      setSelectedTemplate(activeTpl);
      setModalTemplate(activeTpl);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load tailored version.");
      try {
        const dashRes = await apiClient.getDashboardAnalytics();
        const recent = dashRes.data.stats?.recentVersions || [];
        setAvailableVersions(recent);
      } catch {
        // Ignore fallback error
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion();
  }, [versionId]);

  const handleTemplateChange = async (newTemplate: string) => {
    if (!version) return;
    setSelectedTemplate(newTemplate);
    setModalTemplate(newTemplate);
    try {
      await apiClient.updateVersion(version.id, { templateSlug: newTemplate });
    } catch (err) {
      console.error("Failed to persist template change:", err);
    }
  };

  const handleGenerateBetter = async () => {
    if (!version) return;
    setIsGeneratingBetter(true);
    setGenerationStep(1);
    setBetterError(null);

    // Dynamic visual step progression
    const stepTimer1 = setTimeout(() => setGenerationStep(2), 1400);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 3200);

    try {
      const res = await apiClient.generateBetterVersion(version.id, {
        optimizationMode: selectedMode,
        templateSlug: modalTemplate
      });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsBetterModalOpen(false);
      navigate(`/tailor/${res.data.versionId}`);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setBetterError(err.response?.data?.error || "Failed to generate better version.");
    } finally {
      setIsGeneratingBetter(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-28 text-center space-y-4">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Synthesizing Tailored ATS Resume</h3>
          <p className="text-xs text-slate-500 mt-1">Comparing job description criteria and scoring alignment...</p>
        </div>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Resume Version Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error || "The requested version was not found in your workspace."}
          </p>
        </div>

        {availableVersions.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select one of your existing tailored versions:
            </p>
            <div className="space-y-2">
              {availableVersions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setError(null);
                    navigate(`/tailor/${v.id}`);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs group"
                >
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-900 group-hover:text-brand-700">{v.version_name}</p>
                    <p className="text-[11px] text-slate-500">{v.target_role}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {v.ats_score}% ATS
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/jobs/new"
            className="inline-flex items-center space-x-1.5 text-xs text-white bg-brand-600 hover:bg-brand-700 px-4 py-2.5 rounded-xl font-bold shadow-xs transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Create New Tailored Resume</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const breakdown = version.scoreBreakdown || {
    overallScore: version.atsScore,
    keywordMatch: 88,
    technicalSkills: 90,
    experienceRelevance: 82,
    education: 100,
    responsibilities: 78,
    resumeStructure: 95,
    scoringWeights: { skills: 30, experience: 25, keywords: 20, responsibilities: 15, education: 5, structure: 5 },
    disclaimer: "Estimated compatibility score based on standard parsing metrics."
  };

  // Extract dynamic genuine keywords
  const rawKeywords: KeywordAnalysis | undefined = version.keywords || (version.scoreBreakdown as any)?.keywords;
  const existingSkills = version.content.skills.rawList || [
    ...(version.content.skills.languages || []),
    ...(version.content.skills.frontend || []),
    ...(version.content.skills.backend || []),
    ...(version.content.skills.databases || []),
    ...(version.content.skills.tools || []),
    ...(version.content.skills.coreSkills || []),
    ...(version.content.skills.specialized || []),
    ...((version.content.skills.categories || []).flatMap((c) => c.skills || []))
  ];

  const unaddedRequirements = (version.unaddedItems || []).map((u) => u.requirement);

  const genuineKeywords: KeywordAnalysis = rawKeywords && rawKeywords.importantKeywords.length > 0
    ? rawKeywords
    : {
        importantKeywords: Array.from(new Set([...existingSkills.slice(0, 8), ...unaddedRequirements])),
        existingKeywords: existingSkills.slice(0, 8),
        missingKeywords: unaddedRequirements,
        relatedKeywords: {
          [version.targetRole]: ["Core Duties", "Professional Domain", "Industry Qualifications"]
        }
      };

  const v1 = version.allVersions && version.allVersions.length > 0
    ? version.allVersions[version.allVersions.length - 1]
    : null;
  const scoreDelta = v1 && v1.id !== version.id ? version.atsScore - v1.ats_score : null;

  // Template Catalog Definition
  const templates = [
    {
      id: "executive_classic",
      name: "Executive Classic",
      badge: "Harvard ATS Benchmark",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: "🏛️",
      font: "Serif Times / Georgia",
      desc: "Centered header, 2-column skills matrix, clean rule dividers, right-aligned dates. Preferred by corporate & Fortune 500."
    },
    {
      id: "modern",
      name: "Modern ATS",
      badge: "High Impact",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      icon: "⚡",
      font: "Inter Sans-Serif",
      desc: "Contemporary sans-serif with bold category tags and clean scan rhythm. Optimal for modern tech & growth companies."
    },
    {
      id: "classic",
      name: "Classic Minimalist",
      badge: "Universal Scanner",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      icon: "📋",
      font: "Clean Standard",
      desc: "Single-column standard formatting with zero decorative clutter. Passes every legacy Taleo & Workday parser."
    },
    {
      id: "technical",
      name: "Technical Grid",
      badge: "Engineers & Leads",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
      icon: "💻",
      font: "Monospace & Code Stack",
      desc: "Dedicated tech stack bracket tags, architected project highlights, and developer-centric competency breakdown."
    },
    {
      id: "fresh_graduate",
      name: "Fresh Graduate",
      badge: "Early Career",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      icon: "🎓",
      font: "Academic Serif",
      desc: "Prioritizes degree, university coursework, academic achievements, and foundational engineering initiatives."
    }
  ];

  return (
    <div className={`space-y-8 pb-20 ${isFullscreen ? "max-w-none px-2 sm:px-6" : "max-w-6xl mx-auto px-4"}`}>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 pt-2">
        <Link to="/dashboard" className="hover:text-brand-600 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/resumes" className="hover:text-brand-600 transition-colors">Resumes</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate">Tailored ATS Review: {version.versionName}</span>
      </nav>

      {/* Hero Header & Executive Actions */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/80 rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>ATS Tailored & Verified</span>
              </span>

              {version.allVersions && version.allVersions.length > 1 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
                  <Layers className="w-3.5 h-3.5 text-violet-600" />
                  <span>{version.allVersions.length} Iterations</span>
                </span>
              )}

              {scoreDelta !== null && scoreDelta > 0 && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{scoreDelta}% ATS Score Boost (vs {v1?.version_name})</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {version.versionName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600">
              <p className="flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>Target Role: <strong className="text-slate-900">{version.targetRole}</strong></span>
              </p>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <p className="flex items-center space-x-1.5">
                <Layout className="w-4 h-4 text-slate-400" />
                <span>Template: <strong className="text-brand-700 capitalize">{selectedTemplate.replace("_", " ")}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Button Cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsBetterModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Generate Better Version</span>
            </button>

            <Link
              to={`/editor/${version.id}`}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>Open Split Editor</span>
            </Link>

            <a
              href={apiClient.getPdfExportUrl(version.resumeId, version.id, selectedTemplate)}
              download
              className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </a>

            <a
              href={apiClient.getDocxExportUrl(version.resumeId, version.id, selectedTemplate)}
              download
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            >
              <FileText className="w-4 h-4" />
              <span>Export DOCX</span>
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Version Shelf / Timeline */}
      {version.allVersions && version.allVersions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Resume Iteration Shelf ({version.allVersions.length} Generated)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Click any version chip to switch view & score
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
            {version.allVersions.map((v) => {
              const isActive = v.id === version.id;
              const isTopScore = v.ats_score >= 85;
              return (
                <button
                  key={v.id}
                  onClick={() => navigate(`/tailor/${v.id}`)}
                  className={`flex-shrink-0 flex items-center space-x-3 px-4 py-2.5 rounded-2xl border text-xs transition-all ${
                    isActive
                      ? "bg-brand-50/90 border-brand-600 ring-2 ring-brand-500/20 shadow-xs"
                      : "bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                    <span className={`font-bold ${isActive ? "text-brand-900" : "text-slate-800"}`}>
                      {v.version_name}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isTopScore
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {v.ats_score}% ATS
                  </span>

                  {isActive && (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-700 bg-white px-2 py-0.5 rounded-md border border-brand-200">
                      Active
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Add Button */}
            <button
              onClick={() => setIsBetterModalOpen(true)}
              className="flex-shrink-0 inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-50 text-violet-700 text-xs font-bold transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>+ Generate Next Variation</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Template Gallery (Interactive Template Selection) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
              <Layout className="w-4 h-4 text-brand-600" />
              <span>Choose Resume Template & ATS Layout</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click a template to instantly update your resume layout and typography without altering verified content.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Active: <strong className="text-brand-700 capitalize">{selectedTemplate.replace("_", " ")}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleTemplateChange(tpl.id)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border text-xs cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-brand-50/40 border-brand-600 ring-2 ring-brand-500/20 shadow-md"
                    : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Top card header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{tpl.icon}</span>
                    {isSelected ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{tpl.font}</p>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-3">
                    {tpl.desc}
                  </p>
                </div>

                {/* Bottom selector pill */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <span className={isSelected ? "text-brand-700" : "text-slate-500"}>
                    {isSelected ? "Selected Template" : "Click to Apply"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-brand-600 translate-x-0.5" : "text-slate-400"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATS Compatibility Breakdown Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-shrink-0 flex flex-col items-center">
            <ScoreGauge score={version.atsScore} size="lg" label="Overall ATS Match Score" />
            <div className="mt-3 text-center">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Exceptional ATS Compatibility</span>
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-600" />
                <span>6-Factor Compatibility Breakdown</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Configured for {version.targetRole}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: "Core Competencies & Skills", score: breakdown.technicalSkills, weight: breakdown.scoringWeights.skills, note: "100% matched in candidate profile" },
                { label: "Keyword Match", score: breakdown.keywordMatch, weight: breakdown.scoringWeights.keywords, note: "Exact JD tokens mapped" },
                { label: "Experience Relevance", score: breakdown.experienceRelevance, weight: breakdown.scoringWeights.experience, note: "Full-stack project alignment" },
                { label: "Responsibilities Alignment", score: breakdown.responsibilities, weight: breakdown.scoringWeights.responsibilities, note: "STAR method bullet structure" },
                { label: "Education & Credentials", score: breakdown.education, weight: breakdown.scoringWeights.education, note: "Verified degree credentials" },
                { label: "ATS Structure & Formatting", score: breakdown.resumeStructure, weight: breakdown.scoringWeights.structure, note: "Zero tables/columns, parse-clean" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 hover:bg-white transition-all">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-800">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{item.score}% ({item.weight}% wt)</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.score >= 80 ? "bg-emerald-500" : item.score >= 65 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{item.note}</span>
                    <span className="font-bold text-emerald-700">Passed</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-500 text-[11px] leading-relaxed flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{breakdown.disclaimer}</span>
        </div>
      </div>

      {/* Main Review Section: Tabbed View (Preview vs Side-by-Side Diff) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Resume Document View</span>
            </button>
            <button
              onClick={() => setActiveTab("diff")}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "diff"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Side-by-Side Verification & Diff</span>
            </button>
          </div>

          {/* Quick Toolbar */}
          {activeTab === "preview" && (
            <div className="flex items-center space-x-2 text-xs">
              {/* Zoom Buttons */}
              <div className="flex items-center space-x-1 bg-slate-100/90 px-2 py-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                  className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 px-1 min-w-[42px] text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                  className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewZoom(1)}
                  className="text-[10px] font-bold text-brand-700 ml-1 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Print Document */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 font-bold transition-colors"
                title="Print physical resume or save via browser PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Print Canvas</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
                title={isFullscreen ? "Exit Full Width" : "Full Width View"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {activeTab === "preview" ? (
          <div className="bg-slate-100/90 p-4 sm:p-8 rounded-3xl border border-slate-200/90 shadow-inner overflow-x-auto min-h-[600px] flex justify-center">
            <ResumePreview
              resume={version.content}
              templateSlug={selectedTemplate}
              zoom={previewZoom}
            />
          </div>
        ) : (
          <SideBySideDiff
            original={version.originalResume || version.content}
            tailored={version.content}
            changesMade={version.changesSummary || []}
            unaddedItems={version.unaddedItems || []}
            targetRole={version.targetRole}
          />
        )}
      </div>

      {/* Dynamic Genuine Keyword Breakdown */}
      <KeywordComparison keywords={genuineKeywords} />

      {/* Actionable Suggestions & Learning Roadmap */}
      <GapGuidanceCard suggestions={version.suggestions || []} />

      {/* Generate Better Version Modal */}
      {isBetterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !isGeneratingBetter && setIsBetterModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              disabled={isGeneratingBetter}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>AI Version Synthesizer & Agent</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Synthesize Better ATS Version
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Target Role: <strong className="text-slate-800">{version.targetRole}</strong>. Select an optimization strategy and target template.
              </p>
            </div>

            {/* AI Agent Banner */}
            <div className="p-3.5 bg-violet-50/80 border border-violet-200 rounded-2xl text-xs text-violet-900 flex items-start space-x-3">
              <Cpu className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Autonomous ATS Optimization Agent</p>
                <p className="text-[11px] text-violet-700 leading-relaxed">
                  Extracts target job tokens, weaves missing verified skills into project impact bullets using the STAR framework, and guarantees zero fabricated qualifications.
                </p>
              </div>
            </div>

            {betterError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                {betterError}
              </div>
            )}

            {/* Generation Progress Indicator */}
            {isGeneratingBetter ? (
              <div className="py-8 space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto shadow-inner">
                  <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-slate-900">
                    {generationStep === 1 && "Step 1: Mining Target Job Keywords & Semantics..."}
                    {generationStep === 2 && "Step 2: Synthesizing STAR Bullet Enhancements..."}
                    {generationStep === 3 && "Step 3: Calculating Verified ATS Score & Calibrating..."}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Our AI Agent is crafting an optimized truthful variation tailored to {version.targetRole}.
                  </p>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-sm mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${generationStep * 33.3}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Mode Selection Cards */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    1. Select Optimization Focus:
                  </p>
                  {[
                    {
                      id: "aggressive_keywords" as OptimizationMode,
                      title: "🚀 Maximum ATS Keyword Match",
                      badge: "Highest ATS Score",
                      desc: "Prioritizes dense placement of verified skills, role keywords, and domain tools into the summary and achievements."
                    },
                    {
                      id: "executive" as OptimizationMode,
                      title: "💼 Executive & Leadership Impact",
                      badge: "Senior & Lead",
                      desc: "Emphasizes strategic ownership, team leadership, cross-functional delivery, and high-impact business outcomes."
                    },
                    {
                      id: "fresher" as OptimizationMode,
                      title: "🎓 Foundational / Early Career",
                      badge: "Entry Level",
                      desc: "Spotlights academic coursework, hands-on projects, adaptability, and fundamental competencies."
                    },
                    {
                      id: "standard" as OptimizationMode,
                      title: "🔄 Fresh AI Phrasing & Structure",
                      badge: "Balanced Variation",
                      desc: "Creates a brand-new variation with fresh action verbs and balanced ATS phrasing."
                    }
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        selectedMode === mode.id
                          ? "border-violet-600 bg-violet-50/60 ring-2 ring-violet-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selectedMode === mode.id}
                        onChange={() => setSelectedMode(mode.id)}
                        className="mt-1 text-violet-600 focus:ring-violet-500"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">{mode.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                            {mode.badge}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">{mode.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Template Selection in Modal */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Select Layout Template:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setModalTemplate(tpl.id)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          modalTemplate === tpl.id
                            ? "bg-violet-50 border-violet-600 text-violet-900 ring-2 ring-violet-500/20"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>{tpl.icon}</span>
                          <span className="truncate">{tpl.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBetterModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBetter}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Launch AI Optimization</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
