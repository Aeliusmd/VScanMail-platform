"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SuperAdminHeader from "./components/SuperAdminHeader";
import SuperAdminSidebar from "./components/SuperAdminSidebar";
import { SuperAdminToolbarProvider } from "./components/SuperAdminToolbarContext";
import SessionTimeoutProvider from "@/components/SessionTimeoutProvider";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const authorized = useRoleGuard(["super_admin"]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const [dateString, setDateString] = useState<string>("");
  useEffect(() => {
    setDateString(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const isSuperadminArea = pathname?.startsWith("/superadmin");
  const isSuperadminSettings = pathname?.startsWith("/superadmin/settings");

  const isSuperadminListToolbarPage =
    pathname === "/superadmin/companies" ||
    pathname === "/superadmin/deposits" ||
    pathname === "/superadmin/deliveries";

  const { headerTitle, headerSubtitle } = useMemo(() => {
    if (isSuperadminSettings) {
      return {
        headerTitle: "Settings",
        headerSubtitle: "Manage your account, admins, and billing preferences",
      };
    }
    return {
      headerTitle: "Super Admin Dashboard",
      headerSubtitle: (
        <>
          <span className="hidden sm:inline">Full system overview — </span>
          {dateString}
        </>
      ),
    };
  }, [isSuperadminSettings, dateString]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D8F]" />
      </div>
    );
  }

  return (
    <SessionTimeoutProvider>
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
          <SuperAdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        <SuperAdminToolbarProvider>
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {isSuperadminArea && (
              <SuperAdminHeader
                title={headerTitle}
                subtitle={headerSubtitle}
                hideTitleBlock={isSuperadminListToolbarPage}
                hideSearch={isSuperadminListToolbarPage}
                onMobileNavOpen={() => setMobileSidebarOpen(true)}
                mobileNavBreakpoint="md"
              />
            )}

            <main className={isSuperadminListToolbarPage ? 'flex flex-1 min-h-0 flex-col overflow-hidden' : 'flex-1 overflow-y-auto'}>{children}</main>
          </div>
        </SuperAdminToolbarProvider>
      </div>
    </SessionTimeoutProvider>
  );
}
