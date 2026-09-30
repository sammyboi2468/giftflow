import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Search,
  Gift,
  PlusCircle,
  Send,
  SearchIcon,
  ThumbsUp,
  Cog,
  CheckCircle,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { RequestStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STAGE_LABEL: Partial<Record<RequestStatus, string>> = {
  [RequestStatus.DRAFT]: 'Draft saved',
  [RequestStatus.SUBMITTED]: 'Submitted',
  [RequestStatus.PENDING]: 'Advancement Office',
  [RequestStatus.ADVANCEMENT_REVIEW]: 'Advancement Office',
  [RequestStatus.SENATE_REVIEW]: 'Senate Division',
  [RequestStatus.SENATE_PROCESSING]: 'Senate Processing',
  [RequestStatus.COUNCIL_REVIEW]: 'Council',
  [RequestStatus.REVISION_REQUESTED]: 'Needs revision',
  [RequestStatus.AWAITING_DEPARTMENT_RESPONSE]: 'Awaiting your response',
  [RequestStatus.APPROVED]: 'Completed',
  [RequestStatus.REJECTED]: 'Closed',
};

function statusClasses(status: RequestStatus) {
  if (status === RequestStatus.APPROVED) return 'bg-emerald-50 text-emerald-700';
  if (status === RequestStatus.REJECTED) return 'bg-rose-50 text-rose-700';
  if (status === RequestStatus.DRAFT) return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
}

export default async function SubmitGiftRequest({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const currentUserId = session.user.id;

  const resolvedParams = searchParams ? await searchParams : {};
  const searchQuery = resolvedParams.query || '';

  // 1. Fetch live requests from the database for the signed-in user
  const dbRequests = await prisma.giftRequest.findMany({
    where: {
      userId: currentUserId,
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { donorName: { contains: searchQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const latestRequest = dbRequests[0];
  const activeRequestsCount = dbRequests.filter((r) => r.status !== RequestStatus.DRAFT).length;

  const workflowSteps = [
    { name: 'Submitted', sub: 'Department User', icon: Send, active: !!latestRequest },
    { name: 'Review', sub: 'Advancement Office', icon: SearchIcon, active: latestRequest?.status === RequestStatus.PENDING },
    { name: 'Recommend', sub: 'Gifts Committee', icon: ThumbsUp, active: false },
    { name: 'Process', sub: 'Senate Division', icon: Cog, active: false },
    { name: 'Final Approval', sub: 'Council', icon: CheckCircle, active: latestRequest?.status === RequestStatus.APPROVED },
  ];

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatValue = (row: (typeof dbRequests)[number]) =>
    row.amount ? `${row.currency || 'NGN'} ${Number(row.amount).toLocaleString()}` : 'N/A';

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Submit Gift Request</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Create and submit a new gift request for approval</p>
        </div>

        <form method="GET" className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="query"
            defaultValue={searchQuery}
            placeholder="Search requests..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
          />
        </form>
      </header>

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
        {/* 2. Workflow track */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Approval Workflow</h2>
            <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-lg">
              {latestRequest ? `Latest Request Status: ${latestRequest.status.replace(/_/g, ' ')}` : 'Stage 1 of 5'}
            </span>
          </div>

          <div className="grid grid-cols-5 relative">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center relative group px-0.5">
                  {idx < workflowSteps.length - 1 && (
                    <div className="absolute top-4 sm:top-5 left-[50%] right-[-50%] h-px bg-slate-100 z-0" />
                  )}

                  <div
                    className={`relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all ${
                      step.active
                        ? 'bg-[#5D5CFF] border-[#5D5CFF] text-white shadow-md shadow-[#5D5CFF]/20'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>

                  <span className={`text-[10px] sm:text-xs font-bold mt-2 sm:mt-3 leading-tight ${step.active ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 max-w-[110px] hidden sm:block">{step.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Empty state or call to action */}
        {activeRequestsCount === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-12 sm:py-20 px-4 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#5D5CFF] mb-5">
              <Gift className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">No active gift requests submitted yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Select the button below to begin a new gift request proposal and submit it for approval.
            </p>
            <Link
              href="/requestform"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all transform active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              New Gift Request
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Have a new gift offer to submit?</h3>
              <p className="text-xs text-slate-400">Start a new proposal submission for committee review.</p>
            </div>
            <Link
              href="/requestform"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              New Gift Request
            </Link>
          </div>
        )}

        {/* 4. Recent requests */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Requests</h3>
            <Link href="/dashboard/drafts" className="text-xs font-bold text-[#5D5CFF] hover:underline">
              View drafts & all requests
            </Link>
          </div>

          {dbRequests.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400 font-medium">No matching records found.</p>
          ) : (
            <>
              {/* Phones and small tablets: one card per request */}
              <ul className="space-y-3 md:hidden">
                {dbRequests.map((row) => (
                  <li key={row.id} className="rounded-xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 break-words">{row.title || 'Untitled Proposal'}</p>
                        <p className="text-[11px] text-slate-400 break-words">{row.donorName || 'Donor Not Specified'}</p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${statusClasses(row.status)}`}>
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-slate-400">Request ID</dt>
                        <dd className="font-bold text-[#5D5CFF]">#{row.id.slice(-6).toUpperCase()}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Value</dt>
                        <dd className="font-semibold text-slate-700">{formatValue(row)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Submitted</dt>
                        <dd className="font-medium text-slate-600">{formatDate(row.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Current stage</dt>
                        <dd className="font-semibold text-slate-600">{STAGE_LABEL[row.status] ?? 'In progress'}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* md and up: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                      <th className="pb-3 font-semibold">Request ID</th>
                      <th className="pb-3 font-semibold">Proposal Title / Donor</th>
                      <th className="pb-3 font-semibold">Value</th>
                      <th className="pb-3 font-semibold">Date Submitted</th>
                      <th className="pb-3 font-semibold">Current Stage</th>
                      <th className="pb-3 font-semibold text-right pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dbRequests.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-bold text-[#5D5CFF] text-xs whitespace-nowrap">
                          #{row.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 text-xs">
                          <div className="font-bold text-slate-800">{row.title || 'Untitled Proposal'}</div>
                          <div className="text-[11px] text-slate-400">{row.donorName || 'Donor Not Specified'}</div>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-700 text-xs whitespace-nowrap">{formatValue(row)}</td>
                        <td className="py-3.5 text-xs text-slate-400 font-medium whitespace-nowrap">{formatDate(row.createdAt)}</td>
                        <td className="py-3.5 text-xs text-slate-500 font-semibold">{STAGE_LABEL[row.status] ?? 'In progress'}</td>
                        <td className="py-3.5 text-right pr-4">
                          <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[11px] font-bold rounded-lg ${statusClasses(row.status)}`}>
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}