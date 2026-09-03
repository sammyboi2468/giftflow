"use client";
import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Building2, 
  SlidersHorizontal, 
  Save, 
  Mail, 
  Shield 
} from 'lucide-react';

export default function DepartmentSettingsPage() {
  const [activeSection, setActiveSection] = useState('Profile');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [digestAlerts, setDigestAlerts] = useState(false);

  const navigationTabs = [
    { name: 'Profile', icon: User },
    { name: 'Department Defaults', icon: Building2 },
    { name: 'Notifications', icon: SlidersHorizontal }
  ];

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Manage your user profile configuration and default workflow properties</p>
        </div>

        {/* Global Action Tray */}
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search settings..." 
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

      {/* Main Settings Two-Column Layout Frame */}
      <main className="p-6 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Column Sidebar Menu (1/4 Width) */}
        <nav className="space-y-1.5 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm md:col-span-1">
          {navigationTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeSection === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveSection(tab.name)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all outline-none ${
                  isTabActive 
                    ? 'bg-[#5D5CFF]/10 text-[#5D5CFF]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Column Workspace Frame Box (3/4 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm md:col-span-3 overflow-hidden">
          
          {/* SECTION A: PROFILE CONFIG */}
          {activeSection === 'Profile' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Personal Information</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Update your visual profile avatar card details</p>
              </div>

              {/* Avatar Editing Component UI */}
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200/80 w-fit">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
                  alt="Sarah Mitchell" 
                  className="h-14 w-14 rounded-full object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <button className="px-3 py-1.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    Change Photo
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium block pl-1">JPG or PNG up to 2MB</p>
                </div>
              </div>

              {/* Input Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input type="text" defaultValue="Sarah Mitchell" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Email Workspace Address</label>
                  <input type="email" defaultValue="s.mitchell@giftflow.edu" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: DEPARTMENT DEFAULTS */}
          {activeSection === 'Department Defaults' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Automation Preferences</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Pre-fill processing fields to optimize submitting new gift requests</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Primary Faculty / Group</label>
                  <input type="text" defaultValue="Faculty of Engineering" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Default General Ledger Ledger Code</label>
                  <input type="text" defaultValue="GL-77204-ENG" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: NOTIFICATIONS SLIDERS */}
          {activeSection === 'Notifications' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Filing Communications</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Determine how and when you get pinged on review milestones</p>
              </div>

              {/* Toggles List Stack Layout Component */}
              <div className="space-y-4">
                {[
                  { title: "Direct Comments & Mentions", desc: "Notify me when the Advancement Office leaves a direct item comment log", state: emailAlerts, toggle: setEmailAlerts },
                  { title: "Workflow Change Action Milestones", desc: "Notify me immediately when a gift status processes to 'Approved' or 'Rejected'", state: approvalAlerts, toggle: setApprovalAlerts },
                  { title: "Weekly Pipeline Summary Digest", desc: "Send a clean aggregated activity briefing overview report ledger every Friday", state: digestAlerts, toggle: setDigestAlerts },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-6 p-3 rounded-xl bg-slate-50/40 border border-slate-100">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium max-w-md">{item.desc}</p>
                    </div>
                    {/* Toggle Button Graphic Shape Track */}
                    <button 
                      onClick={() => item.toggle(!item.state)}
                      className={`h-5 w-9 rounded-full transition-all shrink-0 relative flex items-center px-0.5 ${
                        item.state ? 'bg-[#5D5CFF]' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`h-4 w-4 bg-white rounded-full shadow-sm block transition-all transform ${
                        item.state ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Universal Sticky Form Action Action Save Footer Bar */}
          <div className="bg-slate-50 border-t border-slate-100/80 px-6 py-4 flex items-center justify-end">
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D5CFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all transform active:scale-95">
              <Save className="h-3.5 w-3.5" />
              Save Settings Profiles
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}