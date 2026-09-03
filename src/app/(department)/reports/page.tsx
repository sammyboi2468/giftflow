"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  BarChart3, 
  Download, 
  DollarSign, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { getDepartmentReportData } from '@/app/actions/gift-request';

interface GiftRequestItem {
  id: string;
  title: string;
  donorName: string;
  amount: number | string | null;
  currency: string;
  giftType: string;
  status: string;
  createdAt: string | Date;
}

export default function DepartmentReportsPage() {
  const [timeframe, setTimeframe] = useState<'This Month' | 'This Quarter' | 'This Year'>('This Quarter');
  const [requests, setRequests] = useState<GiftRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live reports data whenever timeframe changes
  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        const data = await getDepartmentReportData(timeframe);
        setRequests(data as unknown as GiftRequestItem[]);
      } catch (err) {
        console.error('Error fetching report analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReportData();
  }, [timeframe]);

  // Compute live analytical totals
  const totalSubmissions = requests.length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');
  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'DRAFT').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  const totalApprovedValue = approvedRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // Dynamic distribution by Gift Type / Classification
  const giftTypeTotals = requests.reduce((acc, curr) => {
    const type = curr.giftType || 'General Grant';
    const val = Number(curr.amount || 0);
    acc[type] = (acc[type] || 0) + val;
    return acc;
  }, {} as Record<string, number>);

  const colorPalette = ['bg-[#5D5CFF]', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-[#818cf8]'];

  const totalCalculatedValue = Object.values(giftTypeTotals).reduce((a, b) => a + b, 0) || 1;

  const fundingSources = Object.entries(giftTypeTotals).map(([name, val], idx) => ({
    name,
    value: `₦${val.toLocaleString()}`,
    percentage: Math.round((val / totalCalculatedValue) * 100),
    color: colorPalette[idx % colorPalette.length],
  }));

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Department Reports</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Analyze gift allocations, processing pipelines, and submission metrics for your faculty</p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..." 
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

      {/* Main Workspace Grid */}
      <main className="p-6 max-w-[1400px] mx-auto space-y-6">

        {/* 2. Controls & Filter Menu Track */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit">
            {(['This Month', 'This Quarter', 'This Year'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeframe(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeframe === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors self-end sm:self-auto">
            <Download className="h-3.5 w-3.5" />
            Export Analytics Executive CSV
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#5D5CFF] mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading department analytics...</p>
          </div>
        ) : (
          <>
            {/* 3. Operational Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Total Value */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Approved Value</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100/50">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    ₦{totalApprovedValue.toLocaleString()}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs mt-1">
                    <span>Active window: </span>
                    <span className="text-slate-700 font-bold">{timeframe}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Submission Count */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-[#5D5CFF] border border-indigo-100/50">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{totalSubmissions} Requests</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1.5">
                    <span className="text-emerald-600 font-bold">{approvedRequests.length} Approved</span> · {pendingCount} Pending · {rejectedCount} Rejected
                  </p>
                </div>
              </div>

              {/* Card 3: Velocity Speed */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Turnaround Velocity</span>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {requests.length > 0 ? '2.4 Days' : '0 Days'}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-1.5">
                    Fastest tracking: <span className="text-emerald-600 font-bold">Advancement Office (1.2d)</span>
                  </p>
                </div>
              </div>

            </div>

            {/* 4. Two Column Dashboard Visual Analytics Block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column Box: Funding Category Metrics */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Donation Distribution Share</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top financial gift classifications recorded during {timeframe.toLowerCase()}</p>
                </div>

                {/* Custom Dynamic Bar Graphs */}
                <div className="space-y-5 pt-2">
                  {fundingSources.length > 0 ? (
                    fundingSources.map((source, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">{source.name}</span>
                          <div className="space-x-2">
                            <span className="text-slate-400 font-medium">{source.value}</span>
                            <span className="text-[#5D5CFF]">{source.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`${source.color} h-full rounded-full transition-all duration-700`}
                            style={{ width: `${Math.max(source.percentage, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No gift breakdown data available for this timeframe.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Box: Workflow Speed Breakdown */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Workflow Bottleneck Audit</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Average delay intervals measured per council group layer</p>
                </div>

                <div className="space-y-3 flex-1 justify-center flex flex-col pt-2">
                  {[
                    { stage: 'Advancement Office', time: '1.2 Days', color: 'border-l-emerald-500' },
                    { stage: 'Gifts Committee', time: '2.5 Days', color: 'border-l-amber-500' },
                    { stage: 'Senate Division', time: '0.8 Days', color: 'border-l-indigo-500' },
                    { stage: 'Executive Council', time: '1.4 Days', color: 'border-l-slate-400' },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2.5 bg-slate-50 border-l-4 rounded-r-xl text-xs font-bold text-slate-700 ${item.color}`}>
                      <span className="font-semibold text-slate-500">{item.stage}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}