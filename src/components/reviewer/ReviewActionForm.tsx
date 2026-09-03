"use client";

import React, { useState } from "react";
import { RequestStatus } from "@prisma/client";
import { processApplicationReview } from "@/app/actions/review-actions";
import { uploadExtractFile } from "@/app/actions/upload-actions";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileCheck,
  X,
  ArrowRight,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface ReviewActionFormProps {
  applicationId: string;
  nextStatus: RequestStatus;
}

export default function ReviewActionForm({
  applicationId,
  nextStatus,
}: ReviewActionFormProps) {
  const router = useRouter();
  const params = useParams();

  const [comment, setComment] = useState("");
  const [extractUrl, setExtractUrl] = useState<string>("");
  const [extractFileName, setExtractFileName] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stage = (params?.stage as string)?.toLowerCase() || "";
  const isSenateInitial = stage === "senate";
  const isSenateProcessing = stage === "senate-processing";

  // File Upload Handler via Server Action
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputTarget = e.target;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadExtractFile(formData);

      if (!result.success || !result.url) {
        throw new Error(result.error || "Failed to upload document");
      }

      setExtractUrl(result.url);
      setExtractFileName(result.originalName || file.name);

      toast.success("Document Uploaded", {
        description: `${file.name} attached successfully.`,
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to upload extract document";
      setError(errorMsg);
      toast.error("Upload Failed", { description: errorMsg });
    }  finally {
      setIsUploading(false);
      inputTarget.value = "";
    }
  };

  const removeUploadedFile = () => {
    setExtractUrl("");
    setExtractFileName("");
    toast.info("Extract document removed.");
  };

  const handleDecision = async (
    decision: "APPROVE" | "REJECT" | "REQUEST_INFO"
  ) => {
    setError(null);

    if (
      (decision === "REJECT" || decision === "REQUEST_INFO") &&
      !comment.trim()
    ) {
      const msg = "Please provide a comment explaining your decision.";
      setError(msg);
      toast.error("Action Required", { description: msg });
      return;
    }

    if (isSenateInitial && decision === "REQUEST_INFO" && !extractUrl) {
      const msg =
        "An official Decision Extract document must be uploaded when requesting department revisions.";
      setError(msg);
      toast.error("Missing Document", { description: msg });
      return;
    }

    setLoading(true);

    // 🎯 DYNAMIC STATUS DETERMINATION
    let targetNextStatus: RequestStatus = nextStatus;

    if (decision === "APPROVE") {
      if (isSenateInitial || isSenateProcessing) {
        targetNextStatus = RequestStatus.COUNCIL_REVIEW; // Forward directly to Council
      }
    } else if (decision === "REQUEST_INFO") {
      targetNextStatus = RequestStatus.SENATE_PROCESSING; // Send to Department
    } else if (decision === "REJECT") {
      targetNextStatus = RequestStatus.REJECTED;
    }

    try {
      const result = await processApplicationReview({
        applicationId,
        decision,
        comment,
        nextStatus: targetNextStatus,
        decisionExtractUrl:
          isSenateInitial && decision === "REQUEST_INFO" ? extractUrl : undefined,
        stage,
      });

      if (!result.success) {
        const errMsg = result.error || "An unexpected error occurred.";
        setError(errMsg);
        toast.error("Review Failed", { description: errMsg });
        setLoading(false);
        return;
      }

      const toastMessage =
        decision === "APPROVE"
          ? "Application approved and progressed."
          : decision === "REQUEST_INFO"
          ? "Decision extract issued and sent to department."
          : "Application rejected.";

      toast.success("Review Submitted", { description: toastMessage });

      router.refresh();
      router.push(stage ? `/reviewer/${stage}` : "/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast.error("Submission Error", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 font-sans">
      <h3 className="text-base font-bold text-slate-900">Take Review Action</h3>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decision Extract File Picker (Only for Initial Senate Stage when requesting department response) */}
      {isSenateInitial && (
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
          <div>
            <label className="block text-xs font-bold text-indigo-950">
              Upload Decision Extract Document{" "}
              <span className="text-amber-600">
                (Required if requesting department response)
              </span>
            </label>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Attach an official Decision Extract document if you plan to click
              &quot;Request Department Response&quot;.
            </p>
          </div>

          {!extractUrl ? (
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-200 bg-white rounded-xl cursor-pointer hover:border-[#5D5CFF] hover:bg-indigo-50/20 transition-all">
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5D5CFF]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading extract...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <UploadCloud className="h-6 w-6 text-[#5D5CFF]" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to browse or drop file here
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PDF, DOC, or DOCX (Max 10MB)
                  </span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900">{extractFileName}</p>
                  <p className="text-[10px] text-emerald-700">
                    File uploaded and attached successfully
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeUploadedFile}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comment / Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Reviewer Notes / Sitting Details
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add comments or notes regarding the decision..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 outline-none focus:border-[#5D5CFF] focus:bg-white resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          disabled={loading || isUploading}
          onClick={() => handleDecision("APPROVE")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
          {isSenateInitial || isSenateProcessing
            ? "Approve & Forward to Council"
            : "Approve & Issue Decision"}
        </button>

        {isSenateInitial && (
          <button
            type="button"
            disabled={loading || isUploading}
            onClick={() => handleDecision("REQUEST_INFO")}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            Issue Decision Extract (Request Dept Response)
          </button>
        )}

        <button
          type="button"
          disabled={loading || isUploading}
          onClick={() => handleDecision("REJECT")}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject Application
        </button>
      </div>
    </div>
  );
}