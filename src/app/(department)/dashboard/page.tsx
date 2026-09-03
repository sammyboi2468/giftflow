import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Role, RequestStatus } from '@prisma/client';
import { 
  Gift, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  Send, 
  ChevronRight,
  FileText,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Paperclip
} from 'lucide-react';

const statusMap: Record<RequestStatus, { step: number; location: string }> = {
  DRAFT: { step: 0, location: "Drafts" },
  SUBMITTED: { step: 1, location: "Submitted" },
  PENDING: { step: 1, location: "Pending Initial Check" },
  ADVANCEMENT_REVIEW: { step: 2, location: "Advancement Office" },
  SENATE_REVIEW: { step: 3, location: "Senate Division" },
  SENATE_PROCESSING: { step: 3, location: "Senate Processing" },
  COUNCIL_REVIEW: { step: 4, location: "Council Governance" },
  REVISION_REQUESTED: { step: 1, location: "Requires Revision" },
  AWAITING_DEPARTMENT_RESPONSE: { step: 1, location: "Awaiting Dept Response" },
  APPROVED: { step: 5, location: "Approved & Completed" },
  REJECTED: { step: 0, location: "Closed / Rejected" },
};

function formatSubmittedDate(date: Date) {
  return `submitted ${new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })}`;
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return 'just now';
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const currentUserId = session.user.id;

  const currentUser = await db.user.findUnique({
    where: { id: currentUserId }
  });

  const userRole = currentUser?.role || Role.DEPARTMENT_USER;
  const userDepartment = currentUser?.department;

  const isReviewingBody = userRole !== Role.DEPARTMENT_USER;

  const departmentWhereClause = isReviewingBody
    ? {}
    : userDepartment
    ? { user: { department: userDepartment } }
    : { userId: currentUserId };

  // Dynamic Metric Counts with Department Scope
  const [inProgressCount, approvedCount, totalCount, needsInfoCount] = await Promise.all([
    db.giftRequest.count({ 
      where: { ...departmentWhereClause, status: RequestStatus.PENDING } 
    }),
    db.giftRequest.count({ 
      where: { ...departmentWhereClause, status: RequestStatus.APPROVED } 
    }),
    db.giftRequest.count({ 
      where: isReviewingBody 
        ? { NOT: { status: RequestStatus.DRAFT } } 
        : { ...departmentWhereClause } 
    }),
    db.giftRequest.count({ 
      where: { ...departmentWhereClause, status: RequestStatus.REVISION_REQUESTED } 
    }),
  ]);

  // Fetch Active Requests
  const activeRequestsFromDb = await db.giftRequest.findMany({
    where: {
      ...departmentWhereClause,
      status: {
        in: [
          RequestStatus.PENDING,
          RequestStatus.REVISION_REQUESTED,
          RequestStatus.AWAITING_DEPARTMENT_RESPONSE,
          RequestStatus.APPROVED,
          RequestStatus.REJECTED,
        ],
      },
    },
    include: {
      user: { select: { name: true, department: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  // Filter specifically for items requiring revision
  const revisionRequests = activeRequestsFromDb.filter(
    (req) => req.status === RequestStatus.REVISION_REQUESTED
  );

  // Filter specifically for items awaiting a department response to a
  // Decision Extract (issued by Senate)
  const awaitingResponseRequests = activeRequestsFromDb.filter(
    (req) => req.status === RequestStatus.AWAITING_DEPARTMENT_RESPONSE
  );

  // Fetch Recent Activity Logs
  const activitiesFromDb = await db.activityLog.findMany({
    where: isReviewingBody 
      ? {} 
      : userDepartment 
      ? { user: { department: userDepartment } }
      : { userId: currentUserId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const activityColors = ['bg-[#5D5CFF]', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-400', 'bg-rose-500'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">

      {/* Welcome Banner Card */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-[#5D5CFF] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
        <div className="z-10 space-y-2">
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm">
            Logged in as: {currentUser?.name || session.user.name || 'Authorized Session'} 
            {userDepartment ? ` (${userDepartment})` : ''}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Giftflow Governance Workspace
          </h2>
          <p className="text-sm text-white/80 max-w-xl font-medium">
            {isReviewingBody 
              ? `System-wide metrics: ${inProgressCount} new files pending review, and ${needsInfoCount} flagged for clarification items.`
              : `Your department (${userDepartment || 'Default'}) has ${inProgressCount} active proposals pending and ${needsInfoCount} requiring attention.`
            }
          </p>
        </div>
        
        {userRole === Role.DEPARTMENT_USER && (
          <Link href="/requestform">
            <button className="z-10 mt-6 md:mt-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#5D5CFF] shadow-sm hover:bg-slate-50 transition-all transform active:scale-95 shrink-0">
              <PlusCircle className="h-4 w-4" />
              New Gift Proposal
            </button>
          </Link>
        )}

        <div className="absolute -bottom-6 right-24 opacity-15 select-none pointer-events-none hidden lg:block">
          <Gift className="h-48 w-48 text-white" />
        </div>
      </div>

      {/* REVISION REQUEST NOTIFICATION BANNER */}
      {revisionRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">
                Action Required: {revisionRequests.length} Request(s) Sent Back for Revision
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                The Advancement Office has requested revisions before review can proceed.
              </p>
            </div>
          </div>

          <div className="grid gap-2 pt-1">
            {revisionRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-amber-100 shadow-xs"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">{request.title}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    ID: {request.id} · Updated {formatTimeAgo(request.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/requestform?draftId=${request.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Revise Proposal
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DECISION EXTRACT / AWAITING DEPARTMENT RESPONSE BANNER */}
      {awaitingResponseRequests.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] shrink-0">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-950 text-sm">
                {awaitingResponseRequests.length} Decision Extract{awaitingResponseRequests.length > 1 ? 's' : ''} Awaiting Your Response
              </h3>
              <p className="text-xs text-indigo-700 mt-0.5">
                The Senate Division has issued an official Decision Extract -- review it and submit your department`s response.
              </p>
            </div>
          </div>

          <div className="grid gap-2 pt-1">
            {awaitingResponseRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-indigo-100 shadow-xs"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">{request.title}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    ID: {request.id} · Updated {formatTimeAgo(request.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/reviewer/department/${request.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#5D5CFF] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4c4be6] transition-colors shadow-xs"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  View Extract & Respond
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Card Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: inProgressCount.toString(), color: 'bg-indigo-50 text-indigo-500', icon: Clock },
          { label: 'Needs Info Log', value: needsInfoCount.toString(), color: 'bg-amber-50 text-amber-500', icon: AlertCircle },
          { label: 'Approved by Council', value: approvedCount.toString(), color: 'bg-emerald-50 text-emerald-500', icon: CheckCircle },
          { label: 'Total Tracked Files', value: totalCount.toString(), color: 'bg-slate-50 text-slate-500', icon: Send },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none">{card.value}</div>
                <div className="text-xs font-medium text-slate-400 mt-1">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace Splitting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Track Active Pipeline List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Governance Processing Pipeline</h3>
            <span className="text-xs font-semibold text-slate-400">
              {isReviewingBody ? "System-wide View" : `${userDepartment || "Department"} View`}
            </span>
          </div>

          {activeRequestsFromDb.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-sm text-slate-400 shadow-sm">
              No active gift requests currently logging pipeline metrics for this department.
            </div>
          )}

          {activeRequestsFromDb.map((request) => {
            const mappedStage = statusMap[request.status] || { step: 2, location: "Processing Submissions" };
            
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(Number(request.amount));

            const isRevision = request.status === RequestStatus.REVISION_REQUESTED;
            const isAwaitingResponse = request.status === RequestStatus.AWAITING_DEPARTMENT_RESPONSE;

            return (
              <div key={request.id} className="block bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm group transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-snug">
                      {request.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      ID: {request.id} · <span className="text-slate-600 font-bold">{formattedValue}</span> · {formatSubmittedDate(request.createdAt)}
                      {isReviewingBody && request.user?.department && (
                        <span className="ml-2 font-semibold text-indigo-500">[{request.user.department}]</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      request.status === RequestStatus.APPROVED ? 'text-emerald-600 bg-emerald-50' :
                      request.status === RequestStatus.REVISION_REQUESTED ? 'text-amber-600 bg-amber-50 animate-pulse' :
                      request.status === RequestStatus.AWAITING_DEPARTMENT_RESPONSE ? 'text-[#5D5CFF] bg-[#5D5CFF]/10 animate-pulse' :
                      request.status === RequestStatus.REJECTED ? 'text-red-600 bg-red-50' :
                      'text-indigo-600 bg-indigo-50'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>

                    {/* ACTION BUTTON IF REVISION IS NEEDED */}
                    {isRevision && userRole === Role.DEPARTMENT_USER && (
                      <Link
                        href={`/requestform?draftId=${request.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        Revise
                      </Link>
                    )}

                    {/* ACTION BUTTON IF DEPARTMENT RESPONSE IS NEEDED */}
                    {isAwaitingResponse && userRole === Role.DEPARTMENT_USER && (
                      <Link
                        href={`/reviewer/department/${request.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#5D5CFF] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#4c4be6] transition-colors shadow-xs"
                      >
                        <Paperclip className="h-3 w-3" />
                        Respond
                      </Link>
                    )}
                  </div>
                </div>

                {/* Horizontal Processing Steps Visualizer */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <React.Fragment key={step}>
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          step <= mappedStage.step 
                            ? request.status === RequestStatus.REJECTED ? 'bg-rose-500' : 'bg-[#5D5CFF]' 
                            : 'bg-slate-100'
                        }`} />
                        {step < 5 && (
                          <div className={`h-0.5 w-full rounded ${
                            step < mappedStage.step 
                              ? request.status === RequestStatus.REJECTED ? 'bg-rose-300' : 'bg-[#5D5CFF]' 
                              : 'bg-slate-100'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">
                    Current Location: <span className="text-slate-700 font-semibold">{mappedStage.location}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Action Desk & Audit Feed */}
        <div className="space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Quick Actions</h3>
            <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-1 shadow-sm">
              {[
                { label: "Submit New Proposal", href: "/requestform", icon: PlusCircle, color: "text-[#5D5CFF] bg-[#5D5CFF]/5", visible: userRole === Role.DEPARTMENT_USER },
                { label: "Track System Folders", href: "/dashboard", icon: FileText, color: "text-blue-500 bg-blue-50", visible: true }
              ].filter(a => a.visible).map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Link key={index} href={action.href} className="flex w-full items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-[#5D5CFF] transition-colors">
                        {action.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Audit Log Timeline */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Recent Activity Log</h3>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              {activitiesFromDb.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 text-center py-4">No recent activity logs recorded.</p>
              ) : (
                activitiesFromDb.map((act, index) => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                      activityColors[index % activityColors.length]
                    }`} />
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-700 leading-snug">{act.details}</p>
                      <span className="block text-[11px] font-medium text-slate-400">{formatTimeAgo(act.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}