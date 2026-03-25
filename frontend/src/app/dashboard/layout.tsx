"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isSettingsRoute =
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/');
  const isScanRoute = pathname === '/dashboard/scan';

  const hideTopBar =
    pathname === '/dashboard/mails' ||
    pathname === '/dashboard/cheques' ||
    pathname === '/dashboard/companies' ||
    pathname === '/dashboard/deposits' ||
    pathname === '/dashboard/deliveries';

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {mobileSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30"
        />
      )}

      <div className={`fixed md:static inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <button
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="md:hidden fixed top-3 left-3 z-20 w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <Icon icon={mobileSidebarOpen ? 'ri:close-line' : 'ri:menu-line'} className="text-lg" />
        </button>

        {isSettingsRoute && (
          <TopBar
            title="Settings"
            subtitle="Manage your account and system preferences"
            hideSearch
          />
        )}
        {isScanRoute && !isSettingsRoute && (
          <TopBar
            title="Scan Document"
            subtitle="Step-by-step envelope scanning process"
            hideSearch
          />
        )}
        {!isSettingsRoute && !isScanRoute && !hideTopBar && <TopBar title="Dashboard Overview" />}
        <main
          className={
            isSettingsRoute
              ? 'flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden'
              : 'flex-1 overflow-y-auto'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
