import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUploader } from "../components/resume/FileUploader";
import { ResumePreview } from "../components/resume/ResumePreview";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";

export const ResumeUploadPage: React.FC = () => {
  const [uploadedResume, setUploadedResume] = useState<{ id: string; title: string; parsedData: any } | null>(null);
  const navigate = useNavigate();

  const handleProceed = () => {
    if (uploadedResume) {
      navigate(`/jobs/new?resumeId=${uploadedResume.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Step 1 of 3</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upload Your Current Resume</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          We extract your genuine skills, experiences, and education into structured data. 
          Your original file is safely preserved and never overwritten.
        </p>
      </div>

      {!uploadedResume ? (
        <FileUploader onUploadSuccess={(data) => setUploadedResume(data)} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{uploadedResume.title}</h3>
                <p className="text-xs text-emerald-600 font-semibold">Structured JSON parsing successful</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setUploadedResume(null)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-2 border border-slate-300 rounded-xl"
              >
                Upload Different File
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all"
              >
                <span>Proceed to Target Job</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Extracted Profile Review */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Contact</span>
              <p className="font-bold text-slate-900">{uploadedResume.parsedData?.personal?.name}</p>
              <p className="text-slate-600">{uploadedResume.parsedData?.personal?.email}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Identified Skills</span>
              <p className="font-bold text-slate-900">
                {(uploadedResume.parsedData?.skills?.rawList || []).length} Technologies
              </p>
              <p className="text-slate-600 truncate">
                {(uploadedResume.parsedData?.skills?.rawList || []).slice(0, 4).join(", ")}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Experience</span>
              <p className="font-bold text-slate-900">
                {(uploadedResume.parsedData?.experience || []).length} Roles Documented
              </p>
              <p className="text-slate-600">
                {uploadedResume.parsedData?.experience[0]?.company || "Recent Work"}
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleProceed}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-8 py-3 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Continue to Step 2: Input Target Job Description</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

