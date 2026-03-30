"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Sidebar from "../dashboard/components/Sidebar";
import TopBar from "../dashboard/components/TopBar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // For now superadmin only has settings pages, but keep this flexible.
  const isSuperadminSettings = pathname?.startsWith("/superadmin/");

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

        {isSuperadminSettings && (
          <TopBar
            title="Settings"
            subtitle="Manage your account and system preferences"
            hideSearch
          />
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

