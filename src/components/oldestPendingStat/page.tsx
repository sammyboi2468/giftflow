'use client';

import { useState } from 'react';

interface OldestPendingStatProps {
  oldestCreatedAt: Date | null;
}

// Reading the current time is done here, in a Client Component, via a
// useState lazy initializer -- captured once on mount rather than during
// every render -- rather than in the Server Component that fetches the
// data. Date.now() (or `new Date()`) called directly in a Server
// Component's render body is treated as an impure read of external state.
export default function OldestPendingStat({ oldestCreatedAt }: OldestPendingStatProps) {
  const [now] = useState(() => Date.now());

  if (!oldestCreatedAt) return null;

  const days = Math.max(0, Math.floor((now - new Date(oldestCreatedAt).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="border-l border-white/20 pl-6">
      <span className="text-3xl font-extrabold text-white">{days}</span>
      <p className="text-xs font-medium text-indigo-100">Days on oldest item</p>
    </div>
  );
}