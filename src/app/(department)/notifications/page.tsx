"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  XCircle, 
  MessageSquare, 
  Send,
  Loader2
} from 'lucide-react';
import { getUserNotifications, markAllNotificationsAsRead } from '@/app/actions/notification';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string | Date;
  type: string;
  isUnread: boolean;
  statusBadge?: string | null;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real notifications from server
  useEffect(() => {
    async function loadNotifications() {
      setIsLoading(true);
      try {
        const data = await getUserNotifications();
        setNotifications(data as unknown as NotificationItem[]);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  // Mark all as read locally and on backend
  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    await markAllNotificationsAsRead();
  };

  // Helper for rendering dynamic icon badges
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

  // Helper for dynamic relative time formatting
  const formatTimeAgo = (dateInput: string | Date) => {
    if (!dateInput) return 'Recently';
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter items based on selected tab and search query
  const filteredNotifications = notifications.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'Unread') return item.isUnread;
    if (activeTab === 'Approvals') return item.type === 'approved' || item.type === 'rejected';
    if (activeTab === 'Mentions') return item.type === 'comment' || item.type === 'action';

    return true;
  });

  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto font-sans text-slate-600">
      
      {/* 1. Header Row */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Stay updated on your gift request activity</p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-black outline-none placeholder-slate-400 focus:border-[#5D5CFF] focus:bg-white transition-all"
            />
          </div>
          
          {/* Header Bell Button with Dynamic Badge */}
          <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <Bell className="h-4 w-4" />
            
            {/* Dynamic Unread Counter Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
            alt="User Avatar" 
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
          />
        </div>
      </header>

      {/* Main Stream Workspace */}
      <main className="p-6 max-w-[1400px] mx-auto space-y-4">
        
        {/* 2. Stream Sub-header & Filtering System */}
        <div className="flex items-center justify-between py-2">
          {/* Categorization Tabs */}
          <div className="flex items-center gap-2">
            {['All', 'Unread', 'Approvals', 'Mentions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-[#5D5CFF]/10 text-[#5D5CFF]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{tab}</span>

                {/* Badge pill specifically for Unread tab */}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold leading-none ${
                    activeTab === 'Unread' 
                      ? 'bg-[#5D5CFF] text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Global Functional Action Label */}
          <button 
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D5CFF] hover:underline"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>

        {/* 3. Notifications Ledger List Stack Card container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100/60">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#5D5CFF] mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading activity feed...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const { icon: IconComponent, style } = getNotificationIcon(notification.type);
              
              return (
                <div 
                  key={notification.id} 
                  className={`p-5 flex items-start gap-4 hover:bg-slate-50/40 transition-colors group relative ${
                    notification.isUnread ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {/* Left Notification Badge Circle Icon */}
                  <div className={`h-9 w-9 flex items-center justify-center rounded-xl shrink-0 ${style}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Main Content Layout */}
                  <div className="flex-1 space-y-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                        {notification.title}
                      </h4>
                      {notification.statusBadge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-100 leading-none">
                          {notification.statusBadge}
                        </span>
                      )}
                    </div>

                    {notification.description && (
                      <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-medium">
                        {notification.description}
                      </p>
                    )}

                    <span className="block text-[11px] font-semibold text-slate-400 pt-0.5">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {/* Rightmost Unread Tracker Dot */}
                  {notification.isUnread && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-[#5D5CFF]" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs font-medium text-slate-400 bg-slate-50/20">
              No notifications found matching selected criteria.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}