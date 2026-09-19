'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Role } from '@prisma/client';
import {
  Gift,
  Save,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Wallet,
  Upload,
  Loader2,
  UploadCloud,
} from 'lucide-react';

import {
  getUserGiftRequests,
  saveGiftRequestDraft,
  createGiftRequest,
  deleteGiftRequestDraft,
} from '@/app/actions/gift-request';
import { useSession } from 'next-auth/react';

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
  { id: 4, label: 'Review', icon: CheckCircle2 },
];

const FILE_KEY_TO_DOC_TYPE: Record<keyof FileUploadState, string> = {
  file_deptRecommendation: 'DEPT_RECOMMENDATION',
  file_signedForm: 'SIGNED_FORM',
  file_sponsorCV: 'SPONSOR_CV',
  file_citation: 'CITATION',
  file_paymentReceipt: 'PAYMENT_RECEIPT',
};

const DOC_TYPE_TO_FILE_KEY: Record<string, keyof FileUploadState> = {
  DEPT_RECOMMENDATION: 'file_deptRecommendation',
  file_deptRecommendation: 'file_deptRecommendation',
  SIGNED_FORM: 'file_signedForm',
  file_signedForm: 'file_signedForm',
  SPONSOR_CV: 'file_sponsorCV',
  file_sponsorCV: 'file_sponsorCV',
  CITATION: 'file_citation',
  file_citation: 'file_citation',
  PAYMENT_RECEIPT: 'file_paymentReceipt',
  file_paymentReceipt: 'file_paymentReceipt',
};

// Presets offered to submitters who can choose their own source (Advancement
// Office / Admin), rather than being locked to their login session's
// department -- since donations can originate somewhere other than a
// traditional academic department.
const DEPARTMENT_PRESETS = ['University Central', 'Advancement Office'];

interface GiftDocument {
  docType: string;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
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
  documents?: GiftDocument[] | null;
  [key: string]: unknown;
}

type GiftRequestsResponse = GiftRequestData[] | GiftRequestData | null | undefined;

interface DraftSaveResult {
  draftId?: string;
}

interface CreateGiftRequestResult {
  success?: boolean;
  error?: string;
}

interface FormContentProps {
  initialDraftId?: string;
}

function extractFileName(url?: string | null): string {
  if (!url) return '';
  return url.split('/').pop() || '';
}

