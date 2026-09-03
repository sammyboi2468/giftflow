'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Gift,
  Save,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Wallet,
  Upload,
  Loader2,
  UploadCloud,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import {
  getUserGiftRequests,
  saveGiftRequestDraft,
  resubmitGiftRequest,
} from '@/app/actions/gift-request';

type FileUploadState = {
  file_deptRecommendation: File | null;
  file_signedForm: File | null;
  file_sponsorCV: File | null;
  file_citation: File | null;
  file_paymentReceipt: File | null;
};

const STEPS: { id: 1 | 2 | 3 | 4; label: string; icon: typeof FileText }[] = [
  { id: 1, label: 'General Info', icon: FileText },
  { id: 2, label: 'Financials', icon: Wallet },
  { id: 3, label: 'Documents', icon: Upload },
  { id: 4, label: 'Review & Resubmit', icon: CheckCircle2 },
];

interface GiftDocument {
  docType: string;
  fileName?: string | null;
  fileUrl?: string | null;
}

interface GiftRequestData {
  id: string;
  title?: string | null;
  donorName?: string | null;
  giftType?: string | null;
  department?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  purpose?: string | null;
  hasConflictOfInterest?: boolean | string | null;
  reviewComment?: string | null;
  documents?: GiftDocument[] | null;
  [key: string]: unknown;
}

type GiftRequestsResponse = GiftRequestData[] | GiftRequestData | null | undefined;

function extractFileName(url?: string | null): string {
  if (!url) return '';
  return url.split('/').pop() || '';
}

