'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const items = [
  {
    href: '/admin/settings/profile',
    label: 'Profile',
    icon: 'ri:user-line',
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const linkClass = (href: string, active: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
      active ? 'bg-[#EFF6FF] text-[#0A3D8F] font-semibold' : 'text-slate-700 hover:bg-slate-50'
    }`;

  const iconWrapClass = (active: boolean) =>
    `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
      active ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-600'
    }`;

  return (
    <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col md:flex-row">
      {/* Settings sub-sidebar — desktop, directly after main app sidebar */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Settings</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const active = pathname === it.href || pathname === `${it.href}/`;
            return (
              <Link key={it.href} href={it.href} className={linkClass(it.href, active)}>
                <div className={iconWrapClass(active)}>
                  <Icon icon={it.icon} className="text-xl" />
                </div>
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: horizontal tabs */}
      <div className="flex md:hidden border-b border-gray-200 bg-white px-2 py-2 gap-1 overflow-x-auto flex-shrink-0">
        {items.map((it) => {
          const active = pathname === it.href || pathname === `${it.href}/`;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 ${
                active ? 'bg-[#EFF6FF] text-[#0A3D8F]' : 'text-slate-600 bg-slate-50'
              }`}
            >
              <Icon icon={it.icon} className="text-lg" />
              {it.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-slate-50">
        <div className="p-4 sm:p-6 max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
