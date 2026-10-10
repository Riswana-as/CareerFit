import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import {
  FileText,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  Layers
} from "lucide-react";
import { ScoreGauge } from "../components/common/ScoreGauge";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.getDashboardAnalytics();
        setData(res.data.stats);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const stats = data || {
    currentResume: null,
    atsScore: 84,
    applications: { total: 17, applied: 12, interviews: 4, offers: 1 },
    targetRoles: ["Backend Developer", "Frontend Developer", "Full Stack Developer"],
    recentVersions: []
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            CareerFit AI Control Center
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome, {user?.fullName || "Riswana"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 max-w-xl leading-relaxed">
            Your truthful ATS optimization hub. Analyze target job descriptions, eliminate keyword gaps, 
            and track your real employment outcomes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/jobs/new"
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Tailored Resume</span>
          </Link>
          <Link
            to="/resumes/upload"
            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Resume</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Your Resume Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Resume</span>
              <FileText className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">
              {stats.currentResume?.title || "Primary Resume"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Updated: {stats.currentResume?.updated_at ? new Date(stats.currentResume.updated_at).toLocaleDateString() : "Today"}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/tailor/latest"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View Latest Tailored</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-sm font-extrabold text-emerald-600">{stats.atsScore}% ATS</span>
          </div>
        </div>

        {/* Target Roles Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Roles</span>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {stats.targetRoles.map((role: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-purple-50 text-purple-800 border border-purple-200 text-xs px-2.5 py-1 rounded-md font-semibold"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link to="/jobs/new" className="text-xs text-brand-600 hover:underline font-semibold flex items-center space-x-1">
              <span>Analyze new target role</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Applications Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Applications</span>
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="bg-blue-50/70 p-2 rounded-xl">
                <span className="block text-xl font-extrabold text-blue-700">{stats.applications.applied}</span>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Applied</span>
              </div>
              <div className="bg-amber-50/70 p-2 rounded-xl">
                <span className="block text-xl font-extrabold text-amber-700">{stats.applications.interviews}</span>
                <span className="text-[10px] text-amber-600 font-bold uppercase">Interviews</span>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-xl">
                <span className="block text-xl font-extrabold text-emerald-700">{stats.applications.offers}</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Offers</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link to="/applications" className="text-xs text-brand-600 hover:underline font-semibold flex items-center space-x-1">
              <span>View application tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ATS Score Gauge Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
          <ScoreGauge score={stats.atsScore} label="Current Average ATS Score" />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {[
            { label: "Upload Resume", path: "/resumes/upload", icon: PlusCircle, color: "text-blue-600 bg-blue-50" },
            { label: "Create Tailored", path: "/jobs/new", icon: Sparkles, color: "text-emerald-600 bg-emerald-50" },
            { label: "Analyze Job", path: "/jobs/new", icon: Target, color: "text-purple-600 bg-purple-50" },
            { label: "View Resumes", path: "/resumes", icon: FileText, color: "text-amber-600 bg-amber-50" },
            { label: "View Matches", path: "/jobs/new", icon: Layers, color: "text-teal-600 bg-teal-50" },
            { label: "Track Apps", path: "/applications", icon: Briefcase, color: "text-rose-600 bg-rose-50" }
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <Link
                key={idx}
                to={act.path}
                className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-xs transition-all flex flex-col items-center text-center space-y-2 group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-brand-600">{act.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Resume Versions Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Recent Resume Versions</h3>
            <p className="text-xs text-slate-500">Every tailored iteration preserves factual history</p>
          </div>
          <Link to="/resumes" className="text-xs text-brand-600 hover:underline font-bold">
            View All Resumes
          </Link>
        </div>

        {stats.recentVersions && stats.recentVersions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentVersions.map((v: any) => (
              <div key={v.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900">{v.version_name}</h4>
                  <p className="text-slate-500">Target Role: {v.target_role} • Created {new Date(v.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    ATS: {v.ats_score}%
                  </span>
                  <Link
                    to={`/tailor/${v.id}`}
                    className="inline-flex items-center space-x-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-xs transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Review Tailored ATS</span>
                  </Link>
                  <Link
                    to={`/editor/${v.id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl font-semibold transition-colors"
                  >
                    Split Editor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              No tailored versions generated yet. Upload your resume and paste a job description!
            </p>
            <Link
              to="/resumes/upload"
              className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <span>Upload Resume Now</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

