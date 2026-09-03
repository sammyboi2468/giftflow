"use client";
import React from "react";
import Sidebar from "../../components/SidebarDepartment/page";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar persists on all internal pages */}
      <Sidebar />

      {/* Changes depending on whether they click Dashboard, Reports, etc. */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}