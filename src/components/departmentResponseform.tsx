"use client";

import React, { useState } from "react";
import { submitDepartmentResponse } from "@/app/actions/department-actions";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileCheck,
  X,
  Send,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DepartmentResponseFormProps {
  applicationId: string;
  currentStatus?: string;
  decisionExtractUrl?: string | null;
}

export default function DepartmentResponseForm({
  applicationId,
  currentStatus,
  decisionExtractUrl,
}: DepartmentResponseFormProps) {
  const router = useRouter();

  const [responseType, setResponseType] = useState<"ACKNOWLEDGE" | "PROVIDE_INFO">("ACKNOWLEDGE");
  const [responseText, setResponseText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: { url?: string; originalName?: string; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      if (data.url) {
        setAttachmentUrl(data.url);
        setAttachmentName(data.originalName || file.name);
        toast.success("Document Uploaded", {
          description: `${file.name} attached successfully.`,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to upload document";
      setError(errorMsg);
      toast.error("Upload Failed", { description: errorMsg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!responseText.trim()) {
      const msg = "Please provide a response statement or acknowledgement notes.";
      setError(msg);
      toast.error("Action Required", { description: msg });
      return;
    }

    setLoading(true);

    const result = await submitDepartmentResponse({
      applicationId,
      responseType,
      responseText,
      attachmentUrl: attachmentUrl || undefined,
    });

    setLoading(false);

    if (!result.success) {
      const errMsg = result.error || "Failed to submit response.";
      setError(errMsg);
      toast.error("Submission Failed", { description: errMsg });
      return;
    }

    toast.success("Response Submitted", {
      description: "Your department's response has been sent to Senate for further processing.",
    });

    // Success -- this request no longer needs the department's attention,
    // so navigate back to the dashboard instead of just refreshing in
    // place (router.refresh() alone never actually takes you anywhere).
    setSubmitted(true);
    router.push("/dashboard");
    router.refresh();
  };

  if (submitted) {
    return (
      <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center font-sans shadow-sm sm:p-6">
        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
        <p className="text-sm font-bold text-emerald-900">
          Response submitted -- redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 font-sans shadow-sm sm:p-6">
      {/* Header: the Decision Extract button drops below the text on phones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-800">
            Action Required
          </span>
          <h3 className="mt-2 text-base font-bold text-slate-900">Awaiting Department Response</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Review the issued Decision Extract and submit your official acknowledgement or required
            documentation.
          </p>
        </div>

        {decisionExtractUrl && (
          <a
            href={decisionExtractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5D5CFF] px-3.5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#4c4be6] sm:w-auto sm:py-2"
          >
            <FileText className="h-4 w-4" />
            View Decision Extract
          </a>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Type Selection */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setResponseType("ACKNOWLEDGE")}
            className={`cursor-pointer rounded-xl border p-3 text-left text-xs transition-all ${
              responseType === "ACKNOWLEDGE"
                ? "border-[#5D5CFF] bg-white font-bold text-slate-900 ring-2 ring-[#5D5CFF]/20"
                : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            <div className="font-semibold text-slate-900">1. Acknowledge Decision</div>
            <div className="mt-0.5 text-[11px] font-normal text-slate-500">
              Confirm receipt and accept the terms of the decision extract.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setResponseType("PROVIDE_INFO")}
            className={`cursor-pointer rounded-xl border p-3 text-left text-xs transition-all ${
              responseType === "PROVIDE_INFO"
                ? "border-[#5D5CFF] bg-white font-bold text-slate-900 ring-2 ring-[#5D5CFF]/20"
                : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            <div className="font-semibold text-slate-900">2. Provide Requested Info / Docs</div>
            <div className="mt-0.5 text-[11px] font-normal text-slate-500">
              Submit additional details or documents requested by Senate/Council.
            </div>
          </button>
        </div>

        {/* Response Text area (text-base on phones stops iOS zoom-on-focus) */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Department Response & Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={
              responseType === "ACKNOWLEDGE"
                ? "e.g., The Department of Computer Science hereby acknowledges receipt of the decision extract and accepts the approved terms..."
                : "e.g., Providing the revised project budget breakdown as requested in section B of the decision extract..."
            }
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 outline-none focus:border-[#5D5CFF] sm:text-xs"
          />
        </div>

        {/* Optional Document Attachment */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Attach Additional Information (Optional)
          </label>

          {!attachmentUrl ? (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 transition-all hover:border-[#5D5CFF]">
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5D5CFF]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading file...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 shrink-0 text-[#5D5CFF]" />
                  <span className="text-center text-xs font-medium text-slate-600">
                    Upload supporting PDF / document
                  </span>
                </>
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
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs">
              {/* min-w-0 + truncate keeps long filenames from pushing the remove button off-screen */}
              <div className="flex min-w-0 items-center gap-2">
                <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate font-medium text-emerald-900">{attachmentName}</span>
              </div>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => {
                  setAttachmentUrl("");
                  setAttachmentName("");
                  toast.info("Attachment removed.");
                }}
                className="shrink-0 p-1.5 text-slate-400 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button: full width on phones */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || isUploading}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-3 text-xs font-semibold text-white transition-all hover:bg-[#4c4be6] disabled:opacity-50 sm:w-auto sm:py-2.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Official Department Response
          </button>
        </div>
      </form>
    </div>
  );
}