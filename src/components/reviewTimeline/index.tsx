"use client";

import React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Send, 
  MessageSquare,
  UserCheck
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
      <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
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
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Audit Trail & Governance Timeline
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {logs.map((log) => {
          const config = getActionConfig(log.action);
          const Icon = config.icon;
          const reviewerName = log.user?.name || log.user?.email || "System User";
          const logNote = log.notes || log.details;

          return (
            <div key={log.id} className="relative group">
              {/* Timeline Indicator Node */}
              <div
                className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-3 h-3 ${config.color}`} />
              </div>

              {/* Log Entry Content Card */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold capitalize ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  By: <span className="text-slate-200 font-medium">{reviewerName}</span>
                </div>

                {logNote && (
                  <div className="mt-2 bg-[#1E293B]/60 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 italic flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{logNote}</span>
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