"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SuperAdminHeader from "./components/SuperAdminHeader";
import SuperAdminSidebar from "./components/SuperAdminSidebar";
import { SuperAdminToolbarProvider } from "./components/SuperAdminToolbarContext";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
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

  /** List pages reuse admin UI with search + actions in the page body (like /admin/companies). */
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

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </SuperAdminToolbarProvider>
    </div>
  );
}

