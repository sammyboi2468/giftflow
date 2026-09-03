import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DepartmentResponseForm from "@/components/departmentResponseform";
import {
  ArrowLeft,
  Building2,
  FileText,
  Download,
  Calendar,
  User,
  History,
} from "lucide-react";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ActivityLogUser {
  name?: string | null;
}

interface ActivityLogItem {
  id: string;
  createdAt: Date;
  action?: string | null;
  description?: string | null;
  message?: string | null;
  performedBy?: string | null;
  user?: ActivityLogUser | null;
}

export default async function DepartmentRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Querying using standard Prisma db instance
  const request = await db.giftRequest.findUnique({
    where: { id },
    include: {
      user: true,
      documents: true,
      activityLogs: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // Type assertion through explicit interface instead of 'any'
  const activityLogs = (request.activityLogs ?? []) as unknown as ActivityLogItem[];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 font-sans">
      {/* Back Button */}
      <div>
        <Link
          href="/reviewer/department"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#5D5CFF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Department List
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-[#5D5CFF] mb-2">
              <Building2 className="h-3.5 w-3.5" />
              Department Response Required
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              {request.title || "Gift Request Application"}
            </h1>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Calendar className="h-3.5 w-3.5" />
              <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <User className="h-3.5 w-3.5" />
              <span>{request.user?.name || "Applicant"}</span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Donor Name
            </span>
            <span className="font-semibold text-slate-800">
              {request.donorName || "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Department
            </span>
            <span className="font-semibold text-slate-800">
              {request.department || "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Gift Amount
            </span>
            <span className="font-semibold text-slate-800">
              {request.amount
                ? `${request.currency || "NGN"} ${request.amount.toLocaleString()}`
                : "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Status
            </span>
            <span className="font-semibold text-amber-700">
              {String(request.status).replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Official Decision Extract Document */}
      {request.decisionExtractUrl && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#5D5CFF] text-white rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950">
                Official Decision Extract Attached
              </h4>
              <p className="text-[11px] text-indigo-700">
                Review this document before submitting the final departmental response.
              </p>
            </div>
          </div>
          <a
            href={request.decisionExtractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 hover:bg-indigo-100 text-[#5D5CFF] rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download Extract
          </a>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Purpose & Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Purpose & Context
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed">
              <p>{request.purpose || "No purpose details provided."}</p>
            </div>
          </div>

          {/* Audit Trail / Activity Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-[#5D5CFF]" />
                Audit Trail & Activity Log
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {activityLogs.length} events
              </span>
            </div>

            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{log.user?.name || log.performedBy || "System Event"}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {log.action || log.description || log.message || "Status updated"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center italic">
                No activity records logged for this application yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Department Response Form */}
        <div className="lg:col-span-1">
          <DepartmentResponseForm applicationId={request.id} />
        </div>
      </div>
    </div>
  );
}