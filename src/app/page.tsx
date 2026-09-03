import React from 'react';
import Link from 'next/link';
import { Gift, ArrowRight, CheckCircle2, Shield, Zap, Layers, BarChart3, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF]">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">GiftFlow</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?request=true" 
              className="inline-flex items-center justify-center rounded-xl bg-[#5D5CFF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4c4be6] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#5D5CFF]/10 px-3 py-1 text-xs font-semibold text-[#5D5CFF] mb-6">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#5D5CFF] animate-pulse"></span>
            Introducing GiftFlow 2.0
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
            Streamline your philanthropic <br className="hidden sm:inline" />
            <span className="text-[#5D5CFF]">gift approval workflow.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-500 leading-relaxed">
            Submit, track, and manage philanthropic gift requests from initial submission to final auditing — all in one centralized, secure workspace.
          </p>

          {/* Call To Actions */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5D5CFF] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#4c4be6] transition-all transform hover:-translate-y-0.5"
            >
              Launch Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#5D5CFF]/20 to-indigo-200/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* 3. Feature Matrix Grid */}
      <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to secure donor trust
            </h2>
            <p className="mt-4 text-slate-500">
              Built systematically for compliance managers, institutional fundraisers, and administrative executives.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Real-Time Status Tracking</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Watch requests glide through processing intervals cleanly. Instant state syncing means no more internal email loops.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Multi-Stage Workflow</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Dynamically route complex requests directly to legal, compliance, and leadership tiers based on gift size scales automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Secure Audit Vault</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Keep deed agreements, compliance certifications, and digital files safe under enterprise-tier cryptographic isolation hooks.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Philanthropic Reporting</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Instantly compile incoming financial pipelines into audit-ready tables or export data seamlessly directly for board reviews.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Team Collaboration</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Assign requests, tag team members in comment threads, and leave system operational remarks right inside specific processing tickets.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D5CFF]/10 text-[#5D5CFF] mb-5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Conditional Automation</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Auto-approve recurring gifts from verified foundations or auto-flag requests that require custom regional tax disclosures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-[#5D5CFF]" />
            <span className="font-bold tracking-tight">GiftFlow</span>
          </div>
          <p className="text-xs">
            © 2026 GiftFlow Systems Inc. All operational standards guarded securely.
          </p>
        </div>
      </footer>

    </div>
  );
}