'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitAccessRequest } from '../actions/request-access-actions';
import {
  Gift,
  User,
  Mail,
  Building2,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function RequestAccessPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await submitAccessRequest({ name, email, department, reason });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to submit request. Please try again.');
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF] text-white">
              <Gift className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">GiftFlow</span>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Request submitted</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Thanks -- your request has been sent to an administrator for review. You`ll be contacted at the
              email you provided once your account is set up.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4c4be6] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF] text-white">
            <Gift className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-gray-900">GiftFlow</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Request access</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tell us a bit about yourself and an administrator will set up your account.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Mitchell"
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-[#5D5CFF]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.mitchell@university.edu"
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-[#5D5CFF]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department (optional)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-[#5D5CFF]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                What do you need access for? (optional)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-3 text-gray-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., I need to submit gift proposals for my department."
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#5D5CFF] focus:bg-white focus:ring-2 focus:ring-[#5D5CFF]/20 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D5CFF] py-3 text-sm font-semibold text-white hover:bg-[#4c4be6] transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#5D5CFF] hover:text-[#4c4be6]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}