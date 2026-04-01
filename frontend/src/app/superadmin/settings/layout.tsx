"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

const items = [
  {
    href: "/superadmin/settings/profile",
    label: "Profile",
    icon: "ri:user-settings-line",
    desc: "Personal info & password",
  },
  {
    href: "/superadmin/settings/manage-admins",
    label: "Manage Admins",
    icon: "ri:team-line",
    desc: "Add, update & remove admins",
  },
  {
    href: "/superadmin/settings/activity",
    label: "Activity Log",
    icon: "ri:history-line",
    desc: "System activity records",
  },
  {
    href: "/superadmin/settings/billing",
    label: "Billing",
    icon: "ri:bank-card-line",
    desc: "Plans & billing management",
  },
];

export default function SuperAdminSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col md:flex-row">
      {/* Settings sub-sidebar — desktop */}
      <aside className="hidden md:block w-60 bg-white border-r border-slate-200 flex-shrink-0 p-4 space-y-1">
        <nav>
          {items.map((it) => {
            const active = pathname === it.href || pathname === `${it.href}/`;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-sm transition-colors cursor-pointer text-left ${
                  active
                    ? "bg-[#0A3D8F]/10 text-[#0A3D8F]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon icon={it.icon} className="text-base mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-semibold leading-tight ${active ? "text-[#0A3D8F]" : "text-slate-700"}`}>
                    {it.label}
                  </p>
                  <p className={`text-xs mt-0.5 leading-tight ${active ? "text-[#0A3D8F]/70" : "text-slate-400"}`}>
                    {it.desc}
                  </p>
                </div>
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
                active ? "bg-[#EFF6FF] text-[#0A3D8F]" : "text-slate-600 bg-slate-50"
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
        <div className="p-4 sm:p-6 max-w-5xl">{children}</div>
      </div>
    </div>
  );
}

