// src/components/DevRoleSwitcher.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DevRoleSwitcher() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs backdrop-blur-md">
      <span className="font-bold text-indigo-400 uppercase tracking-wider">🛠️ Dev Mode:</span>
      
      <Link
        href="/dashboard"
        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
          pathname.startsWith("/dashboard")
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        Applicant View (`/dashboard`)
      </Link>

      <Link
        href="/reviewer"
        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
          pathname.startsWith("/reviewer")
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
      >
        Reviewer Portal (`/reviewer`)
      </Link>
    </div>
  );
}