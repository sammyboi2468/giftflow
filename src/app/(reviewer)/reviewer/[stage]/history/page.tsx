import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, History, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

// Same role mapping as review-actions.ts -- "senate" and "senate-processing"
// both act as SENATE_DIVISION, so their history is naturally unified here
// just like the live queue already combines them into one view.
const STAGE_TO_ROLE: Record<string, Role> = {
  advancement: Role.ADVANCEMENT_OFFICE,
  senate: Role.SENATE_DIVISION,
  "senate-processing": Role.SENATE_DIVISION,
  council: Role.COUNCIL,
};

const STAGE_ROLE_MAP = STAGE_TO_ROLE; // same access-control mapping

const ACTION_META: Record<string, { icon: typeof CheckCircle2; label: string; style: string }> = {
  APPROVE: { icon: CheckCircle2, label: "Approved", style: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  REJECT: { icon: XCircle, label: "Rejected", style: "text-rose-600 bg-rose-50 border-rose-100" },
  REQUEST_INFO: { icon: AlertCircle, label: "Requested Info / Issued Extract", style: "text-amber-600 bg-amber-50 border-amber-100" },
};

export default async function ReviewerStageHistoryPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const normalizedStage = stage.toLowerCase();
  const stageRole = STAGE_TO_ROLE[normalizedStage];

  if (!stageRole) notFound();

  const userRole = session.user.role as Role | undefined;
  if (!userRole || userRole === Role.DEPARTMENT_USER) {
    redirect("/login");
  }
  const requiredRole = STAGE_ROLE_MAP[normalizedStage];
  if (userRole !== Role.ADMIN && userRole !== requiredRole) {
    redirect("/login");
  }

  const history = await db.stageHistory.findMany({
    where: { stage: stageRole },
    include: {
      giftRequest: {
        select: { id: true, title: true, donorName: true, amount: true, currency: true, status: true },
      },
      actedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans sm:p-8 lg:p-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={`/reviewer/${stage}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#5D5CFF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {stage} queue
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8">
          <History className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/10" strokeWidth={1} />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Clock className="h-3.5 w-3.5" />
              Full history
            </span>
            <h1 className="mt-3 text-2xl font-bold capitalize text-white">{stage.replace("-", " ")} history</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Every decision this stage has ever made -- {history.length} record{history.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {history.length === 0 ? (
            <p className="py-12 text-center text-xs font-semibold text-slate-400">
              No decisions recorded for this stage yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((entry) => {
                const meta = ACTION_META[entry.action] ?? {
                  icon: Clock,
                  label: entry.action,
                  style: "text-slate-600 bg-slate-50 border-slate-100",
                };
                const Icon = meta.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-4 py-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.style}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {entry.giftRequest.title || "Untitled request"}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.style}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Donor: {entry.giftRequest.donorName || "N/A"}
                        {entry.giftRequest.amount != null && (
                          <> · {entry.giftRequest.currency || "NGN"} {entry.giftRequest.amount.toLocaleString()}</>
                        )}
                      </p>
                      {entry.notes && <p className="text-xs text-slate-600 italic">&quot;{entry.notes}&quot;</p>}
                      <p className="text-[10px] font-semibold text-slate-400">
                        {entry.actedBy?.name || "Unknown reviewer"} · {new Date(entry.createdAt).toLocaleString()} ·
                        Resulting status: {entry.resultingStatus.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}