// components/applicant/ApplicationStatusCard.tsx
import { GiftRequest, RequestStatus } from "@prisma/client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function ApplicationStatusCard({ application }: { application: GiftRequest }) {
  const isRejected = application.status === RequestStatus.REJECTED;
  const isApproved = application.status === RequestStatus.APPROVED;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {application.title || "Untitled Application"}
          </h3>
          <p className="text-xs text-slate-500">
            Updated: {new Date(application.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
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
        {isApproved && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {isRejected && <AlertCircle className="h-4 w-4 text-rose-500" />}
        {!isApproved && !isRejected && <Clock className="h-4 w-4 text-[#5D5CFF]" />}
        <span>Status: {application.status}</span>
      </div>
    </div>
  );
}