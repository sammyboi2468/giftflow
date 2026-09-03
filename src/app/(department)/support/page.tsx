"use client";
import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Send,
  ArrowUpRight
} from 'lucide-react';

export default function HelpSupportPage() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Tailored FAQs for Gift Submissions
  const faqs = [
    {
      category: "Gift Classifications",
      title: "What is the difference between a Pledge and Cash gift?",
      desc: "A Cash gift is immediately received liquid value, whereas a Pledge represents a legally committed donation timeline distributed across future milestone quarters."
    },
    {
      category: "Processing & Pipelines",
      title: "Why is my request stuck in the 'Gifts Committee' stage?",
      desc: "The Gifts & Donation Committee meets bi-weekly to audit asset disclosures exceeding $100,000. High-value filings typically wait for this structured validation layout."
    },
    {
      category: "Drafts & Revisions",
      title: "Can I modify a gift request after clicking submit?",
      desc: "Once submitted, the details lock to preserve audit tracking. If revisions are mandatory, contact your assigned Advancement Officer to return it to your 'Drafts' deck."
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Static Demo: Ticket submitted!\nSubject: ${ticketSubject}`);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Toolbar Component */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Help & Support</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Access platform documentation guidelines or open a technical assistance query</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search help articles..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
            />
          </div>
          
          <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </button>

          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
            alt="Sarah Mitchell" 
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
          />
        </div>
      </header>

      {/* Main Split Layout Workspace */}
      <main className="p-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column Stack: Knowledge Guides & FAQs (Takes 2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section Subtitle */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#5D5CFF]" />
              Frequently Answered Inquiries
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Quickly resolve processing roadblocks and compliance rules</p>
          </div>

          {/* Cards Loop Grid layout */}
          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2.5 hover:border-slate-200/80 transition-colors">
                <span className="px-2 py-0.5 text-[9px] font-bold text-[#5D5CFF] bg-[#5D5CFF]/10 rounded border border-[#5D5CFF]/5 uppercase tracking-wide">
                  {faq.category}
                </span>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
                  {faq.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {faq.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Institutional External Policy Documents Documentation Links Layout link blocks */}
          <div className="bg-[#5D5CFF]/5 border border-[#5D5CFF]/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#5D5CFF]" />
                Institutional Gift Policy Guidelines.pdf
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Review official parameters governing legal compliance, naming rights, and endowment structures.</p>
            </div>
            <button className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5D5CFF] hover:underline shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
              Open Document <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

        </div>

        {/* Right Column Stack: Help Ticket Creator Input Module (Takes 1/3 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5 lg:col-span-1">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#5D5CFF]" />
              Contact Administration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit an internal service desk ticket to resolve processing errors</p>
          </div>

          {/* Ticket Input Form component structures element tracks */}
          <form onSubmit={handleTicketSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subject Header</label>
              <input 
                type="text" 
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g., Cannot modify cost center field" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all placeholder-slate-400" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Message Details</label>
              <textarea 
                required
                rows={5}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your layout behavior or administrative access issue in full detail..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-medium outline-none focus:border-[#5D5CFF] focus:bg-white transition-all placeholder-slate-400 resize-none leading-relaxed"
              />
            </div>

            <button 
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D5CFF] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all transform active:scale-95 w-full text-center"
            >
              <Send className="h-3.5 w-3.5" />
              Transmit Support Ticket
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}