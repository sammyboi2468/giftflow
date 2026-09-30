"use client";

import { useState } from "react";
import { RequestStatus } from "@prisma/client";
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

  const normalizedStage = currentStage.toLowerCase();
  // Senate approvals require an official Decision Extract to be uploaded
  // (see ReviewActionForm). This quick modal has no file upload, so it
  // can't fulfill that requirement -- block approval here rather than
  // silently writing an incomplete/invalid approval.
  const blocksApproveHere = normalizedStage === "senate";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (decision === "REJECT" && !comment.trim()) {
      setError("Please provide a reason for rejecting this application.");
      return;
    }

    if (decision === "APPROVE" && blocksApproveHere) {
      setError(
        "Senate approvals require uploading an official Decision Extract. Please use the full review page for this stage instead."
      );
      return;
    }

    setIsSubmitting(true);

    // Map next status based on current stage and decision, using real
    // RequestStatus enum values (matching STAGE_NEXT_STATUS_MAP elsewhere
    // in the app, not the invented strings this used to have).
    let nextStatus: RequestStatus = RequestStatus.APPROVED;
    if (decision === "REJECT") {
      nextStatus = RequestStatus.REJECTED;
    } else if (normalizedStage === "advancement") {
      nextStatus = RequestStatus.SENATE_REVIEW;
    } else if (normalizedStage === "senate") {
      nextStatus = RequestStatus.AWAITING_DEPARTMENT_RESPONSE;
    } else if (normalizedStage === "senate-processing") {
      nextStatus = RequestStatus.COUNCIL_REVIEW;
    }
    // "council" (and anything else) falls through to APPROVED, matching
    // the real flow where Council is the final stage.

    const res = await processApplicationReview({
      applicationId,
      decision,
      comment,
      nextStatus,
      stage: currentStage,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "An error occurred while saving your decision.");
    } else {
      onClose();
    }
  };

  return (
    // Overlay: bottom sheet on phones, centered dialog from sm up
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      {/* Panel scrolls internally so it never exceeds the viewport (keyboard-safe) */}
      <div className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:space-y-5 sm:rounded-2xl sm:p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#5D5CFF]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 id="review-modal-title" className="text-base font-bold text-slate-900">
                Process Application Decision
              </h3>
              <p className="text-xs text-slate-500">Record approval or rejection feedback</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {blocksApproveHere && !error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Approving at the Senate stage requires an official Decision Extract. Use the full
              review page to approve -- you can still reject here.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Decision</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDecision("APPROVE")}
                disabled={blocksApproveHere}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              {decision === "REJECT"
                ? "Reason for Rejection (Required)"
                : "Review Notes / Comments (Optional)"}
            </label>
            {/* text-base on phones stops iOS Safari zooming on focus */}
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                decision === "REJECT"
                  ? "Specify why this application is rejected..."
                  : "Add internal notes or recommendations for the next committee..."
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-base text-slate-900 outline-none transition-all focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-indigo-500/10 sm:text-xs"
            />
          </div>

          {/* Action Buttons: stacked (primary on top) on phones, inline from sm up */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 sm:w-auto sm:py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (decision === "APPROVE" && blocksApproveHere)}
              className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all sm:w-auto sm:py-2 ${
                decision === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[#5D5CFF] hover:bg-[#4c4be6]"
              } disabled:opacity-50`}
            >
              {isSubmitting
                ? "Processing..."
                : decision === "REJECT"
                ? "Confirm Rejection"
                : "Submit Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}