import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { StructuredResume, ResumeVersionSummary, OptimizationMode } from "../types";
import { ResumeEditor } from "../components/resume/ResumeEditor";
import { ResumePreview } from "../components/resume/ResumePreview";
import {
  Save,
  Download,
  FileText,
  ArrowLeft,
  Loader2,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";

export const ResumeEditorPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<ResumeVersionSummary | null>(null);
  const [resumeData, setResumeData] = useState<StructuredResume | null>(null);
  const [templateSlug, setTemplateSlug] = useState<string>("modern");
  const [zoom, setZoom] = useState<number>(0.9);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live ATS scoring state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateMessage, setRecalculateMessage] = useState<string | null>(null);

  // Better version modal state
  const [isBetterModalOpen, setIsBetterModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<OptimizationMode>("aggressive_keywords");
  const [isGeneratingBetter, setIsGeneratingBetter] = useState(false);
  const [betterError, setBetterError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      if (!versionId) return;
      try {
        const res = await apiClient.getVersion(versionId);
        setVersion(res.data.version);
        setResumeData(res.data.version.content);
        setTemplateSlug(res.data.version.templateSlug || "modern");
      } catch (err) {
        console.error("Failed to load version:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersion();
  }, [versionId]);

  const handleSave = async () => {
    if (!versionId || !resumeData) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.updateVersion(versionId, {
        content: resumeData,
        templateSlug
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculateScore = async () => {
    if (!versionId || !resumeData) return;
    setIsRecalculating(true);
    setRecalculateMessage(null);
    try {
      const res = await apiClient.recalculateScore(versionId, { content: resumeData });
      setVersion((prev) =>
        prev
          ? {
              ...prev,
              atsScore: res.data.atsScore.overallScore,
              scoreBreakdown: res.data.atsScore,
              keywords: res.data.keywords
            }
          : null
      );
      setRecalculateMessage(`Updated: ${res.data.atsScore.overallScore}%`);
      setTimeout(() => setRecalculateMessage(null), 3500);
    } catch (err) {
      console.error("Failed to recalculate score:", err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleGenerateBetter = async () => {
    if (!version) return;
    setIsGeneratingBetter(true);
    setBetterError(null);
    try {
      const res = await apiClient.generateBetterVersion(version.id, {
        optimizationMode: selectedMode
      });
      setIsBetterModalOpen(false);
      navigate(`/editor/${res.data.versionId}`);
    } catch (err: any) {
      setBetterError(err.response?.data?.error || "Failed to generate version.");
    } finally {
      setIsGeneratingBetter(false);
    }
  };

  if (isLoading || !resumeData || !version) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading Resume Split-Editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 overflow-hidden">
      {/* Top Editor Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            to={`/tailor/${version.id}`}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            title="Back to Review"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-none">{version.versionName}</h2>
            <span className="text-[11px] text-slate-500">Live Split-Screen Editor & ATS Preview</span>
          </div>
        </div>

        {/* Template Selector & Zoom */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-semibold hidden md:inline">Template:</span>
            <select
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs"
            >
              <option value="executive_classic">⭐ Executive Classic (Harvard ATS)</option>
              <option value="modern">Modern ATS</option>
              <option value="classic">Classic ATS</option>
              <option value="technical">Technical</option>
              <option value="fresh_graduate">Fresh Graduate</option>
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-1 border-l border-slate-200 pl-3">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 text-slate-400 hover:text-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
              className="p-1 text-slate-400 hover:text-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ATS Score & Live Recalculate */}
          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-2 sm:pl-3">
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 hidden xl:inline">ATS:</span>
              <span
                className={`text-xs font-black px-1.5 py-0.5 rounded ${
                  version.atsScore >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : version.atsScore >= 65
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {version.atsScore}%
              </span>
              {recalculateMessage && (
                <span className="text-[10px] font-bold text-emerald-600 animate-pulse hidden sm:inline">
                  {recalculateMessage}
                </span>
              )}
            </div>

            <button
              onClick={handleRecalculateScore}
              disabled={isRecalculating}
              title="Recalculate ATS Score based on current edits"
              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-1 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isRecalculating ? "Scoring..." : "Check Score"}</span>
            </button>
          </div>

          {/* Better Version, Save & Export */}
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-2 sm:pl-3">
            <button
              onClick={() => setIsBetterModalOpen(true)}
              title="Generate a higher ATS-scoring or alternative version"
              className="inline-flex items-center space-x-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Better Version</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </>
              )}
            </button>

            <a
              href={apiClient.getPdfExportUrl(version.resumeId, version.id, templateSlug)}
              download
              className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-slate-100">
        {/* Left Pane: Interactive Editor */}
        <div className="p-3 sm:p-5 overflow-hidden flex flex-col h-full border-r border-slate-200 bg-white">
          <ResumeEditor
            resume={resumeData}
            onChange={(updated) => setResumeData(updated)}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        {/* Right Pane: Live ATS Preview */}
        <div className="p-4 sm:p-8 overflow-y-auto flex justify-center items-start bg-slate-200/70 h-full">
          <ResumePreview resume={resumeData} templateSlug={templateSlug} zoom={zoom} />
        </div>
      </div>

      {/* Generate Better Version Modal */}
      {isBetterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
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
                <span>AI Version Synthesizer</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Generate Better / Alternative Version
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Target Role: <strong>{version.targetRole}</strong>. Synthesizes an optimized variation of your resume with zero fabrication.
              </p>
            </div>

            {betterError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                {betterError}
              </div>
            )}

            {/* Mode Selection Cards */}
            <div className="space-y-2.5">
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
                  onClick={() => !isGeneratingBetter && setSelectedMode(mode.id)}
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
                    disabled={isGeneratingBetter}
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBetterModalOpen(false)}
                disabled={isGeneratingBetter}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateBetter}
                disabled={isGeneratingBetter}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isGeneratingBetter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Version...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Version</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

