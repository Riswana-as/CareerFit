import React, { useState } from "react";
import { JobApplication, ApplicationStatus } from "../../types";
import { Briefcase, Calendar, FileText, MoreVertical, Plus, ExternalLink, Trash2 } from "lucide-react";

interface ApplicationKanbanProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  onOpenCreateModal: () => void;
}

const STAGES: { key: ApplicationStatus; label: string; color: string; badgeColor: string }[] = [
  { key: "saved", label: "Saved", color: "border-slate-300", badgeColor: "bg-slate-100 text-slate-700" },
  { key: "applied", label: "Applied", color: "border-blue-400", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "shortlisted", label: "Shortlisted", color: "border-purple-400", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "interview", label: "Interviewing", color: "border-amber-400", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "offer", label: "Offer Received", color: "border-emerald-400", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "rejected", label: "Archived", color: "border-rose-300", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" }
];

export const ApplicationKanban: React.FC<ApplicationKanbanProps> = ({
  applications,
  onStatusChange,
  onDelete,
  onOpenCreateModal
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = applications.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by company or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm max-w-sm focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Application</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageApps = filtered.filter((app) => app.status === stage.key);
          return (
            <div
              key={stage.key}
              className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[220px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                <span>{stage.label}</span>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards in this stage */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                {stageApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{app.position}</h4>
                        <p className="text-slate-600 text-[11px] font-medium mt-0.5">{app.company}</p>
                      </div>
                      <button
                        onClick={() => onDelete(app.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Delete application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {app.interview_date && (
                      <div className="flex items-center space-x-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Interview: {app.interview_date}</span>
                      </div>
                    )}

                    {app.version_name && (
                      <div className="flex items-center space-x-1 text-[11px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md font-medium truncate">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{app.version_name}</span>
                      </div>
                    )}

                    {app.notes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2">{app.notes}</p>
                    )}

                    {/* Change Status Dropdown */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Move to:</span>
                      <select
                        value={app.status}
                        onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="text-[11px] bg-slate-50 border border-slate-200 rounded p-1 font-medium text-slate-700"
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {stageApps.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
