'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  AlertTriangle,
  MessageSquare,
  FileText,
} from 'lucide-react';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationRead,
} from '@/app/actions/notifications';

type Item = Awaited<ReturnType<typeof getUserNotifications>>[number];

const ICONS: Record<string, { Icon: typeof Bell; color: string }> = {
  approved: { Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  rejected: { Icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  moved: { Icon: ArrowRightCircle, color: 'text-[#5D5CFF] bg-indigo-50' },
  action: { Icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  comment: { Icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
  submitted: { Icon: FileText, color: 'text-slate-500 bg-slate-100' },
};

function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const d = Math.floor(seconds / 86400);
  if (d >= 1) return `${d}d ago`;
  const h = Math.floor(seconds / 3600);
  if (h >= 1) return `${h}h ago`;
  const m = Math.floor(seconds / 60);
  if (m >= 1) return `${m}m ago`;
  return 'just now';
}

// tone="light": white icon, for use on the indigo reviewer hero.
export default function NotificationBell({ tone = 'dark' }: { tone?: 'light' | 'dark' }) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load on mount, refresh every 30s and whenever the tab regains focus.
  // setState only ever runs inside the promise callback (never synchronously
  // in the effect body), which is what the react-hooks lint rule requires.
  useEffect(() => {
    let active = true;

    const refresh = () => {
      getUserNotifications().then((data) => {
        if (active) setItems(data);
      });
    };

    refresh();
    const timer = setInterval(refresh, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unread = items.filter((i) => i.isUnread).length;

  const readOne = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isUnread: false } : i)));
    markNotificationRead(id);
    setOpen(false);
  };

  const readAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isUnread: false })));
    await markAllNotificationsAsRead();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className={`relative rounded-full p-2 transition-colors ${
          tone === 'light'
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5D5CFF] hover:text-[#4c4be6]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-slate-50 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-8 text-center text-xs font-semibold text-slate-400">
                No notifications yet. You will see updates here when a request moves, is rejected, or needs more information.
              </p>
            ) : (
              items.map((n) => {
                const { Icon, color } = ICONS[n.type] ?? ICONS.submitted;
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => readOne(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                      n.isUnread ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900">{n.title}</p>
                        {n.statusBadge && (
                          <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            {n.statusBadge}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs leading-snug text-slate-600">{n.description}</p>
                      <p className="text-[11px] font-medium text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {n.isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#5D5CFF]" />}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}