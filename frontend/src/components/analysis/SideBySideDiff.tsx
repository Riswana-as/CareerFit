import React from "react";
import { StructuredResume, UnaddedItem } from "../../types";
import { Check, X, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

interface SideBySideDiffProps {
  original: StructuredResume;
  tailored: StructuredResume;
  changesMade: string[];
  unaddedItems: UnaddedItem[];
  targetRole: string;
}

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  original,
  tailored,
  changesMade,
  unaddedItems,
  targetRole
}) => {
  return (
    <div className="space-y-8">
      {/* Changes & Safety Audit Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Changes Made */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Optimizations Applied ({changesMade.length})</span>
          </div>
          <ul className="space-y-2 text-xs text-emerald-900">
            {changesMade.map((change, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not Added (Strict Zero-Fabrication) */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-3">
            <X className="w-5 h-5 text-rose-600" />
            <span>Skills Not Added ({unaddedItems.length} Missing Gaps)</span>
          </div>
          {unaddedItems.length === 0 ? (
            <p className="text-xs text-slate-500">All required skills were verified in your existing resume.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                Preserving Factual Truth: No Fake Skills Claimed
              </p>
              <ul className="space-y-2 text-xs text-rose-900 max-h-56 overflow-y-auto pr-1">
                {unaddedItems.map((item, idx) => (
                  <li key={idx} className="bg-white/80 p-2.5 rounded-lg border border-rose-100 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                      <span>✗</span>
                      <span>{item.requirement}</span>
                    </div>
                    <p className="text-[11px] text-rose-600">{item.reason}</p>
                    <p className="text-[11px] text-slate-600 italic">💡 {item.suggestedAction}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Content Comparison */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
          <div className="p-3.5 flex items-center justify-between">
            <span>Original Uploaded Resume</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">Source</span>
          </div>
          <div className="p-3.5 flex items-center justify-between bg-brand-50/50 text-brand-900">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Tailored ATS Resume ({targetRole})</span>
            </span>
            <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-md">Optimized</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-4 sm:p-6 text-xs text-slate-800 gap-y-6">
          {/* Summary Comparison */}
          <div className="space-y-2 pr-0 md:pr-4">
            <h4 className="font-bold text-slate-500 uppercase text-[11px]">Original Summary</h4>
            <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
              {original.summary || "No summary provided in original resume."}
            </p>
          </div>
          <div className="space-y-2 pl-0 md:pl-4">
            <h4 className="font-bold text-brand-700 uppercase text-[11px] flex items-center space-x-1">
              <span>Optimized Summary</span>
              <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Action-Oriented
              </span>
            </h4>
            <p className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-200 leading-relaxed text-slate-900 font-medium">
              {tailored.summary}
            </p>
          </div>

          {/* Skills Comparison */}
          <div className="space-y-2 pr-0 md:pr-4 pt-4">
            <h4 className="font-bold text-slate-500 uppercase text-[11px]">Original Skills</h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p>
                {(original.skills.rawList || [
                  ...(original.skills.languages || []),
                  ...(original.skills.frontend || []),
                  ...(original.skills.backend || []),
                  ...(original.skills.databases || []),
                  ...(original.skills.tools || [])
                ]).join(", ") || "None"}
              </p>
            </div>
          </div>
          <div className="space-y-2 pl-0 md:pl-4 pt-4">
            <h4 className="font-bold text-brand-700 uppercase text-[11px] flex items-center space-x-1">
              <span>Prioritized & Categorized Skills</span>
              <span className="text-[10px] font-normal text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                Job-Relevant Order
              </span>
            </h4>
            <div className="bg-brand-50/30 p-3 rounded-xl border border-brand-200 space-y-1 text-slate-900">
              {tailored.skills.languages?.length ? (
                <p><strong>Languages:</strong> {tailored.skills.languages.join(", ")}</p>
              ) : null}
              {tailored.skills.backend?.length ? (
                <p><strong>Backend:</strong> {tailored.skills.backend.join(", ")}</p>
              ) : null}
              {tailored.skills.databases?.length ? (
                <p><strong>Databases:</strong> {tailored.skills.databases.join(", ")}</p>
              ) : null}
              {tailored.skills.tools?.length ? (
                <p><strong>Tools:</strong> {tailored.skills.tools.join(", ")}</p>
              ) : null}
            </div>
          </div>

          {/* Experience Bullets Comparison */}
          <div className="space-y-2 pr-0 md:pr-4 pt-4">
            <h4 className="font-bold text-slate-500 uppercase text-[11px]">Original Experience Bullets</h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              {original.experience[0]?.responsibilities.slice(0, 3).map((bullet, idx) => (
                <p key={idx} className="text-slate-600">• {bullet}</p>
              ))}
            </div>
          </div>
          <div className="space-y-2 pl-0 md:pl-4 pt-4">
            <h4 className="font-bold text-brand-700 uppercase text-[11px] flex items-center space-x-1">
              <span>Optimized Experience Bullets</span>
              <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Strong Action Verbs
              </span>
            </h4>
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-200 space-y-2 text-slate-900 font-medium">
              {tailored.experience[0]?.responsibilities.slice(0, 3).map((bullet, idx) => (
                <p key={idx}>• {bullet}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
