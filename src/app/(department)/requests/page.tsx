"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  Download, 
  Layers, 
  CheckCircle, 
  XCircle, 
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Edit3,
  Inbox
} from 'lucide-react';
import { getUserGiftRequests } from '@/app/actions/gift-request';

interface GiftRequestItem {
  id: string;
  title: string;
  donorName: string;
  amount: number | string | null;
  currency: string;
  giftType: string;
  status: string; // e.g. 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'
  currentStage?: string;
  createdAt: string | Date;
}

type SortField = 'id' | 'title' | 'amount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// Strictly typed helper to safely extract comparable values without TypeScript overload errors
const getSortableValue = (item: GiftRequestItem, field: SortField): number | string => {
  if (field === 'amount') {
    return Number(item.amount || 0);
  }
  
  if (field === 'createdAt') {
    const rawDate = item.createdAt;
    if (typeof rawDate === 'string' || typeof rawDate === 'number' || rawDate instanceof Date) {
      return new Date(rawDate).getTime();
    }
    return 0;
  }
  
  return String(item[field] || '').toLowerCase();
};

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<GiftRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch requests from database on mount
  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const data = await getUserGiftRequests();
        setRequests(data as unknown as GiftRequestItem[]);
      } catch (err) {
        console.error('Error loading requests:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, []);

  // Compute live analytical counts
  const activeCount = requests.filter(r => r.status === 'PENDING' || r.status === 'DRAFT').length;
  
  const totalApprovedAmount = requests
    .filter(r => r.status === 'APPROVED' && r.amount)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Toggle Column Sort Order
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort requests pipeline
  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          req.id.toLowerCase().includes(query) ||
          (req.donorName && req.donorName.toLowerCase().includes(query)) ||
          (req.title && req.title.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (activeTab === 'All') return true;
        if (activeTab === 'Pending') return req.status === 'PENDING' || req.status === 'DRAFT';
        if (activeTab === 'Approved') return req.status === 'APPROVED';
        if (activeTab === 'Rejected') return req.status === 'REJECTED';

        return true;
      })
      .sort((a, b) => {
        const aVal = getSortableValue(a, sortField);
        const bVal = getSortableValue(b, sortField);

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [requests, searchQuery, activeTab, sortField, sortOrder]);

  // Export Filtered Table View to CSV
  const exportToCSV = () => {
    if (filteredRequests.length === 0) return;

    const headers = ['Request ID', 'Title', 'Donor', 'Classification', 'Amount', 'Currency', 'Filing Date', 'Status'];
    const rows = filteredRequests.map(r => [
      r.id,
      `"${r.title || 'Untitled'}"`,
      `"${r.donorName || '-'}"`,
      r.giftType || '-',
      r.amount || 0,
      r.currency || 'NGN',
      r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '-',
      r.status || 'DRAFT'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gift_requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Toolbar */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Requests</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Monitor and manage your historical institutional gift submissions</p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by donor, title, or ID..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-black outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
            />
          </div>
          
          <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
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

      {/* Main Container */}
      <main className="p-6 max-w-[1400px] mx-auto space-y-6">

        {/* 2. Quick Status Cards Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { 
              label: 'Active Pipeline Tracking', 
              value: `${activeCount} Processing`, 
              color: 'bg-indigo-50 text-[#5D5CFF]', 
              icon: Layers 
            },
            { 
              label: 'Total Approved Allocation', 
              value: `₦${totalApprovedAmount.toLocaleString()}`, 
              color: 'bg-emerald-50 text-emerald-500', 
              icon: CheckCircle 
            },
            { 
              label: 'Returned Disclosures', 
              value: `${rejectedCount} Rejected`, 
              color: 'bg-rose-50 text-rose-500', 
              icon: XCircle 
            },
          ].map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-xs">
                <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
                  <CardIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-none">{card.value}</div>
                  <div className="text-xs font-medium text-slate-400 mt-1">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Table Interface Control Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Action Header Row Controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Status Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit">
              {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button 
                onClick={exportToCSV}
                disabled={filteredRequests.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* 4. Responsive Data Table */}
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
                    <th className="py-3 px-6 font-semibold cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('id')}>
                      <span className="flex items-center gap-1.5">
                        Request ID <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('title')}>
                      <span className="flex items-center gap-1.5">
                        Title / Proposal <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold">Donor / Entity</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('amount')}>
                      <span className="flex items-center gap-1.5">
                        Financial Value <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center gap-1.5">
                        Filing Date <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold">State</th>
                    <th className="py-3 px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map((row) => {
                    const isDraft = row.status === 'DRAFT' || !row.status;
                    const isApproved = row.status === 'APPROVED';
                    const isRejected = row.status === 'REJECTED';

                    let badgeColors = 'bg-amber-50 text-amber-700';
                    let statusLabel = row.status || 'Draft';

                    if (isApproved) {
                      badgeColors = 'bg-emerald-50 text-emerald-700';
                      statusLabel = 'Approved';
                    } else if (isRejected) {
                      badgeColors = 'bg-rose-50 text-rose-700';
                      statusLabel = 'Rejected';
                    } else if (isDraft) {
                      badgeColors = 'bg-slate-100 text-slate-600';
                      statusLabel = 'Draft';
                    }

                    const formattedDate = row.createdAt 
                      ? new Date(row.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '—';

                    const formattedAmount = row.amount 
                      ? `${row.currency || '₦'}${Number(row.amount).toLocaleString()}` 
                      : '—';

                    const actionHref = isDraft
                      ? `/request-form?draftId=${row.id}`
                      : `/requests/${row.id}`;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6 font-bold text-[#5D5CFF] text-xs">
                          #{row.id.slice(-6).toUpperCase()}
                        </td>
                        
                        <td className="py-4 px-4 font-bold text-slate-800 text-xs">
                          {row.title || 'Untitled Proposal'}
                        </td>

                        <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                          {row.donorName || '—'}
                        </td>
                        
                        <td className="py-4 px-4 text-xs font-medium text-slate-400">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                            {row.giftType || 'Prize'}
                          </span>
                        </td>
                        
                        <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                          {formattedAmount}
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-400 font-medium">
                          {formattedDate}
                        </td>
                        
                        <td className="py-4 px-4">
                          <span className={`inline-block w-24 text-center py-1 text-[11px] font-bold rounded-lg ${badgeColors}`}>
                            {statusLabel}
                          </span>
                        </td>
                        
                        <td className="py-4 px-6 text-right">
                          <Link 
                            href={actionHref}
                            className="text-slate-400 hover:text-[#5D5CFF] transition-colors p-1.5 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center"
                            title={isDraft ? "Edit Draft" : "View Details"}
                          >
                            {isDraft ? (
                              <Edit3 className="h-4 w-4 text-[#5D5CFF]" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
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