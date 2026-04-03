"use client";

import { useCallback, useState, type ReactNode } from "react";
import SuperAdminSidebar from "../superadmin/components/SuperAdminSidebar";
import { SuperAdminOpenMobileNavProvider } from "../superadmin/components/SuperAdminMobileNavContext";

export default function SuperAdminStandaloneLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileSidebarOpen(true), []);

  return (
    <SuperAdminOpenMobileNavProvider open={openMobileNav}>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
        {mobileSidebarOpen && (
          <button
            type="button"
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed md:static inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <SuperAdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">{children}</div>
      </div>
    </SuperAdminOpenMobileNavProvider>
  );
}
