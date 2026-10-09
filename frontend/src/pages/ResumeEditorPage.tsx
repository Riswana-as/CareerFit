import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { StructuredResume, ResumeVersionSummary } from "../types";
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
  Sparkles
} from "lucide-react";

export const ResumeEditorPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const [version, setVersion] = useState<ResumeVersionSummary | null>(null);
  const [resumeData, setResumeData] = useState<StructuredResume | null>(null);
  const [templateSlug, setTemplateSlug] = useState<string>("modern");
  const [zoom, setZoom] = useState<number>(0.9);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
              <option value="classic">Classic ATS</option>
              <option value="modern">Modern ATS</option>
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

          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
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
    </div>
  );
};

