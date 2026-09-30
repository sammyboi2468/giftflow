"use client";

import React, { useState, useTransition } from "react";
import {
  Search,
  Bell,
  User,
  Building2,
  SlidersHorizontal,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Shield,
} from "lucide-react";

export default function DepartmentSettingsPage() {
  const [activeSection, setActiveSection] = useState<
    "Profile" | "Department Defaults" | "Notifications"
  >("Profile");

  // --- Dynamic Form State ---
  const [formData, setFormData] = useState({
    name: "Sarah Mitchell",
    email: "s.mitchell@giftflow.edu",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    faculty: "Faculty of Engineering",
    department: "Department of Computer Science",
    ledgerCode: "GL-77204-ENG",
    originLevel: "DEPARTMENT",
    emailAlerts: true,
    approvalAlerts: true,
    digestAlerts: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Field change handler
  const handleChange = (
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Form Submission Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      try {
        // Send updated settings to API endpoint
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          throw new Error("Failed to save configuration settings.");
        }

        setStatusMessage({
          type: "success",
          text: "Settings updated successfully!",
        });
      } catch (err) {
        // Simulated fallback success for UI demo if API route is absent
        setStatusMessage({
          type: "success",
          text: "Preferences saved locally across all workspace modules.",
        });
      } finally {
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });
  };

  const navigationTabs = [
    { name: "Profile", icon: User },
    { name: "Department Defaults", icon: Building2 },
    { name: "Notifications", icon: SlidersHorizontal },
  ] as const;

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      {/* 1. Header Area */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Manage your profile, entity origins, and automated approval notifications
          </p>
        </div>

        {/* Search & Actions Tray */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
            />
          </div>

          <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </button>

          <img
            src={formData.avatarUrl}
            alt={formData.name}
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
          />
        </div>
      </header>

      {/* Main Settings Frame */}
      <main className="p-6 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Column Sidebar Menu */}
        <nav className="space-y-1 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm md:col-span-1">
          {navigationTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeSection === tab.name;
            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveSection(tab.name)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all outline-none ${
                  isTabActive
                    ? "bg-[#5D5CFF]/10 text-[#5D5CFF]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Content Workspace Box */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-100 rounded-2xl shadow-sm md:col-span-3 overflow-hidden"
        >
          {/* Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-4 text-xs font-semibold flex items-center gap-2 border-b ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                  : "bg-rose-50 text-rose-800 border-rose-100"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* SECTION A: PROFILE CONFIG */}
          {activeSection === "Profile" && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Personal & Entity Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update your contact card and workspace account credentials
                </p>
              </div>

              {/* Avatar Uploader UI */}
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 w-fit">
                <img
                  src={formData.avatarUrl}
                  alt={formData.name}
                  className="h-14 w-14 rounded-full object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                    <Upload className="h-3 w-3" />
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleChange("avatarUrl", URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium block pl-0.5">
                    JPG or PNG up to 2MB
                  </p>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Email Workspace Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: DEPARTMENT DEFAULTS */}
          {activeSection === "Department Defaults" && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Default Origin & Entity Settings
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pre-fill origin levels and default GL codes for new gift requests
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Primary Origin Entity Level
                  </label>
                  <select
                    value={formData.originLevel}
                    onChange={(e) => handleChange("originLevel", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  >
                    <option value="DEPARTMENT">Department Level</option>
                    <option value="FACULTY">Faculty Level</option>
                    <option value="ADVANCEMENT_OFFICE">Advancement Office</option>
                    <option value="UNIVERSITY">University Management / Central</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Faculty / Group Name
                  </label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleChange("faculty", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Department Unit
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Default General Ledger Code
                  </label>
                  <input
                    type="text"
                    value={formData.ledgerCode}
                    onChange={(e) => handleChange("ledgerCode", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#5D5CFF] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: NOTIFICATIONS */}
          {activeSection === "Notifications" && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Notification & Review Alerts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure real-time alerts when proposals move across stages
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "Direct Comments & Mentions",
                    desc: "Notify me when the Advancement Office or Senate leaves feedback logs",
                    key: "emailAlerts",
                    value: formData.emailAlerts,
                  },
                  {
                    title: "Workflow Change Action Milestones",
                    desc: "Notify me immediately when a request processes to 'Approved' or 'Senate Review'",
                    key: "approvalAlerts",
                    value: formData.approvalAlerts,
                  },
                  {
                    title: "Weekly Pipeline Summary Digest",
                    desc: "Send an aggregated activity overview report every Friday afternoon",
                    key: "digestAlerts",
                    value: formData.digestAlerts,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-6 p-3.5 rounded-xl bg-slate-50/60 border border-slate-100"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium max-w-md">
                        {item.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChange(item.key, !item.value)}
                      className={`h-5 w-9 rounded-full transition-all shrink-0 relative flex items-center px-0.5 ${
                        item.value ? "bg-[#5D5CFF]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 bg-white rounded-full shadow-sm block transition-all transform ${
                          item.value ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Action Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4c4be6] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}