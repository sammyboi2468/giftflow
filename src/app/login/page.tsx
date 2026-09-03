'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Gift,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to determine destination route based on user role
   */
  const getRoleBasedRedirectPath = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'SENATE':
      case 'SENATE_DIVISION':
        return '/reviewer/senate';
      case 'ADVANCEMENT':
      case 'ADVANCEMENT_OFFICE':
        return '/reviewer/advancement';
      case 'COUNCIL':
        return '/reviewer/council';
      case 'DEPARTMENT':
      case 'APPLICANT':
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
      } else if (res?.ok) {
        // Fetch session to retrieve user role
        const session = await getSession();
        const userRole = session?.user?.role;

        // If a explicit callback URL was provided, use it; otherwise route by role
        const destination = callbackUrl || getRoleBasedRedirectPath(userRole);

        router.push(destination);
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* Left Panel - Branding & Feature Callouts */}
      <div className="login-gradient relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#5D5CFF] p-12 text-white lg:flex">
        <div className="login-pop relative z-10 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <span className="login-blob absolute inset-0 rounded-xl bg-white/20 blur-md" aria-hidden="true" />
            <Gift className="relative h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">GiftFlow</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1
            className="login-anim text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            Streamline your gift approval workflow.
          </h1>
          <p className="login-anim text-lg text-indigo-100" style={{ animationDelay: '160ms' }}>
            Submit, track, and manage philanthropic gift requests from submission to final approval — all in one place.
          </p>

          <ul className="space-y-4 pt-4 text-indigo-100">
            {[
              'Real-time status tracking',
              'Multi-stage approval workflow',
              'Secure document management',
            ].map((item, idx) => (
              <li
                key={item}
                className="login-anim flex items-center gap-3 font-medium"
                style={{ animationDelay: `${240 + idx * 90}ms` }}
              >
                <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative floating gift icon */}
        <div className="login-float pointer-events-none absolute bottom-0 right-0 p-8 opacity-10">
          <Gift className="h-80 w-80 text-white" />
        </div>

        {/* Ambient background glow */}
        <div className="login-blob pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div
          className="login-blob-slow pointer-events-none absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />

        <div className="login-anim relative z-10 text-sm text-indigo-200" style={{ animationDelay: '520ms' }}>
          © 2025 GiftFlow. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="relative flex w-full items-center justify-center overflow-hidden p-8 lg:w-1/2 sm:p-12">
        {/* Ambient decorative blobs, echoing the landing page hero */}
        <div className="login-blob pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-tr from-[#5D5CFF]/10 to-indigo-200/20 blur-3xl" />
        <div
          className="login-blob pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-200/20 to-[#5D5CFF]/10 blur-3xl"
          style={{ animationDelay: '2s' }}
        />

        <div className="relative z-10 w-full max-w-md space-y-6">
          <div
            className="login-pop mb-6 flex items-center gap-2 lg:hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D5CFF] text-white">
              <Gift className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">GiftFlow</span>
          </div>

          <div className="login-anim space-y-1" style={{ animationDelay: '60ms' }}>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500">
              Please sign in to your account
            </p>
          </div>

          {error && (
            <div className="login-shake flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="login-anim space-y-1.5" style={{ animationDelay: '140ms' }}>
              <label className="block text-xs font-semibold text-gray-700">
                Email address
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-[#5D5CFF]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.mitchell@university.edu"
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all duration-200 focus:border-[#5D5CFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5CFF]/20"
                />
              </div>
            </div>

            <div className="login-anim space-y-1.5" style={{ animationDelay: '190ms' }}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#5D5CFF] transition-colors hover:text-[#4c4be6]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-[#5D5CFF]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm text-gray-900 transition-all duration-200 focus:border-[#5D5CFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5CFF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-transform hover:scale-110 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div
              className="login-anim flex items-center justify-center pt-1"
              style={{ animationDelay: '240ms' }}
            >
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#5D5CFF] focus:ring-[#5D5CFF]"
                />
                Remember me
              </label>
            </div>

            <div className="login-anim" style={{ animationDelay: '290ms' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#5D5CFF] py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4c4be6] hover:shadow-lg hover:shadow-[#5D5CFF]/30 active:translate-y-0 active:scale-[0.99] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                <span className="login-shimmer pointer-events-none absolute inset-0" aria-hidden="true" />
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="login-anim pt-4 text-center text-xs text-gray-500" style={{ animationDelay: '340ms' }}>
            Don`t have an account?{' '}
            <Link href="/request-access" className="font-semibold text-[#5D5CFF] transition-colors hover:text-[#4c4be6]">
              Request access
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes login-fade-up {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes login-pop-in {
          0% {
            opacity: 0;
            transform: scale(0.6) rotate(-8deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes login-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(3deg);
          }
        }
        @keyframes login-blob-pulse {
          0%,
          100% {
            transform: scale(1) translate(0, 0);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08) translate(10px, -10px);
            opacity: 0.85;
          }
        }
        @keyframes login-blob-pulse-slow {
          0%,
          100% {
            transform: scale(1) translate(0, 0);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.15) translate(-14px, 12px);
            opacity: 0.8;
          }
        }
        @keyframes login-shake {
          0% {
            opacity: 0;
            transform: translateX(0);
          }
          15% {
            opacity: 1;
          }
          20%,
          60% {
            transform: translateX(-4px);
          }
          40%,
          80% {
            transform: translateX(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes login-gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes login-shimmer-sweep {
          0% {
            transform: translateX(-120%) skewX(-15deg);
          }
          100% {
            transform: translateX(220%) skewX(-15deg);
          }
        }

        .login-anim {
          opacity: 0;
          animation: login-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-pop {
          animation: login-pop-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .login-float {
          animation: login-float 8s ease-in-out infinite;
        }
        .login-blob {
          animation: login-blob-pulse 7s ease-in-out infinite;
        }
        .login-blob-slow {
          animation: login-blob-pulse-slow 11s ease-in-out infinite;
        }
        .login-shake {
          animation: login-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .login-gradient {
          background: linear-gradient(120deg, #5d5cff, #7a6bff, #4c4be6, #5d5cff);
          background-size: 300% 300%;
          animation: login-gradient-shift 14s ease infinite;
        }
        .login-shimmer {
          background: linear-gradient(
            100deg,
            transparent 30%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 70%
          );
          transform: translateX(-120%) skewX(-15deg);
          opacity: 0;
          transition: opacity 0.2s;
        }
        button:hover .login-shimmer {
          opacity: 1;
          animation: login-shimmer-sweep 1s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-anim,
          .login-pop,
          .login-float,
          .login-blob,
          .login-blob-slow,
          .login-shake,
          .login-gradient,
          .login-shimmer {
            animation: none;
            opacity: 1;
          }
          .login-gradient {
            background: #5d5cff;
          }
        }
      `}</style>
    </div>
  );
}