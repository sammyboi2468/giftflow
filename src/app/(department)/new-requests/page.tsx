import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  Gift, 
  PlusCircle, 
  Send, 
  SearchIcon, 
  ThumbsUp, 
  Cog, 
  CheckCircle,
} from 'lucide-react';
import { db as prisma } from '@/lib/db';
import { RequestStatus } from '@prisma/client';

export default async function SubmitGiftRequest({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const searchQuery = resolvedParams.query || '';

  // Replace with dynamic session user ID when authentication is ready
  const currentUserId = 'usr_101';

  // 1. Fetch live requests from the database for the active user
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
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Check if user has an active draft or submitted request
  const latestRequest = dbRequests[0];
  const activeRequestsCount = dbRequests.filter(
    (r) => r.status !== RequestStatus.DRAFT
  ).length;

  const workflowSteps = [
    { name: "Submitted", sub: "Department User", icon: Send, active: !!latestRequest },
    { name: "Review", sub: "Advancement Office", icon: SearchIcon, active: latestRequest?.status === RequestStatus.PENDING },
    { name: "Recommend", sub: "Gifts Committee", icon: ThumbsUp, active: false },
    { name: "Process", sub: "Senate Division", icon: Cog, active: false },
    { name: "Final Approval", sub: "Council", icon: CheckCircle, active: latestRequest?.status === RequestStatus.APPROVED },
  ];

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Submit Gift Request</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Create and submit a new gift request for approval</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <form method="GET" className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              name="query"
              defaultValue={searchQuery}
              placeholder="Search requests..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
            />
          </form>
          
          <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </button>

          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
            alt="User Avatar" 
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
          />
        </div>
      </header>

      {/* Main Workspace Frame Container */}
      <main className="p-6 max-w-[1400px] mx-auto space-y-6">

        {/* 2. Top Bar: Horizontal Workflow Track */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Approval Workflow</h2>
            <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-lg">
              {latestRequest ? `Latest Request Status: ${latestRequest.status}` : 'Stage 1 of 5'}
            </span>
          </div>

          {/* Stepper Grid Row */}
          <div className="grid grid-cols-5 relative">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center relative group">
                  
                  {/* Progress Line Connector Bridges */}
                  {idx < workflowSteps.length - 1 && (
                    <div className="absolute top-5 left-[50%] right-[-50%] h-px bg-slate-100 z-0" />
                  )}

                  {/* Node Circle Shape wrapper */}
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                    step.active 
                      ? 'bg-[#5D5CFF] border-[#5D5CFF] text-white shadow-md shadow-[#5D5CFF]/20' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <StepIcon className="h-4 w-4" />
                  </div>

                  {/* Labels underneath the node structure */}
                  <span className={`text-xs font-bold mt-3 ${step.active ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 max-w-[110px] hidden sm:block">
                    {step.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Empty State or Call to Action Box Frame */}
        {activeRequestsCount === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl py-20 px-4 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#5D5CFF] mb-5">
              <Gift className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">No active gift requests submitted yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Click the button below to begin a new gift request proposal and submit it for approval.
            </p>
            <Link href="/requestform">
              <button className="mt-6 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all transform active:scale-95">
                <PlusCircle className="h-4 w-4" />
                New Gift Request
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Have a new gift offer to submit?</h3>
              <p className="text-xs text-slate-400">Start a new proposal submission for committee review.</p>
            </div>
            <Link href="/requestform">
              <button className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all">
                <PlusCircle className="h-4 w-4" />
                New Gift Request
              </button>
            </Link>
          </div>
        )}

        {/* 4. Bottom Data Grid List: Recent Requests Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recent Requests</h3>
            <Link href="/dashboard/drafts" className="text-xs font-bold text-[#5D5CFF] hover:underline">
              View drafts & all requests
            </Link>
          </div>

          {/* Table Container Responsive Wrapper */}
          <div className="overflow-x-auto">
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
                {dbRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                      No matching records found in database.
                    </td>
                  </tr>
                ) : (
                  dbRequests.map((row) => {
                    let statusColors = "bg-amber-50 text-amber-700";
                    if (row.status === RequestStatus.APPROVED) statusColors = "bg-emerald-50 text-emerald-700";
                    if (row.status === RequestStatus.REJECTED) statusColors = "bg-rose-50 text-rose-700";
                    if (row.status === RequestStatus.DRAFT) statusColors = "bg-slate-100 text-slate-600";

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3.5 font-bold text-[#5D5CFF] text-xs">
                          #{row.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 text-xs">
                          <div className="font-bold text-slate-800">{row.title || 'Untitled Proposal'}</div>
                          <div className="text-[11px] text-slate-400">{row.donorName || 'Donor Not Specified'}</div>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-700 text-xs">
                          {row.amount ? `${row.currency || 'NGN'} ${row.amount.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="py-3.5 text-xs text-slate-400 font-medium">
                          {new Date(row.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 text-xs text-slate-500 font-semibold">
                          {row.status === RequestStatus.DRAFT ? 'Draft Saved' : 'Advancement Office'}
                        </td>
                        <td className="py-3.5 text-right pr-4">
                          <span className={`inline-block w-24 text-center py-1 text-[11px] font-bold rounded-lg ${statusColors}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}