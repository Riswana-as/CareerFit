import React from "react";
import { AISuggestion } from "../../types";
import { Lightbulb, BookOpen, AlertCircle } from "lucide-react";

export const GapGuidanceCard: React.FC<{ suggestions: AISuggestion[] }> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-base text-slate-900">
          Actionable Resume & Skill Improvement Suggestions
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((sugg) => (
          <div
            key={sugg.id}
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              sugg.type === "gap_warning"
                ? "bg-amber-50/50 border-amber-200 text-amber-900"
                : "bg-blue-50/50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="capitalize flex items-center space-x-1">
                {sugg.type === "gap_warning" ? (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                ) : (
                  <BookOpen className="w-4 h-4 text-blue-600" />
                )}
                <span>Section: {sugg.section}</span>
              </span>
            </div>
            <p className="font-semibold">{sugg.content}</p>
            <p className="text-slate-600 text-[11px]">{sugg.reason}</p>
            {sugg.actionableStep && (
              <div className="mt-2 p-2 bg-white/80 rounded-lg border border-slate-200/80 text-slate-800 font-medium">
                👉 {sugg.actionableStep}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
