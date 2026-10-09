import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { ResumeRecord } from "../types";
import {
  FileText,
  PlusCircle,
  Copy,
  Trash2,
  Sparkles,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export const ResumeLibraryPage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchResumes = async () => {
    try {
      const res = await apiClient.listResumes();
      setResumes(res.data.resumes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.duplicateResume(id);
      fetchResumes();
    } catch (err) {
      alert("Failed to duplicate resume.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resume and its versions?")) {
      try {
        await apiClient.deleteResume(id);
        fetchResumes();
      } catch (err) {
        alert("Failed to delete resume.");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resume Library</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your source resumes, tailored iterations, and export documents.
          </p>
        </div>

        <Link
          to="/resumes/upload"
          className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New Resume</span>
        </Link>
      </div>

      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  {resume.latestAtsScore ? (
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                      ATS: {resume.latestAtsScore}%
                    </span>
                  ) : null}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{resume.title}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Added {new Date(resume.createdAt).toLocaleDateString()}</span>
                </p>

                <p className="text-xs text-slate-600">
                  <strong>{resume.versionCount || 0}</strong> tailored versions created
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleDuplicate(resume.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50"
                    title="Duplicate resume"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a
                    href={apiClient.getPdfExportUrl(resume.id)}
                    download
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50"
                    title="Download original PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <Link
                  to={`/jobs/new?resumeId=${resume.id}`}
                  className="inline-flex items-center space-x-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tailor for Job</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Resumes in Library</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your first resume in PDF, DOCX, or text format to begin targeting job openings.
          </p>
          <Link
            to="/resumes/upload"
            className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
          >
            <span>Upload Resume</span>
          </Link>
        </div>
      )}
    </div>
  );
};

