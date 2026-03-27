/* eslint-disable react/no-unknown-property */
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const items = [
  {
    href: '/dashboard/settings/profile',
    label: 'Profile',
    icon: 'ri:user-line',
  },
  {
    href: '/dashboard/settings/notifications',
    label: 'Notifications',
    icon: 'ri:notification-3-line',
  },
  {
    href: '/dashboard/settings/billing',
    label: 'Billing',
    icon: 'ri:credit-card-line',
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 bg-slate-50 min-h-full flex">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-slate-50">
          <div className="flex items-start gap-6">
            {/* Left settings tabs */}
            <div className="w-[240px] hidden md:block">
              <div className="rounded-2xl bg-white border border-slate-200 p-2">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Settings</p>
                </div>

                <div className="p-1 space-y-1">
                  {items.map((it) => {
                    const active = pathname === it.href || pathname === it.href + '/';
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition cursor-pointer ${
                          active ? 'bg-[#EFF6FF] text-[#0A3D8F] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            active ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon icon={it.icon} className="text-xl" />
                        </div>
                        <span>{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right content */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 px-1">
                <h1 className="text-lg font-bold text-slate-900">Settings</h1>
                <p className="text-xs text-slate-500 mt-1">Manage your account and system preferences</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

