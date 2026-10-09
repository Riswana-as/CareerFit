import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { JobApplication, ApplicationStatus } from "../types";
import { ApplicationKanban } from "../components/tracker/ApplicationKanban";
import { ApplicationModal } from "../components/tracker/ApplicationModal";
import { Loader2 } from "lucide-react";

export const ApplicationTrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await apiClient.listApplications();
      setApplications(res.data.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await apiClient.updateApplication(id, { status: newStatus });
      fetchApplications();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this job application from tracker?")) {
      try {
        await apiClient.deleteApplication(id);
        fetchApplications();
      } catch (err) {
        alert("Failed to delete application.");
      }
    }
  };

  const handleCreate = async (data: any) => {
    await apiClient.createApplication(data);
    fetchApplications();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Job Application Tracker</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Track interviews, offers, and associated resume versions across every prospective employer.
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        </div>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onOpenCreateModal={() => setIsModalOpen(true)}
        />
      )}

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

