import React, { useState } from "react";
import { ApplicationStatus } from "../../types";
import { X } from "lucide-react";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    company: string;
    position: string;
    jobUrl?: string;
    appliedDate?: string;
    status: ApplicationStatus;
    interviewDate?: string;
    notes?: string;
  }) => Promise<void>;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [interviewDate, setInterviewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !position) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        company,
        position,
        jobUrl: jobUrl || undefined,
        appliedDate,
        status,
        interviewDate: interviewDate || undefined,
        notes: notes || undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-bold text-base text-slate-900">Track Job Application</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Stripe, Acme Corp"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title / Role *</label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Backend Developer"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview Scheduled</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Archived</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Applied</label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interview Date (optional)</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Salary range, referral contact, recruiter notes..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