async function uploadFile(file: File): Promise<{ url: string; originalName: string }> {
  const body = new FormData();
  body.append('file', file);

  const res = await fetch('/api/upload', { method: 'POST', body });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Failed to upload ${file.name}`);
  }

  return { url: data.url, originalName: data.originalName || file.name };
}

export default function FormContent({ initialDraftId }: FormContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeId = initialDraftId || searchParams.get('draftId') || searchParams.get('requestId') || null;

  const { data: session } = useSession();
  const sessionDepartment = session?.user?.department ?? '';
  const userRole = session?.user?.role as Role | undefined;
  // Department users stay locked to their session's department, as before.
  // Advancement Office / Admin can submit on behalf of a non-department
  // source (University Central, Advancement Office itself, a donor-specified
  // origin, etc.), so they get a free-text field instead.
  const canEditDepartment = userRole === Role.ADVANCEMENT_OFFICE || userRole === Role.ADMIN;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(activeId);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  const draftIdRef = useRef<string | null>(activeId);

  const updateDraftId = (id: string | null) => {
    draftIdRef.current = id;
    setDraftId(id);
  };

  const fileInputRefs = useRef<{ [key in keyof FileUploadState]?: HTMLInputElement | null }>({});

  const [formData, setFormData] = useState({
    title: '',
    donorName: '',
    giftType: 'Prize',
    department: '',
    amount: '',
    currency: 'NGN',
    purpose: '',
    hasConflict: 'false',
    ethicalClearance: false,
  });

  const [files, setFiles] = useState<FileUploadState>({
    file_deptRecommendation: null,
    file_signedForm: null,
    file_sponsorCV: null,
    file_citation: null,
    file_paymentReceipt: null,
  });

  const [existingFileNames, setExistingFileNames] = useState<{ [key in keyof FileUploadState]?: string }>({});
  const [existingDocuments, setExistingDocuments] = useState<GiftDocument[]>([]);

  // For a locked (non-editable) department user, the field is never
  // actually typed into -- it's always either their own saved/loaded
  // value, or their session's department as a fallback. Computed directly
  // during render rather than synced via an effect, since nothing here
  // depends on subscribing to an external system; it's derivable from
  // values already available on every render.
  const effectiveDepartment = canEditDepartment ? formData.department : formData.department || sessionDepartment;

  useEffect(() => {
    const currentId = activeId;
    if (!currentId) return;

    async function loadExistingDraft() {
      setIsLoadingDraft(true);
      try {
        const response: GiftRequestsResponse = await getUserGiftRequests(currentId!);

        const data: GiftRequestData | undefined = Array.isArray(response)
          ? response.find((item) => item.id === currentId) || response[0]
          : response ?? undefined;

        if (data) {
          setFormData({
            title: data.title || '',
            donorName: data.donorName || '',
            giftType: data.giftType || 'Prize',
            department: data.department || '',
            amount: data.amount ? String(data.amount) : '',
            currency: data.currency || 'NGN',
            purpose: data.purpose || '',
            hasConflict: String(data.hasConflictOfInterest ?? 'false'),
            ethicalClearance: false,
          });
          updateDraftId(currentId!);

          const loadedAttachments: { [key in keyof FileUploadState]?: string } = {};

          if (Array.isArray(data.documents)) {
            setExistingDocuments(data.documents);

            data.documents.forEach((doc) => {
              const slot = DOC_TYPE_TO_FILE_KEY[doc.docType];
              if (slot) {
                loadedAttachments[slot] = doc.fileName || extractFileName(doc.fileUrl);
              }
            });
          }

          setExistingFileNames(loadedAttachments);
        }
      } catch (err: unknown) {
        console.error('Failed to load existing draft:', err);
        toast.error('Failed to load draft details.');
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadExistingDraft();
  }, [activeId]);

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
    const currentId = draftIdRef.current || activeId;

    if (currentId) {
      payload.append('draftId', currentId);
      payload.append('requestId', currentId);
    }

    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'department') return; // sent separately below, resolved
      payload.append(key, String(val));
    });

    payload.append('department', effectiveDepartment);

    return payload;
  };

  const persistDraft = async (silent = false) => {
    setIsSavingDraft(true);
    try {
      const payload = createPayload();
      const result: DraftSaveResult | undefined = await saveGiftRequestDraft(payload);

      if (result?.draftId) {
        updateDraftId(result.draftId);
      }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedAt(timeStr);

      if (!silent) {
        toast.success('Draft saved successfully', {
          description: `Progress recorded at ${timeStr}`,
        });
      }
    } catch (err: unknown) {
      console.error('Auto-save draft failed:', err);
      if (!silent) {
        toast.error('Could not save draft', {
          description: 'Please check your connection and try again.',
        });
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    await persistDraft(true);
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftIdRef.current) return;
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) return;

    setIsDeletingDraft(true);
    try {
      await deleteGiftRequestDraft(draftIdRef.current);
      toast.success('Draft deleted successfully');
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Failed to delete draft:', err);
      toast.error('Could not delete draft. Please try again.');
    } finally {
      setIsDeletingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const selectedEntries = (Object.entries(files) as [keyof FileUploadState, File | null][]).filter(
        ([, file]) => file instanceof File
      );

      const freshUploads = await Promise.all(
        selectedEntries.map(async ([key, file]) => {
          const { url, originalName } = await uploadFile(file as File);
          return {
            docType: FILE_KEY_TO_DOC_TYPE[key],
            fileUrl: url,
            fileName: originalName,
            fileSize: (file as File).size,
          };
        })
      );

      const merged = new Map<string, { docType: string; fileUrl: string; fileName: string; fileSize: number }>();

      existingDocuments.forEach((doc) => {
        if (!doc.fileUrl) return;
        const slot = DOC_TYPE_TO_FILE_KEY[doc.docType];
        const canonicalDocType = slot ? FILE_KEY_TO_DOC_TYPE[slot] : doc.docType;
        merged.set(canonicalDocType, {
          docType: canonicalDocType,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName || 'Untitled Document',
          fileSize: typeof doc.fileSize === 'number' ? doc.fileSize : 0,
        });
      });

      freshUploads.forEach((doc) => merged.set(doc.docType, doc));

      const payload = createPayload();
      merged.forEach((doc) => {
        payload.append('docTypes[]', doc.docType);
        payload.append('fileUrls[]', doc.fileUrl);
        payload.append('fileNames[]', doc.fileName);
        payload.append('fileSizes[]', String(doc.fileSize));
      });

      const res: CreateGiftRequestResult | undefined = await createGiftRequest(payload);

      if (res?.success) {
        toast.success('Gift Proposal Submitted!', {
          description: 'Your request has been sent for departmental review.',
        });
        router.push('/dashboard?submitted=true');
      } else {
        const errMsg = res?.error || 'Failed to submit request. Please check all fields.';
        setSubmitError(errMsg);
        toast.error('Submission Failed', { description: errMsg });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSubmitError(message);
      toast.error('Submission Error', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-gray-50 text-sm font-medium text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        Loading draft details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 shadow-sm">
          <Gift
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/10"
            strokeWidth={1}
          />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                {draftId ? 'Editing draft' : 'New submission'}
              </span>
              <h1 className="mt-3 text-2xl font-bold text-white">Submit New Gift Proposal</h1>
              <p className="mt-1 max-w-md text-sm text-indigo-100">
                {lastSavedAt
                  ? `Draft saved at ${lastSavedAt}`
                  : 'Fill in the details below to route this proposal for departmental review.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {draftId && (
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  disabled={isDeletingDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingDraft ? 'Deleting...' : 'Delete Draft'}
                </button>
              )}
              <button
                type="button"
                onClick={() => persistDraft(false)}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {submitError}
          </div>
        )}

        {/* Steps Navigation Bar */}
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
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : isComplete
                    ? 'cursor-pointer border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70'
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
          <form onSubmit={handleSubmit}>
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
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gift Type</label>
                  <select
                    name="giftType"
                    value={formData.giftType}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Prize">Prize</option>
                    <option value="Donation">Donation</option>
                    <option value="Grant">Grant</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>

                {/* Department / Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {canEditDepartment ? 'Department / Source' : 'Department'}
                  </label>

                  {canEditDepartment ? (
                    <>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., University Central, Advancement Office, or a specific department"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {DEPARTMENT_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, department: preset }))}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              formData.department === preset
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Specify where this gift is coming from -- it doesn`t have to be a department.
                      </p>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="department"
                        value={effectiveDepartment}
                        readOnly
                        disabled
                        className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Set from your login session and cannot be edited here.
                      </p>
                    </>
                  )}
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
                      className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conflict of Interest</label>
                  <select
                    name="hasConflict"
                    value={formData.hasConflict}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="false">No conflict identified</option>
                    <option value="true">Potential conflict exists</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Document Uploads */}
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
                      <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        {existingFileNames[fileKey] && (
                          <p className="mt-0.5 text-xs font-medium text-emerald-600">
                            Current file: {existingFileNames[fileKey]}
                          </p>
                        )}
                        {files[fileKey] && (
                          <p className="mt-0.5 text-xs font-medium text-indigo-600">
                            Selected: {files[fileKey]?.name}
                          </p>
                        )}
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[fileKey] = el;
                          }}
                          onChange={(e) => handleFileChange(fileKey, e.target.files?.[0] || null)}
                          className="mt-2 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  Review Submission
                </h2>
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
                    <span className="font-semibold text-gray-700">Department / Source:</span>{' '}
                    <span>{effectiveDepartment || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Amount:</span>{' '}
                    <span>
                      {formData.currency} {formData.amount || '0'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Purpose:</span>{' '}
                    <span>{formData.purpose || 'N/A'}</span>
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
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I declare that the information provided is accurate and complies with institutional policies.
                  </span>
                </label>
              </div>
            )}

            {/* Form Actions */}
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.ethicalClearance}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}