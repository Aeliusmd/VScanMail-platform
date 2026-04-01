"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Sidebar from "../dashboard/components/Sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isSuperadminArea = pathname?.startsWith("/superadmin/");
  const isSuperadminSettings = pathname?.startsWith("/superadmin/settings");
  const headerTitle = isSuperadminSettings ? "Settings" : "Super Admin Dashboard";
  const headerSubtitle = isSuperadminSettings
    ? "Manage your account, admins, and billing preferences"
    : `Full system overview - ${new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {mobileSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30"
        />
      )}

      <div
        className={`fixed md:static inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Suspense fallback={null}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </Suspense>
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <button
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="md:hidden fixed top-3 left-3 z-20 w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <Icon
            icon={mobileSidebarOpen ? "ri:close-line" : "ri:menu-line"}
            className="text-lg"
          />
        </button>

        {isSuperadminArea && (
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2 min-h-[64px] flex items-center justify-between flex-shrink-0">
            <div className="pl-11 md:pl-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{headerTitle}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{headerSubtitle}</p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative text-slate-600"
                aria-label="Notifications"
              >
                <Icon icon="ri:notification-3-line" className="text-[20px] leading-none" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

              <Link href="/superadmin/settings/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition">
                <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xs">
                  JM
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-4">James Mitchell</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </Link>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

