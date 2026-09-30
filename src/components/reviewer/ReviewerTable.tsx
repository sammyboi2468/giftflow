"use client";

import { useState } from "react";
import { GiftRequest, User } from "@prisma/client";
import { CheckSquare, Building2, Calendar, Tag } from "lucide-react";
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

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No applications are waiting for review at this stage.
      </div>
    );
  }

  return (
    <>
      {/* ───────── Tablet / desktop: table (md and up) ───────── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Application Details</th>
              <th className="px-4 py-3">Submitted By</th>
              <th className="px-4 py-3">Type & Value</th>
              <th className="px-4 py-3">Current Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {applications.map((app) => (
              <tr key={app.id} className="transition-colors hover:bg-slate-50/80">
                {/* Application Details */}
                <td className="max-w-[16rem] px-4 py-4 font-medium text-slate-900">
                  <div className="break-words text-sm font-semibold text-slate-900">
                    {app.title || "Untitled Gift Application"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">Donor: {app.donorName || "N/A"}</span>
                  </div>
                </td>

                {/* Submitted By */}
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-800">{app.user?.name || "Unknown User"}</div>
                  <div className="text-[11px] text-slate-500">
                    {app.user?.department || app.department || "N/A"}
                  </div>
                </td>

                {/* Type & Value */}
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-900">
                    {formatCurrency(app.amount, app.currency)}
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                    <span>{app.giftType || "Gift"}</span>
                  </div>
                </td>

                {/* Current Status Badge */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center whitespace-nowrap rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-[#5D5CFF] ring-1 ring-inset ring-indigo-500/10">
                    {formatStatusLabel(app.status)}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>Updated {formatDate(app.updatedAt)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenReview(app)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#5D5CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4c4be6]"
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

      {/* ───────── Phones: card list (below md) ───────── */}
      <ul className="space-y-3 md:hidden">
        {applications.map((app) => (
          <li
            key={app.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Title, donor, status */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-900">
                  {app.title || "Untitled Gift Application"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">Donor: {app.donorName || "N/A"}</span>
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-[#5D5CFF] ring-1 ring-inset ring-indigo-500/10">
                {formatStatusLabel(app.status)}
              </span>
            </div>

            {/* Submitter + value */}
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Submitted by
                </dt>
                <dd className="truncate font-medium text-slate-800">
                  {app.user?.name || "Unknown User"}
                </dd>
                <dd className="truncate text-[11px] text-slate-500">
                  {app.user?.department || app.department || "N/A"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Value
                </dt>
                <dd className="font-bold text-slate-900">
                  {formatCurrency(app.amount, app.currency)}
                </dd>
                <dd className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Tag className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  <span className="truncate">{app.giftType || "Gift"}</span>
                </dd>
              </div>
            </dl>

            {/* Footer: date + action */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                Updated {formatDate(app.updatedAt)}
              </span>
              <button
                onClick={() => handleOpenReview(app)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#5D5CFF] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4c4be6]"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Process Review
              </button>
            </div>
          </li>
        ))}
      </ul>

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