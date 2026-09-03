"use client";

import { useState } from "react";
import { GiftRequest, User } from "@prisma/client";
import { ExternalLink, CheckSquare, Building2, Calendar, Tag } from "lucide-react";
import ReviewModal from "./reviewmodal";

export type ApplicationWithUser = GiftRequest & {
  user: Pick<User, "name" | "email" | "department">;
};

interface ReviewerTableProps {
  applications: ApplicationWithUser[];
  currentStage: string;
}

export default function ReviewerTable({ applications, currentStage }: ReviewerTableProps) {
  const [selectedApp, setSelectedApp] = useState<ApplicationWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReview = (app: ApplicationWithUser) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "—";
    const curr = currency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStatusLabel = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Application Details</th>
              <th className="py-3 px-4">Submitted By</th>
              <th className="py-3 px-4">Type & Value</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Application Details */}
                <td className="py-4 px-4 font-medium text-slate-900">
                  <div className="font-semibold text-slate-900 text-sm">
                    {app.title || "Untitled Gift Application"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[11px]">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    <span>Donor: {app.donorName || "N/A"}</span>
                  </div>
                </td>

                {/* Submitted By */}
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-800">{app.user?.name || "Unknown User"}</div>
                  <div className="text-[11px] text-slate-500">{app.user?.department || app.department || "N/A"}</div>
                </td>

                {/* Type & Value */}
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-900">
                    {formatCurrency(app.amount, app.currency)}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                    <span>{app.giftType || "Gift"}</span>
                  </div>
                </td>

                {/* Current Status Badge */}
                <td className="py-4 px-4">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-[#5D5CFF] ring-1 ring-inset ring-indigo-500/10">
                    {formatStatusLabel(app.status)}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>Updated {formatDate(app.updatedAt)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenReview(app)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D5CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#4c4be6] transition-all"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Process Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review & Rejection Modal */}
      {selectedApp && (
        <ReviewModal
          applicationId={selectedApp.id}
          currentStage={currentStage}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}