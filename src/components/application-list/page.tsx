'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  FileText,
  CheckCircle2,
  Search,
  ArrowUpDown,
  RotateCcw,
  Paperclip,
} from 'lucide-react';

// Describes why an item is NOT a fresh submission. Built on the server in
// the reviewer stage page and passed down with each application.
export interface ReturnInfo {
  // RESUBMITTED: sent back for revision earlier and the department has sent it in again.
  // DEPARTMENT_RESPONSE: Senate issued a Decision Extract and the department has responded.
  kind: 'RESUBMITTED' | 'DEPARTMENT_RESPONSE';
  revisionCount: number;
  lastRevisionNote: string | null;
  lastRevisionAt: Date | null;
}

export interface ReviewerApplication {
  id: string;
  title: string | null;
  status: string;
  createdAt: Date;
  user: {
    name: string | null;
    department: string | null;
  };
  returnInfo?: ReturnInfo | null;
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

// Named export (not a separate file/default export) so the hero's "days on
// oldest item" stat shares the exact same working module as ApplicationsList.
export function OldestPendingStat({ oldestCreatedAt }: { oldestCreatedAt: Date | null }) {
  const [now] = useState(() => Date.now());

  if (!oldestCreatedAt) return null;

  // The divider only makes sense when this stat sits on the same row as the
  // others (sm and up); on phones the stats wrap, so no divider there.
  return (
    <div className="sm:border-l sm:border-white/20 sm:pl-6">
      <span className="text-2xl font-extrabold text-white sm:text-3xl">{daysPending(oldestCreatedAt, now)}</span>
      <p className="text-xs font-medium text-indigo-100">Days on oldest item</p>
    </div>
  );
}

export default function ApplicationsList({ applications, stage, isSenate, isCouncil }: ApplicationsListProps) {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [returnedOnly, setReturnedOnly] = useState(false);
  // Captured once, on mount, via the lazy initializer -- not read directly
  // during render -- so "now" stays stable across re-renders instead of
  // drifting on every keystroke in the search box.
  const [now] = useState(() => Date.now());

  const returnedCount = useMemo(
    () => applications.filter((a) => a.returnInfo).length,
    [applications]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = q
      ? applications.filter((app) => {
          return (
            (app.title ?? '').toLowerCase().includes(q) ||
            (app.user.name ?? '').toLowerCase().includes(q) ||
            (app.user.department ?? '').toLowerCase().includes(q)
          );
        })
      : applications;

    if (returnedOnly) {
      filtered = filtered.filter((app) => app.returnInfo);
    }

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });
  }, [applications, query, sortOrder, returnedOnly]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-base font-bold text-slate-900">Applications Awaiting Action</h2>

        {applications.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            {/* Search takes the full row on phones; the two buttons sit below it */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, applicant, department"
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-base text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-xs"
              />
            </div>

            {returnedCount > 0 && (
              <button
                type="button"
                onClick={() => setReturnedOnly((prev) => !prev)}
                aria-pressed={returnedOnly}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  returnedOnly
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Returned ({returnedCount})
              </button>
            )}

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

      <div className="mt-4">
        {applications.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center sm:p-12">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">No applications pending review in this stage.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center sm:p-12">
            <Search className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="break-words text-xs font-semibold text-slate-500">
              {query
                ? <>Nothing matches &ldquo;{query}&rdquo;. Try a different title, applicant, or department.</>
                : 'No returned applications in this queue.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((app) => {
              const pending = daysPending(app.createdAt, now);
              const isOverdue = pending >= 7;
              const isWaiting = pending >= 3 && pending < 7;
              const info = app.returnInfo ?? null;
              const isDeptResponse = info?.kind === 'DEPARTMENT_RESPONSE';

              return (
                <Link
                  key={app.id}
                  href={`/reviewer/${app.status === 'SENATE_PROCESSING' ? 'senate-processing' : stage}/${app.id}`}
                  className={`group flex flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 ${
                    info
                      ? isDeptResponse
                        ? 'border-l-4 border-l-[#5D5CFF] bg-indigo-50/30'
                        : 'border-l-4 border-l-amber-400 bg-amber-50/30'
                      : ''
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                      {initials(app.user.name)}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Returned-item badge: sits first so it's the first thing the reviewer sees */}
                        {info && (
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                              isDeptResponse
                                ? 'border-indigo-200 bg-indigo-50 text-[#5D5CFF]'
                                : 'border-amber-300 bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isDeptResponse ? (
                              <Paperclip className="h-3 w-3 shrink-0" />
                            ) : (
                              <RotateCcw className="h-3 w-3 shrink-0" />
                            )}
                            <span>
                              {isDeptResponse
                                ? 'Department responded to Decision Extract'
                                : `Resubmitted after revision${
                                    info.revisionCount > 1 ? ` (${info.revisionCount}x)` : ''
                                  }`}
                            </span>
                          </div>
                        )}
                        {(isSenate || isCouncil) && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
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

                      <h3 className="break-words text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                        {app.title || 'Untitled request'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          Applicant: <strong className="font-semibold text-slate-700">{app.user.name ?? 'Unknown'}</strong>
                        </span>
                        <span>Department: {app.user.department || 'N/A'}</span>
                        <span>
                          Submitted: {new Date(app.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* What the reviewer originally asked for, so they can check it was addressed */}
                      {info?.lastRevisionNote && (
                        <p className="line-clamp-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-2 text-xs text-slate-600 ring-1 ring-amber-100">
                          <span className="font-bold text-amber-800">You asked for: </span>
                          {info.lastRevisionNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* On phones this lines up under the text (indented past the avatar) */}
                  <div className="flex shrink-0 items-center gap-2 pl-12 text-xs font-semibold text-indigo-600 transition-transform group-hover:translate-x-0.5 sm:pl-0">
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