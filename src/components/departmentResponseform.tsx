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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2 font-sans text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
        <p className="text-sm font-bold text-emerald-900">Response submitted -- redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm space-y-5 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide">
            Action Required
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-2">
            Awaiting Department Response
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Review the issued Decision Extract and submit your official acknowledgement or required documentation.
          </p>
        </div>

        {decisionExtractUrl && (
          <a
            href={decisionExtractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4c4be6] transition-all shrink-0 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            View Decision Extract
          </a>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResponseType("ACKNOWLEDGE")}
            className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              responseType === "ACKNOWLEDGE"
                ? "border-[#5D5CFF] bg-white font-bold text-slate-900 ring-2 ring-[#5D5CFF]/20"
                : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            <div className="font-semibold text-slate-900">1. Acknowledge Decision</div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              Confirm receipt and accept the terms of the decision extract.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setResponseType("PROVIDE_INFO")}
            className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              responseType === "PROVIDE_INFO"
                ? "border-[#5D5CFF] bg-white font-bold text-slate-900 ring-2 ring-[#5D5CFF]/20"
                : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            <div className="font-semibold text-slate-900">2. Provide Requested Info / Docs</div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              Submit additional details or documents requested by Senate/Council.
            </div>
          </button>
        </div>

        {/* Response Text area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
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
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-[#5D5CFF] resize-none"
          />
        </div>

        {/* Optional Document Attachment */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Attach Additional Information (Optional)
          </label>

          {!attachmentUrl ? (
            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 bg-white rounded-xl cursor-pointer hover:border-[#5D5CFF] transition-all">
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5D5CFF]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading file...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 text-[#5D5CFF]" />
                  <span className="text-xs text-slate-600 font-medium">
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
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-900">{attachmentName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachmentUrl("");
                  setAttachmentName("");
                  toast.info("Attachment removed.");
                }}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4c4be6] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Official Department Response
          </button>
        </div>
      </form>
    </div>
  );
}