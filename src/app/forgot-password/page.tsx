import Link from 'next/link';
import { Gift, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF] text-white">
            <Gift className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-gray-900">GiftFlow</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#5D5CFF]">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Forgot your password?</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Accounts on GiftFlow are managed by your institution`s administrator. Please reach out to your
            administrator directly to have your password reset -- they can issue you a new temporary password,
            and you`ll be asked to set your own on next login.
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