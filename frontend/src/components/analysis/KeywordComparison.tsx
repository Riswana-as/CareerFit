import React from "react";
import { KeywordAnalysis } from "../../types";
import { Check, X, Layers, Tag } from "lucide-react";

export const KeywordComparison: React.FC<{ keywords: KeywordAnalysis }> = ({ keywords }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <Tag className="w-4 h-4 text-brand-600" />
          <span>Keyword Match Analysis</span>
        </h3>
        <span className="text-xs text-slate-500">
          {keywords.existingKeywords.length} of {keywords.importantKeywords.length} matched
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Existing Keywords */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Existing in Resume ({keywords.existingKeywords.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {keywords.existingKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-rose-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <X className="w-4 h-4 text-rose-600" />
            <span>Missing Keywords ({keywords.missingKeywords.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {keywords.missingKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Related Semantic Terms */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Related Synonyms Mapped</span>
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {Object.entries(keywords.relatedKeywords).map(([key, syns], idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">{key}:</span>{" "}
                <span className="text-slate-600">{syns.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
