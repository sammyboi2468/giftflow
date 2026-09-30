// components/applicant/ApplicationStatusCard.tsx
import { GiftRequest, RequestStatus } from "@prisma/client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function ApplicationStatusCard({ application }: { application: GiftRequest }) {
  const isRejected = application.status === RequestStatus.REJECTED;
  const isApproved = application.status === RequestStatus.APPROVED;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Title + badge: stacked on phones, side by side from sm up */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="break-words text-base font-bold text-slate-900">
            {application.title || "Untitled Application"}
          </h3>
          <p className="text-xs text-slate-500">
            Updated: {new Date(application.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold sm:self-auto ${
            isRejected
              ? "bg-rose-50 text-rose-600"
              : isApproved
              ? "bg-emerald-50 text-emerald-600"
              : "bg-indigo-50 text-[#5D5CFF]"
          }`}
        >
          {application.status}
        </span>
      </div>

      {/* Render status icon */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        {isApproved && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
        {isRejected && <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />}
        {!isApproved && !isRejected && <Clock className="h-4 w-4 shrink-0 text-[#5D5CFF]" />}
        <span className="break-words">Status: {application.status}</span>
      </div>
    </div>
  );
}