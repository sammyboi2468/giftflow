"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Check,
  CheckCircle2,
  ArrowRight,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationRead,
} from '@/app/actions/notification';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string | Date;
  type: string;
  isUnread: boolean;
  statusBadge?: string | null;
  href?: string;
}

const TABS = ['All', 'Unread', 'Approvals', 'Mentions'] as const;

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'approved':
      return { icon: CheckCircle2, style: 'text-emerald-500 bg-emerald-50 border border-emerald-100' };
    case 'moved':
      return { icon: ArrowRight, style: 'text-indigo-500 bg-indigo-50 border border-indigo-100' };
    case 'action':
      return { icon: Clock, style: 'text-amber-500 bg-amber-50 border border-amber-100' };
    case 'rejected':
      return { icon: XCircle, style: 'text-rose-500 bg-rose-50 border border-rose-100' };
    case 'comment':
      return { icon: MessageSquare, style: 'text-blue-500 bg-blue-50 border border-blue-100' };
    default:
      return { icon: Send, style: 'text-slate-500 bg-slate-50 border border-slate-100' };
  }
};

const formatTimeAgo = (dateInput: string | Date) => {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load once on mount. State is only set inside promise callbacks, never
  // synchronously in the effect body (isLoading already starts as true).
  useEffect(() => {
    let active = true;

    getUserNotifications()
      .then((data) => {
        if (active) setNotifications(data as unknown as NotificationItem[]);
      })
      .catch((err) => console.error('Error loading notifications:', err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    await markAllNotificationsAsRead();
  };

  const handleOpen = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n)));
    markNotificationRead(id);
  };

  const q = searchQuery.toLowerCase();
  const filteredNotifications = notifications.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (activeTab === 'Unread') return item.isUnread;
    if (activeTab === 'Approvals') return item.type === 'approved' || item.type === 'rejected';
    if (activeTab === 'Mentions') return item.type === 'comment' || item.type === 'action';
    return true;
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Stay updated on your gift request activity</p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-black outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
          />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-4">
        {/* Tabs + mark all read */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab ? 'bg-[#5D5CFF]/10 text-[#5D5CFF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{tab}</span>
                {tab === 'Unread' && unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold leading-none ${
                      activeTab === 'Unread' ? 'bg-[#5D5CFF] text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-[#5D5CFF] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100/60">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#5D5CFF] mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading activity feed...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const { icon: IconComponent, style } = getNotificationIcon(notification.type);

              const content = (
                <>
                  <div className={`h-9 w-9 flex items-center justify-center rounded-xl shrink-0 ${style}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
                        {notification.title}
                      </h4>
                      {notification.statusBadge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-100 leading-none">
                          {notification.statusBadge}
                        </span>
                      )}
                    </div>

                    {notification.description && (
                      <p className="text-xs text-slate-500 max-w-3xl leading-relaxed font-medium break-words">
                        {notification.description}
                      </p>
                    )}

                    <span className="block text-[11px] font-semibold text-slate-400 pt-0.5">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {notification.isUnread && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#5D5CFF]" aria-label="Unread" />
                  )}
                </>
              );

              const rowClass = `p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-slate-50/40 transition-colors ${
                notification.isUnread ? 'bg-indigo-50/20' : ''
              }`;

              return notification.href ? (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => handleOpen(notification.id)}
                  className={rowClass}
                >
                  {content}
                </Link>
              ) : (
                <div key={notification.id} className={rowClass}>
                  {content}
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center text-xs font-medium text-slate-400 bg-slate-50/20">
              No notifications found matching selected criteria.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}