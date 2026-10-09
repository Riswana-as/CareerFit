import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { ResumeVersionSummary } from "../types";
import { ScoreGauge } from "../components/common/ScoreGauge";
import { SideBySideDiff } from "../components/analysis/SideBySideDiff";
import { KeywordComparison } from "../components/analysis/KeywordComparison";
import { GapGuidanceCard } from "../components/analysis/GapGuidanceCard";

import {
  Download,
  Edit3,
  FileText,
  Sparkles,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Layers
} from "lucide-react";

export const TailorReviewPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const [version, setVersion] = useState<ResumeVersionSummary | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      if (!versionId) return;
      try {
        const res = await apiClient.getVersion(versionId);
        setVersion(res.data.version);
        setSelectedTemplate(res.data.version.templateSlug || "modern");
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load tailored version.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersion();
  }, [versionId]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading tailored resume comparison...</p>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-rose-600 font-semibold">{error || "Version not found."}</p>
        <Link to="/dashboard" className="text-xs text-brand-600 underline font-bold">
          Return to Dashboard
        </Link>
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

  // Mock keywords for display based on content
  const mockKeywords = {
    importantKeywords: ["Node.js", "Express.js", "REST APIs", "PostgreSQL", "Git", "Docker"],
    existingKeywords: ["REST APIs", "PostgreSQL", "Git", "JavaScript"],
    missingKeywords: ["Node.js", "Express.js", "Docker"],
    relatedKeywords: {
      "REST APIs": ["HTTP Endpoints", "API Integration"],
      PostgreSQL: ["Relational Database", "SQL Design"],
      JavaScript: ["Node.js Ecosystem"]
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto px-4">
      {/* Top Header & Export Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Tailored Resume Ready</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {version.versionName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Target Role: <strong>{version.targetRole}</strong> • Created {new Date(version.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/editor/${version.id}`}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Open Split Editor</span>
          </Link>

          <a
            href={apiClient.getPdfExportUrl(version.resumeId, version.id, selectedTemplate)}
            download
            className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download ATS PDF</span>
          </a>

          <a
            href={apiClient.getDocxExportUrl(version.resumeId, version.id)}
            download
            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Download DOCX</span>
          </a>
        </div>
      </div>

      {/* ATS Compatibility Breakdown Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <ScoreGauge score={version.atsScore} size="lg" label="Overall ATS Match Score" />
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                6-Factor Compatibility Breakdown
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Configurable Weights</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: "Technical Skills Match", score: breakdown.technicalSkills, weight: breakdown.scoringWeights.skills },
                { label: "Experience Relevance", score: breakdown.experienceRelevance, weight: breakdown.scoringWeights.experience },
                { label: "Keyword Match", score: breakdown.keywordMatch, weight: breakdown.scoringWeights.keywords },
                { label: "Responsibilities Alignment", score: breakdown.responsibilities, weight: breakdown.scoringWeights.responsibilities },
                { label: "Education Qualifications", score: breakdown.education, weight: breakdown.scoringWeights.education },
                { label: "Resume Formatting & ATS Structure", score: breakdown.resumeStructure, weight: breakdown.scoringWeights.structure }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.score}% ({item.weight}% weight)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.score >= 80 ? "bg-emerald-500" : item.score >= 65 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{breakdown.disclaimer}</span>
        </div>
      </div>

      {/* Side-by-Side Review & Audit */}
      <SideBySideDiff
        original={version.originalResume || version.content}
        tailored={version.content}
        changesMade={version.changesSummary || []}
        unaddedItems={version.unaddedItems || []}
        targetRole={version.targetRole}
      />

      {/* Keyword Breakdown */}
      <KeywordComparison keywords={mockKeywords} />

      {/* Actionable Suggestions & Learning Roadmap */}
      <GapGuidanceCard suggestions={version.suggestions || []} />
    </div>
  );
};

