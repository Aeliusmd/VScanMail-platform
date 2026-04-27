"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", icon: "ri-dashboard-3-line", href: "/super-admin" },
  { label: "Organizations", icon: "ri-building-4-line", href: "/superadmin/companies" },
  { label: "Deposit Requests", icon: "ri-exchange-dollar-line", href: "/superadmin/deposits" },
  { label: "Delivery Requests", icon: "ri-truck-line", href: "/superadmin/deliveries" },
  { label: "Activity Log", icon: "ri-history-line", href: "/superadmin/activity" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/super-admin") {
    return pathname === "/super-admin" || pathname === "/superadmin/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function SuperAdminSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() ?? "";
  const isSettingsRoute =
    pathname === "/superadmin/settings" || pathname.startsWith("/superadmin/settings/");

  return (
    <aside
      className={`flex flex-col h-screen bg-slate-900 border-r border-slate-700/60 shadow-xl lg:shadow-none transition-[width] duration-300 ease-out flex-shrink-0 ${
        collapsed ? "w-[72px]" : "w-[min(100%,260px)] sm:w-[260px]"
      }`}
    >
      <div
        className={`py-4 border-b border-slate-700/60 min-h-[64px] flex items-center ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        <div
          className={`flex w-full min-w-0 items-center justify-between ${collapsed ? "gap-0" : "gap-2"}`}
        >
          {!collapsed ? (
            <Link href="/super-admin" className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-[#0A3D8F] rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-star-line text-white text-base" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-none truncate">VScan Mail</p>
                <p className="text-blue-400 text-xs font-medium mt-0.5">Super Admin</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/super-admin"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-[#0A3D8F]"
              title="Super Admin"
            >
              <i className="ri-shield-star-line text-sm text-white" aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            className={`flex shrink-0 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-700/60 hover:text-white cursor-pointer ${
              collapsed ? "h-6 w-6 p-0" : "h-8 w-8 rounded-lg"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={`${collapsed ? "ri-menu-unfold-line text-sm" : "ri-menu-fold-line text-lg"}`}
            />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto overscroll-contain px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                active
                  ? "bg-[#0A3D8F] text-white"
                  : "text-slate-200 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              <i className={`${item.icon} text-lg flex-shrink-0`} aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/60 space-y-0.5 shrink-0">
        <Link
          href="/superadmin/settings/profile"
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
            isSettingsRoute
              ? "bg-slate-700/80 text-white"
              : "text-slate-200 hover:bg-slate-700/60 hover:text-white"
          }`}
        >
          <i className="ri-settings-3-line text-lg flex-shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-red-900/40 hover:text-red-400 transition-colors min-h-[48px]"
        >
          <i className="ri-logout-box-line text-lg flex-shrink-0" aria-hidden />
          {!collapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </aside>
  );
}
