"use client";

import { useState } from "react";
import { processApplicationReview } from "@/app/actions/review-actions";
import { AlertCircle, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface ReviewModalProps {
  applicationId: string;
  currentStage: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({
  applicationId,
  currentStage,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Enforce mandatory comment on rejection
    if (decision === "REJECT" && !comment.trim()) {
      setError("Please provide a reason for rejecting this application.");
      return;
    }

    setIsSubmitting(true);

    // Map next status state based on current stage and decision
    let nextStatus = "CLOSED_APPROVED";
    if (decision === "REJECT") {
      nextStatus = "CLOSED_REJECTED";
    } else if (currentStage === "advancement") {
      nextStatus = "PROCESSING_BY_SENATE_DIVISION";
    } else if (currentStage === "senate") {
      nextStatus = "UNDER_COUNCIL_REVIEW";
    }

    const res = await processApplicationReview({
      applicationId,
      decision,
      comment,
      nextStatus,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "An error occurred while saving your decision.");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#5D5CFF]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Process Application Decision</h3>
              <p className="text-xs text-slate-500">Record approval or rejection feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("APPROVE")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  decision === "APPROVE"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Approve & Forward
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECT")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  decision === "REJECT"
                    ? "border-rose-500 bg-rose-50/50 text-rose-700 ring-1 ring-rose-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <XCircle className="h-4 w-4" />
                Reject Application
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {decision === "REJECT" ? "Reason for Rejection (Required)" : "Review Notes / Comments (Optional)"}
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                decision === "REJECT"
                  ? "Specify why this application is rejected..."
                  : "Add internal notes or recommendations for the next committee..."
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none transition-all focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all ${
                decision === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[#5D5CFF] hover:bg-[#4c4be6]"
              } disabled:opacity-50`}
            >
              {isSubmitting ? "Processing..." : decision === "REJECT" ? "Confirm Rejection" : "Submit Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}