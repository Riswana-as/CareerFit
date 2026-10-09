import React from "react";
import { MatchStatus } from "../../types";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

export const MatchBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  switch (status) {
    case "strong":
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strong Match</span>
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Partial Match</span>
        </span>
      );
    case "missing":
      return (
        <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Missing / Gap</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Needs Review</span>
        </span>
      );
  }
};
