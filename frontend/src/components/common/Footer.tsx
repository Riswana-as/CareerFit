import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>Factual Integrity Guarantee:</strong> CareerFit AI strictly optimizes authentic experience without fabricating unearned skills or credentials.
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>ATS Engine v2.4</span>
          </span>
          <span>•</span>
          <span>© 2026 CareerFit AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
