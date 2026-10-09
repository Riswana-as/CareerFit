import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, FileText, Target, Eye, Download } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 py-12">
      {/* Hero */}
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict Zero-Fabrication Guarantee — 100% Truthful AI</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Tailor Your Real Resume for <span className="text-brand-600">Any Target Job</span> — Without Lying.
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Generic AI tools hallucinate fake skills and invent fake metrics that ruin interviews. 
          <strong> CareerFit AI</strong> restructures your genuine accomplishments, eliminates keyword gaps, 
          and optimizes ATS readability while strictly preserving factual accuracy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md transition-all"
          >
            <span>Start Free Optimization</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-slate-700 hover:text-slate-900 font-semibold text-base border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            <span>View Demo Account</span>
          </Link>
        </div>
      </section>

      {/* Trust & Comparison Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">
            How CareerFit AI Protects Your Career
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-rose-800 text-base flex items-center space-x-2">
                <span>❌ Other Generic AI Builders</span>
              </h3>
              <ul className="space-y-3 text-xs text-rose-900">
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Fabricates Technologies:</strong> Secretly inserts missing tools like Docker or AWS even if you never touched them.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Fakes Quantifiable Metrics:</strong> Invents fake phrases like "increased revenue by 84%".</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Destroys Trust:</strong> Causes embarrassing interview disqualifications when quizzed on fake skills.</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-emerald-800 text-base flex items-center space-x-2">
                <span>✓ CareerFit AI Engine</span>
              </h3>
              <ul className="space-y-3 text-xs text-emerald-900">
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Highlights True Experience:</strong> Elevates authentic projects and relevant duties for the target role.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Identifies Real Gaps:</strong> Clearly lists missing requirements as actionable learning roadmaps.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span><strong>Verified ATS Compatibility:</strong> Generates clean vector PDFs and Word DOCX files compliant with parsing algorithms.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Workflow */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-900 text-center mb-10">
          The 4-Step ATS Optimization Journey
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Upload Resume", desc: "Extract structured data from PDF, DOCX, or text while preserving original files.", icon: FileText },
            { step: "02", title: "Analyze Job", desc: "Detect target role and extract mandatory vs preferred requirements.", icon: Target },
            { step: "03", title: "Tailor & Audit", desc: "Reorder skills, enhance action verbs, and inspect side-by-side diff with gap guidance.", icon: Sparkles },
            { step: "04", title: "Review & Export", desc: "Tweak in live split editor, pick from 4 ATS templates, and export PDF or DOCX.", icon: Download }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-black text-sm">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

