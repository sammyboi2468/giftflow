"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
  Edit3,
  Inbox,
  Eye,
  FileText,
} from 'lucide-react';
import { getUserGiftRequests } from '@/app/actions/gift-request';

interface GiftRequestItem {
  id: string;
  title: string | null;
  donorName: string | null;
  amount: number | string | null;
  currency: string | null;
  giftType: string | null;
  status: string;
  createdAt: string | Date;
}

type StatusGroup = 'draft' | 'active' | 'action' | 'approved' | 'rejected';

const STATUS_META: Record<string, { label: string; badge: string; group: StatusGroup }> = {
  DRAFT: { label: 'Draft', badge: 'bg-slate-100 text-slate-600', group: 'draft' },
  SUBMITTED: { label: 'Submitted', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  PENDING: { label: 'Pending', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  ADVANCEMENT_REVIEW: { label: 'Advancement Review', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  SENATE_REVIEW: { label: 'Senate Review', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  SENATE_PROCESSING: { label: 'Senate Processing', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  COUNCIL_REVIEW: { label: 'Council Review', badge: 'bg-indigo-50 text-indigo-700', group: 'active' },
  REVISION_REQUESTED: { label: 'Revision Needed', badge: 'bg-amber-100 text-amber-800', group: 'action' },
  AWAITING_DEPARTMENT_RESPONSE: { label: 'Response Needed', badge: 'bg-amber-100 text-amber-800', group: 'action' },
  APPROVED: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700', group: 'approved' },
  REJECTED: { label: 'Rejected', badge: 'bg-rose-50 text-rose-700', group: 'rejected' },
};

const TABS = ['All', 'In Progress', 'Needs Action', 'Drafts', 'Approved', 'Rejected'] as const;
type Tab = (typeof TABS)[number];

type SortField = 'id' | 'title' | 'amount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const metaFor = (status: string) =>
  STATUS_META[status] ?? { label: status.replace(/_/g, ' '), badge: 'bg-slate-100 text-slate-600', group: 'active' as StatusGroup };

const tabMatches = (group: StatusGroup, tab: Tab): boolean => {
  switch (tab) {
    case 'All':
      return true;
    case 'In Progress':
      return group === 'active' || group === 'action';
    case 'Needs Action':
      return group === 'action';
    case 'Drafts':
      return group === 'draft';
    case 'Approved':
      return group === 'approved';
    case 'Rejected':
      return group === 'rejected';
  }
};

const getSortableValue = (item: GiftRequestItem, field: SortField): number | string => {
  if (field === 'amount') return Number(item.amount || 0);
  if (field === 'createdAt') return new Date(item.createdAt).getTime() || 0;
  if (field === 'title') return String(item.title || '').toLowerCase();
  return item.id.toLowerCase();
};

// Each row's button goes to the place where THIS request can actually be
// worked on, based on its real status.
const getRowAction = (row: GiftRequestItem) => {
  switch (row.status) {
    case 'DRAFT':
      return { href: `/requestform?draftId=${row.id}`, label: 'Continue', style: 'bg-slate-900 text-white hover:bg-slate-800', Icon: Edit3 };
    case 'REVISION_REQUESTED':
      return { href: `/requestform?draftId=${row.id}`, label: 'Revise', style: 'bg-amber-500 text-white hover:bg-amber-600', Icon: Edit3 };
    case 'AWAITING_DEPARTMENT_RESPONSE':
      return { href: `/reviewer/department/${row.id}`, label: 'Respond', style: 'bg-[#5D5CFF] text-white hover:bg-[#4c4be6]', Icon: FileText };
    default:
      return { href: `/requests/${row.id}`, label: 'View', style: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50', Icon: Eye };
  }
};

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<GiftRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const data = await getUserGiftRequests();
        setRequests(Array.isArray(data) ? (data as unknown as GiftRequestItem[]) : []);
      } catch (err) {
        console.error('Error loading requests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, []);

  const stats = useMemo(() => {
    const inProgress = requests.filter((r) => ['active', 'action'].includes(metaFor(r.status).group)).length;
    const needsAction = requests.filter((r) => metaFor(r.status).group === 'action').length;
    const rejected = requests.filter((r) => metaFor(r.status).group === 'rejected').length;

    const approvedByCurrency: Record<string, number> = {};
    requests
      .filter((r) => r.status === 'APPROVED' && r.amount)
      .forEach((r) => {
        const c = r.currency || 'NGN';
        approvedByCurrency[c] = (approvedByCurrency[c] || 0) + Number(r.amount);
      });
    const approvedLabel =
      Object.entries(approvedByCurrency)
        .map(([c, v]) => `${c} ${v.toLocaleString()}`)
        .join(' · ') || '—';

    return { inProgress, needsAction, rejected, approvedLabel };
  }, [requests]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests
      .filter((req) => {
        const meta = metaFor(req.status);
        const matchesSearch =
          req.id.toLowerCase().includes(query) ||
          (req.donorName || '').toLowerCase().includes(query) ||
          (req.title || '').toLowerCase().includes(query) ||
          meta.label.toLowerCase().includes(query);
        return matchesSearch && tabMatches(meta.group, activeTab);
      })
      .sort((a, b) => {
        const aVal = getSortableValue(a, sortField);
        const bVal = getSortableValue(b, sortField);
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [requests, searchQuery, activeTab, sortField, sortOrder]);

  const exportToCSV = () => {
    if (filteredRequests.length === 0) return;

    const headers = ['Request ID', 'Title', 'Donor', 'Classification', 'Amount', 'Currency', 'Filing Date', 'Status'];
    const rows = filteredRequests.map((r) => [
      r.id,
      r.title || 'Untitled',
      r.donorName || '-',
      r.giftType || '-',
      r.amount || 0,
      r.currency || 'NGN',
      r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '-',
      metaFor(r.status).label,
    ]);

    const csv = [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gift_requests_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Requests</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Track everything you`ve submitted, and act on anything that needs you
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by donor, title, status, or ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
          />
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'In Progress', value: `${stats.inProgress}`, color: 'bg-indigo-50 text-[#5D5CFF]', icon: Layers },
            { label: 'Needs Your Action', value: `${stats.needsAction}`, color: 'bg-amber-50 text-amber-500', icon: AlertTriangle },
            { label: 'Total Approved', value: stats.approvedLabel, color: 'bg-emerald-50 text-emerald-500', icon: CheckCircle },
            { label: 'Rejected', value: `${stats.rejected}`, color: 'bg-rose-50 text-rose-500', icon: XCircle },
          ].map((card) => {
            const CardIcon = card.icon;
            return (
              <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-xs">
                <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
                  <CardIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-slate-900 leading-none truncate">{card.value}</div>
                  <div className="text-xs font-medium text-slate-400 mt-1">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-xl w-fit gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                  {tab === 'Needs Action' && stats.needsAction > 0 && (
                    <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {stats.needsAction}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={exportToCSV}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-2 self-start lg:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#5D5CFF] mx-auto" />
                <p className="text-xs font-semibold text-slate-400">Loading your requests...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100 tracking-wider select-none">
                    <th className="py-3 px-6 font-semibold cursor-pointer hover:text-slate-600" onClick={() => handleSort('id')}>
                      <span className="flex items-center gap-1.5">Request ID <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600" onClick={() => handleSort('title')}>
                      <span className="flex items-center gap-1.5">Title / Proposal <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 font-semibold">Donor / Entity</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600" onClick={() => handleSort('amount')}>
                      <span className="flex items-center gap-1.5">Financial Value <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600" onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center gap-1.5">Filing Date <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-3 px-4 font-semibold">State</th>
                    <th className="py-3 px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map((row) => {
                    const meta = metaFor(row.status);
                    const action = getRowAction(row);
                    const ActionIcon = action.Icon;

                    const formattedDate = row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—';
                    const formattedAmount = row.amount
                      ? `${row.currency || 'NGN'} ${Number(row.amount).toLocaleString()}`
                      : '—';

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${meta.group === 'action' ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="py-4 px-6 font-bold text-[#5D5CFF] text-xs">#{row.id.slice(-6).toUpperCase()}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 text-xs">{row.title || 'Untitled Proposal'}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-600">{row.donorName || '—'}</td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-400">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                            {row.giftType || 'Gift'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-700 text-xs">{formattedAmount}</td>
                        <td className="py-4 px-4 text-xs text-slate-400 font-medium">{formattedDate}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[11px] font-bold rounded-lg ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={action.href}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${action.style}`}
                          >
                            <ActionIcon className="h-3.5 w-3.5" />
                            {action.label}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm font-medium text-slate-400 bg-slate-50/20">
                        <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        No request records found matching the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}