export default function RevisionForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionDepartment = session?.user?.department ?? '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviewerComments, setReviewerComments] = useState<string | null>(null);

  const requestIdRef = useRef<string>(requestId);

  const [formData, setFormData] = useState({
    title: '',
    donorName: '',
    giftType: 'Prize',
    amount: '',
    currency: 'NGN',
    purpose: '',
    hasConflict: 'false',
    ethicalClearance: false,
    revisionNotes: '',
  });

  const [files, setFiles] = useState<FileUploadState>({
    file_deptRecommendation: null,
    file_signedForm: null,
    file_sponsorCV: null,
    file_citation: null,
    file_paymentReceipt: null,
  });

  const [existingFileNames, setExistingFileNames] = useState<{ [key in keyof FileUploadState]?: string }>({});
  const [requestDepartment, setRequestDepartment] = useState<string | null>(null);

  const department = requestDepartment ?? sessionDepartment;

  useEffect(() => {
    async function loadRequestData() {
      setIsLoading(true);
      try {
        const response: GiftRequestsResponse = await getUserGiftRequests(requestId);

        const data: GiftRequestData | undefined = Array.isArray(response)
          ? response.find((item) => item.id === requestId) || response[0]
          : response ?? undefined;

        if (data) {
          setFormData((prev) => ({
            ...prev,
            title: data.title || '',
            donorName: data.donorName || '',
            giftType: data.giftType || 'Prize',
            amount: data.amount ? String(data.amount) : '',
            currency: data.currency || 'NGN',
            purpose: data.purpose || '',
            hasConflict: String(data.hasConflictOfInterest ?? 'false'),
          }));

          if (data.department) {
            setRequestDepartment(data.department);
          }
          if (data.reviewComment) {
            setReviewerComments(data.reviewComment);
          }

          const loadedAttachments: { [key in keyof FileUploadState]?: string } = {};

          if (Array.isArray(data.documents)) {
            data.documents.forEach((doc) => {
              if (doc.docType === 'DEPT_RECOMMENDATION' || doc.docType === 'file_deptRecommendation') {
                loadedAttachments.file_deptRecommendation = doc.fileName || extractFileName(doc.fileUrl);
              } else if (doc.docType === 'SIGNED_FORM' || doc.docType === 'file_signedForm') {
                loadedAttachments.file_signedForm = doc.fileName || extractFileName(doc.fileUrl);
              } else if (doc.docType === 'SPONSOR_CV' || doc.docType === 'file_sponsorCV') {
                loadedAttachments.file_sponsorCV = doc.fileName || extractFileName(doc.fileUrl);
              } else if (doc.docType === 'CITATION' || doc.docType === 'file_citation') {
                loadedAttachments.file_citation = doc.fileName || extractFileName(doc.fileUrl);
              } else if (doc.docType === 'PAYMENT_RECEIPT' || doc.docType === 'file_paymentReceipt') {
                loadedAttachments.file_paymentReceipt = doc.fileName || extractFileName(doc.fileUrl);
              }
            });
          }

          setExistingFileNames(loadedAttachments);
        }
      } catch (err: unknown) {
        console.error('Failed to load request for revision:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequestData();
  }, [requestId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (key: keyof FileUploadState, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const createPayload = () => {
    const payload = new FormData();
    payload.append('requestId', requestIdRef.current);

    Object.entries(formData).forEach(([key, val]) => {
      payload.append(key, String(val));
    });

    payload.append('department', department);

    Object.entries(files).forEach(([key, file]) => {
      if (file instanceof File) {
        payload.append(key, file);
      }
    });

    return payload;
  };

  const persistDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload = createPayload();
      await saveGiftRequestDraft(payload);
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: unknown) {
      console.error('Save progress failed:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    await persistDraft();
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = createPayload();
      const res = await resubmitGiftRequest(payload);

      if (res?.success) {
        router.push('/dashboard?revised=true');
      } else {
        setSubmitError(res?.error || 'Failed to submit revision. Please verify all details.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-gray-50 text-sm font-medium text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Loading request details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Banner Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 p-8 shadow-sm">
          <Gift
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/10"
            strokeWidth={1}
          />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <RefreshCw className="h-3 w-3" /> Revision Request
              </span>
              <h1 className="mt-3 text-2xl font-bold text-white">Revise & Resubmit Proposal</h1>
              <p className="mt-1 max-w-md text-sm text-amber-100">
                {lastSavedAt
                  ? `Changes saved at ${lastSavedAt}`
                  : 'Update requested details and documents before resubmitting for approval.'}
              </p>
            </div>
            <button
              type="button"
              onClick={persistDraft}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSavingDraft ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </div>

        {/* Feedback Alert Box */}
        {reviewerComments && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Reviewer Feedback</h3>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">{reviewerComments}</p>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {submitError}
          </div>
        )}

        {/* Steps Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {STEPS.map(({ id, label, icon: Icon }) => {
            const isActive = step === id;
            const isComplete = id < step;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id < step) setStep(id);
                }}
                disabled={id > step}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                    : isComplete
                    ? 'cursor-pointer border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100/70'
                    : 'cursor-not-allowed border-gray-100 bg-white text-gray-400'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmitRevision}>
            {/* Step 1: General Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gift Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Annual Research Sponsorship"
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Donor / Sponsor Name</label>
                  <input
                    type="text"
                    name="donorName"
                    value={formData.donorName}
                    onChange={handleChange}
                    placeholder="e.g., Acme Foundation"
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gift Type</label>
                  <select
                    name="giftType"
                    value={formData.giftType}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="Prize">Prize</option>
                    <option value="Donation">Donation</option>
                    <option value="Grant">Grant</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={department}
                    readOnly
                    disabled
                    className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Financials */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Estimated Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose / Description</label>
                  <textarea
                    name="purpose"
                    rows={4}
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="Provide detailed information regarding the gift purpose..."
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conflict of Interest</label>
                  <select
                    name="hasConflict"
                    value={formData.hasConflict}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="false">No conflict identified</option>
                    <option value="true">Potential conflict exists</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Document Updates */}
            {step === 3 && (
              <div className="space-y-3">
                {[
                  { key: 'file_deptRecommendation', label: 'Department Recommendation' },
                  { key: 'file_signedForm', label: 'Signed Form' },
                  { key: 'file_sponsorCV', label: 'Sponsor CV' },
                  { key: 'file_citation', label: 'Citation / Program Details' },
                  { key: 'file_paymentReceipt', label: 'Payment Receipt' },
                ].map(({ key, label }) => {
                  const fileKey = key as keyof FileUploadState;
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-600">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        {existingFileNames[fileKey] && (
                          <p className="mt-0.5 text-xs font-medium text-emerald-600">
                            Existing: {existingFileNames[fileKey]}
                          </p>
                        )}
                        {files[fileKey] && (
                          <p className="mt-0.5 text-xs font-medium text-amber-600">
                            Replacement: {files[fileKey]?.name}
                          </p>
                        )}
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(fileKey, e.target.files?.[0] || null)}
                          className="mt-2 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-amber-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Revision Summary & Resubmit */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  Final Review & Summary of Changes
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Response / Summary of Changes
                  </label>
                  <textarea
                    name="revisionNotes"
                    rows={3}
                    value={formData.revisionNotes}
                    onChange={handleChange}
                    placeholder="Briefly detail what modifications were made in response to feedback..."
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-900">
                  <p>
                    <span className="font-semibold text-gray-700">Title:</span>{' '}
                    <span>{formData.title || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Donor:</span>{' '}
                    <span>{formData.donorName || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Amount:</span>{' '}
                    <span>
                      {formData.currency} {formData.amount || '0'}
                    </span>
                  </p>
                </div>

                <label
                  htmlFor="ethicalClearance"
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id="ethicalClearance"
                    name="ethicalClearance"
                    checked={formData.ethicalClearance}
                    onChange={handleChange}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I confirm that all requested revisions have been addressed accurately.
                  </span>
                </label>
              </div>
            )}

            {/* Controls */}
            <div className="mt-8 flex justify-between border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.ethicalClearance}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Resubmitting...' : 'Resubmit Proposal'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}