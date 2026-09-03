'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, CheckCircle2, Search, ArrowUpDown, Clock, MessageSquareText } from 'lucide-react';
import { RequestStatus } from '@prisma/client';

export interface ReviewerApplication {
  id: string;
  title: string | null;
  status: RequestStatus;
  departmentResponse?: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    department: string | null;
  };
}

interface ApplicationsListProps {
  applications: ReviewerApplication[];
  stage: string;
  isSenate: boolean;
  isCouncil: boolean;
}

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function daysPending(createdAt: Date, now: number): number {
  const ms = now - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function OldestPendingStat({ oldestCreatedAt }: { oldestCreatedAt: Date | null }) {
  const [now] = useState(() => Date.now());

  if (!oldestCreatedAt) return null;

  return (
    <div className="border-l border-white/20 pl-6">
      <span className="text-3xl font-extrabold text-white">{daysPending(oldestCreatedAt, now)}</span>
      <p className="text-xs font-medium text-indigo-100">Days on oldest item</p>
    </div>
  );
}

export default function ApplicationsList({ applications, stage, isSenate, isCouncil }: ApplicationsListProps) {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<'ALL' | 'INITIAL' | 'PROCESSING'>('ALL');
  const [now] = useState(() => Date.now());

  // Filter & Sort Applications
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      // 1. Filter by Tab (for Senate)
      if (isSenate) {
        if (activeTab === 'INITIAL' && app.status !== RequestStatus.SENATE_REVIEW) return false;
        if (activeTab === 'PROCESSING' && app.status !== RequestStatus.SENATE_PROCESSING) return false;
      }

      // 2. Filter by Search Query
      if (!q) return true;
      return (
        (app.title ?? '').toLowerCase().includes(q) ||
        (app.user.name ?? '').toLowerCase().includes(q) ||
        (app.user.department ?? '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });
  }, [applications, query, sortOrder, activeTab, isSenate]);

  const senateReviewCount = applications.filter((a) => a.status === RequestStatus.SENATE_REVIEW).length;
  const senateProcessingCount = applications.filter((a) => a.status === RequestStatus.SENATE_PROCESSING).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-slate-900">Applications Awaiting Action</h2>

        {applications.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, applicant, department"
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        )}
      </div>

      {/* Senate Filter Tabs */}
      {isSenate && applications.length > 0 && (
        <div className="mt-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INITIAL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'INITIAL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Senate Review ({senateReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROCESSING')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'PROCESSING' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Department Responded ({senateProcessingCount})
          </button>
        </div>
      )}

      {/* Applications List View */}
      <div className="mt-4">
        {applications.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-12 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">No applications pending review in this stage.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-12 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">
              Nothing matches &ldquo;{query}&rdquo;. Try a different title, applicant, or department.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((app) => {
              const pending = daysPending(app.createdAt, now);
              const isOverdue = pending >= 7;
              const isWaiting = pending >= 3 && pending < 7;
              const isProcessing = app.status === RequestStatus.SENATE_PROCESSING;

              return (
                <Link
                  key={app.id}
                  href={`/reviewer/${stage}/${app.id}`}
                  className={`group flex flex-col gap-4 rounded-xl p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                    isProcessing
                      ? 'bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50/80 my-1'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isProcessing ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {initials(app.user.name)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Senate Processing Highlight Tag */}
                        {isProcessing && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                            <Clock className="h-3 w-3 text-amber-700" />
                            <span>Department Responded</span>
                          </div>
                        )}

                        {(isSenate || isCouncil) && !isProcessing && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>{isCouncil ? 'Recommended by Senate Division' : 'Recommended by Advancement Office'}</span>
                          </div>
                        )}

                        {isOverdue && (
                          <div className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700">
                            Waiting {pending} days
                          </div>
                        )}
                        {isWaiting && (
                          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                            Waiting {pending} days
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                        {app.title || 'Untitled request'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          Applicant: <strong className="font-semibold text-slate-700">{app.user.name ?? 'Unknown'}</strong>
                        </span>
                        <span>Department: {app.user.department || 'N/A'}</span>
                        <span>
                          Submitted:{' '}
                          {new Date(app.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-indigo-600 transition-transform group-hover:translate-x-0.5">
                    <span>Review application</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}