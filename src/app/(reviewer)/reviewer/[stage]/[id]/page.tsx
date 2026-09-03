import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import ReviewActionForm from "@/components/reviewer/ReviewActionForm";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Building,
  Calendar,
  Paperclip,
  Download,
  DollarSign,
  Gift,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Map stage param to the NEXT target status on approval.
// Only Senate issues a Decision Extract that the department must respond
// to. Council is the final stage -- it approves directly with no extract
// and no department round-trip.
const STAGE_NEXT_STATUS_MAP: Record<string, RequestStatus> = {
  advancement: RequestStatus.SENATE_REVIEW,
  senate: RequestStatus.AWAITING_DEPARTMENT_RESPONSE,
  "senate-processing": RequestStatus.COUNCIL_REVIEW,
  council: RequestStatus.APPROVED,
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ stage: string; id: string }>;
}) {
  const { stage, id } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const normalizedStage = stage.toLowerCase();
  const nextStatus = STAGE_NEXT_STATUS_MAP[normalizedStage];

  if (!nextStatus) notFound();

  // Fetch the specific request by ID including related documents
  const application = await db.giftRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          department: true,
        },
      },
      documents: true,
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!application) notFound();

  const formattedAmount =
    application.amount !== null && application.amount !== undefined
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: application.currency || "NGN",
        }).format(application.amount)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href={`/reviewer/${stage}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#5D5CFF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {stage} applications
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{application.title}</h1>
              {application.donorName && (
                <p className="text-xs text-slate-500 mt-1">
                  Donor: <span className="font-semibold text-slate-700">{application.donorName}</span>
                </p>
              )}
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              {application.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Applicant</span>
                <strong className="text-slate-800">{application.user.name}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Department</span>
                <strong className="text-slate-800">{application.department || application.user.department || "N/A"}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Date Submitted</span>
                <strong className="text-slate-800">{new Date(application.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>

            {formattedAmount ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-semibold">Amount</span>
                  <strong className="text-emerald-700 font-bold">{formattedAmount}</strong>
                </div>
              </div>
            ) : application.giftType ? (
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-semibold">Gift Type</span>
                  <strong className="text-slate-800">{application.giftType}</strong>
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 mb-1">Purpose / Description</h3>
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {application.purpose ? (
                <p>{application.purpose}</p>
              ) : (
                <p className="text-slate-400 italic">No purpose or description was specified for this request.</p>
              )}
            </div>
          </div>

          {/* Supporting Documents Section */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Supporting Documents</h3>
            {application.documents && application.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {application.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-[#5D5CFF] shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {doc.docType ? doc.docType.replace(/_/g, " ") : doc.fileName || "Document"}
                      </span>
                    </div>
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-700 shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                No uploaded files attached.
              </p>
            )}
          </div>

          {application.decisionExtractUrl && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-950 font-medium">
                <Paperclip className="h-4 w-4 text-[#5D5CFF]" />
                <span>Senate Decision Extract Attached</span>
              </div>
              <a
                href={application.decisionExtractUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#5D5CFF] hover:underline flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> View File
              </a>
            </div>
          )}

          {(application.departmentResponse || application.departmentAttachment) && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950">Department Response</h4>
              {application.departmentResponse && (
                <p className="text-emerald-900 leading-relaxed">{application.departmentResponse}</p>
              )}
              {application.departmentAttachment && (
                <a
                  href={application.departmentAttachment}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-800 font-semibold underline hover:text-emerald-950 pt-1"
                >
                  <FileText className="h-4 w-4 text-emerald-700" />
                  View Department Attachment
                </a>
              )}
            </div>
          )}
        </div>

        <ReviewActionForm
          applicationId={application.id}
          nextStatus={nextStatus}
        />
      </div>
    </div>
  );
}