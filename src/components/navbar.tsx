"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Gift, Bell, ChevronDown, LogOut, User, ShieldCheck, Menu } from "lucide-react";

interface NavbarProps {
  /** When provided, a hamburger button is shown below the lg breakpoint (opens the sidebar drawer). */
  onMenuClick?: () => void;
  /** Keeps aria-expanded on the hamburger in sync with the drawer. */
  menuOpen?: boolean;
}

export default function Navbar({ onMenuClick, menuOpen = false }: NavbarProps) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside tap/click (pointerdown covers mouse, touch and pen)
  // and on Escape.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
        {/* Left: Hamburger (below lg, only if a drawer exists) + Brand / Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5CFF] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5D5CFF] shadow-sm">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Gift<span className="text-[#5D5CFF]">Flow</span>
            </span>
          </div>
        </div>

        {/* Right: Actions & Profile Dropdown */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Notifications Button (40px tap target on phones) */}
          <button
            type="button"
            aria-label="View notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5CFF] sm:h-9 sm:w-9"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#5D5CFF] sm:right-1.5 sm:top-1.5" />
          </button>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {status === "loading" ? (
              <div className="flex items-center gap-3 py-1">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden space-y-1 sm:block">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : user ? (
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-1 pr-2 text-left transition-all hover:bg-slate-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5CFF] sm:gap-3 sm:p-1.5 sm:pr-2.5"
              >
                {/* User Avatar Initials */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5D5CFF] text-xs font-bold text-white shadow-sm">
                  {getInitials(user.name)}
                </div>

                {/* Name & Role Badge (sm and up) */}
                <div className="hidden min-w-0 flex-col sm:flex">
                  <span className="max-w-[10rem] truncate text-xs font-semibold leading-tight text-slate-900">
                    {user.name || "User Account"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                    <ShieldCheck className="h-3 w-3 shrink-0 text-[#5D5CFF]" />
                    <span className="max-w-[9rem] truncate">{userRole.replace(/_/g, " ")}</span>
                  </span>
                </div>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : null}

            {/* Dropdown Menu: never wider than the viewport minus page padding */}
            {dropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-slate-900/5"
              >
                {/* Header Info (name/role live here on phones, where the button shows only the avatar) */}
                <div className="mb-1 border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                  <span className="mt-1.5 inline-block max-w-full truncate rounded-md bg-[#5D5CFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5D5CFF]">
                    {userRole.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:py-2"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Account Settings
                  </button>
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* Sign Out Action */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 sm:py-2"
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