"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Gift, LayoutDashboard, FileText, PlusCircle, Bell, 
  FileEdit, BarChart3, Settings, HelpCircle, ChevronsUpDown,
  ShieldCheck
} from 'lucide-react';
import { getUserNotifications } from '@/app/actions/notification';
import { Role } from '@prisma/client';

interface SidebarProps {
  userRole?: Role; // Optional prop passed from parent or session (defaults to DEPARTMENT_USER)
  userName?: string;
}

export default function Sidebar({ 
  userRole = Role.DEPARTMENT_USER, 
  userName = "Sarah Mitchell" 
}: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Check if current user is authorized to see governance/reviewer tools
  const isReviewerRole = (
    [
     Role.ADVANCEMENT_OFFICE,
    Role.SENATE_DIVISION,
    Role.COUNCIL,
    Role.ADMIN,
    ] as Role[]
   ).includes(userRole);

  // Fetch real unread notifications count from Prisma
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const data = await getUserNotifications();
        const unread = data.filter((item: { isUnread?: boolean }) => item.isUnread).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load unread notification count:', err);
      }
    }

    fetchUnreadCount();
  }, [pathname]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, category: 'MENU', href: '/dashboard', show: true },
    { name: 'My Requests', icon: FileText, category: 'MENU', href: '/requests', show: true },
    { 
      name: 'Reviewer Portal', 
      icon: ShieldCheck, 
      category: 'MENU', 
      href: '/reviewer', 
      badge: 'Reviewer',
      show: isReviewerRole // ONLY shown if user is Advancement, Senate, Council, or Admin
    },
    { name: 'Submit New Request', icon: PlusCircle, category: 'MENU', href: '/new-requests', show: true },
    { name: 'Notifications', icon: Bell, category: 'MENU', href: '/notifications', showBadge: true, show: true },
    { name: 'Drafts', icon: FileEdit, category: 'MENU', href: '/drafts', show: true },
    
    { name: 'Reports', icon: BarChart3, category: 'GENERAL', href: '/reports', show: true },
    { name: 'Settings', icon: Settings, category: 'GENERAL', href: '/settings', show: true },
    { name: 'Help & Support', icon: HelpCircle, category: 'GENERAL', href: '/support', show: true },
  ];

  const categories = ['MENU', 'GENERAL'];

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-[#1E2640] text-slate-400 font-sans border-r border-slate-800 shrink-0">
      
      <div className="flex flex-col pt-6 px-4 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5D5CFF]">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">GiftFlow</span>
        </div>

        {/* Navigation Categories */}
        <nav className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {category}
              </h3>
              
              <ul className="space-y-1">
                {menuItems
                  .filter((item) => item.category === category && item.show) // Filter by role permission
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href; 
                    
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all group outline-none ${
                            isActive
                              ? 'bg-[#5D5CFF] text-white shadow-lg shadow-indigo-500/20'
                              : 'hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          
                          {/* Reviewer Tag Badge */}
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide transition-all ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {/* Dynamic Badge Count for Notifications */}
                          {item.showBadge && unreadCount > 0 && (
                            <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white transition-all ${
                              isActive ? 'bg-white/20' : 'bg-[#EF4444]'
                            }`}>
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

     

    </aside>
  );
}