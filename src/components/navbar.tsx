"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Gift, Bell, ChevronDown, LogOut, User, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get initials (e.g., "Dr. Kunle" -> "DK", "Sarah Jenkins" -> "SJ")
  const getInitials = (name?: string | null) => {
    if (!name) return "GF";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const user = session?.user;
  const userRole = user?.role || "DEPARTMENT_SUBMITTER";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF] shadow-sm">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Gift<span className="text-[#5D5CFF]">Flow</span>
            </span>
          </div>
        </div>

        {/* Right: Actions & Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Notifications Button */}
          <button 
            type="button" 
            aria-label="View notifications"
            className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#5D5CFF]" />
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {status === "loading" ? (
              <div className="flex items-center gap-3 py-1">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden sm:block space-y-1">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : user ? (
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-1.5 pr-2.5 text-left transition-all hover:bg-slate-100/80 focus:outline-none"
              >
                {/* User Avatar Initials */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D5CFF] text-xs font-bold text-white shadow-sm">
                  {getInitials(user.name)}
                </div>

                {/* Name & Role Badge (Desktop) */}
                <div className="hidden flex-col sm:flex">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user.name || "User Account"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                    <ShieldCheck className="h-3 w-3 text-[#5D5CFF]" />
                    {userRole.replace(/_/g, " ")}
                  </span>
                </div>

                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
            ) : null}

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 transition-all">
                
                {/* Header Info (Visible on small screens) */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="mt-1.5 inline-block rounded-md bg-[#5D5CFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5D5CFF]">
                    {userRole.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Account Settings
                  </button>
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* Sign Out Action */}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}