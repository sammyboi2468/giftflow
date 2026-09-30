"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Send,
  MessageSquare,
  UserCheck,
} from "lucide-react";

export interface ActivityLogItem {
  id: string;
  action: string;
  details?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  user?: {
    name: string | null;
    email: string | null;
  } | null;
}

interface ReviewTimelineProps {
  logs: ActivityLogItem[];
}

export function ReviewTimeline({ logs }: ReviewTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-center text-xs text-slate-500">
        No audit activity recorded yet.
      </div>
    );
  }

  // Map action strings to UI colors and icons
  const getActionConfig = (action: string) => {
    if (action.includes("APPROVED")) {
      return {
        icon: CheckCircle2,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        label: action.replace(/_/g, " "),
      };
    }
    if (action.includes("REJECTED")) {
      return {
        icon: XCircle,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
        borderColor: "border-rose-500/30",
        label: action.replace(/_/g, " "),
      };
    }
    if (action.includes("REVISION")) {
      return {
        icon: RotateCcw,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        label: action.replace(/_/g, " "),
      };
    }
    if (action.includes("SUBMITTED")) {
      return {
        icon: Send,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/30",
        label: "Proposal Submitted",
      };
    }
    return {
      icon: UserCheck,
      color: "text-slate-400",
      bgColor: "bg-slate-800",
      borderColor: "border-slate-700",
      label: action.replace(/_/g, " "),
    };
  };

  return (
    <div className="min-w-0 space-y-4">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
        Audit Trail & Governance Timeline
      </h4>

      <div className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-800 sm:space-y-6">
        {logs.map((log) => {
          const config = getActionConfig(log.action);
          const Icon = config.icon;
          const reviewerName = log.user?.name || log.user?.email || "System User";
          const logNote = log.notes || log.details;

          return (
            <div key={log.id} className="group relative">
              {/* Timeline Indicator Node */}
              <div
                className={`absolute -left-6 top-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${config.bgColor} ${config.borderColor}`}
              >
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>

              {/* Log Entry Content Card */}
              <div className="min-w-0 space-y-1.5 rounded-xl border border-slate-800 bg-[#0F172A] p-3 sm:p-3.5">
                {/* Label + timestamp: stacked on phones, inline from sm up */}
                <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className={`break-words font-semibold capitalize ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="break-words text-xs text-slate-400">
                  By: <span className="font-medium text-slate-200">{reviewerName}</span>
                </div>

                {logNote && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-slate-800/80 bg-[#1E293B]/60 p-2.5 text-xs italic text-slate-300">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="min-w-0 break-words">{logNote}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}