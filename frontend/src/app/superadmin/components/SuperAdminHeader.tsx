"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSuperAdminToolbarOptional } from "./SuperAdminToolbarContext";

const headerNotifications = [
  {
    icon: "ri-building-line",
    color: "text-[#0A3D8F]",
    border: "border-[#0A3D8F]",
    text: "New company registered: TechNova Solutions",
    time: "5 mins ago",
  },
  {
    icon: "ri-exchange-dollar-line",
    color: "text-orange-600",
    border: "border-orange-500",
    text: "3 deposit requests awaiting approval",
    time: "18 mins ago",
  },
  {
    icon: "ri-user-add-line",
    color: "text-sky-600",
    border: "border-sky-500",
    text: "Admin Sarah Mitchell logged in",
    time: "30 mins ago",
  },
  {
    icon: "ri-truck-line",
    color: "text-slate-600",
    border: "border-slate-400",
    text: "Delivery confirmed by Gulf Bridge Trading",
    time: "1 hr ago",
  },
];

export type SuperAdminHeaderProps = {
  title: string;
  subtitle: ReactNode;
  hideTitleBlock?: boolean;
  hideSearch?: boolean;
  onMobileNavOpen?: () => void;
  mobileNavBreakpoint?: "md" | "lg";
};

export default function SuperAdminHeader({
  title,
  subtitle,
  hideTitleBlock = false,
  hideSearch = false,
  onMobileNavOpen,
  mobileNavBreakpoint = "lg",
}: SuperAdminHeaderProps) {
  const pathname = usePathname() ?? "";
  const toolbar = useSuperAdminToolbarOptional();

  const isListToolbarPage =
    pathname === "/superadmin/companies" ||
    pathname === "/superadmin/deposits" ||
    pathname === "/superadmin/deliveries";
  const showListToolbar = Boolean(hideTitleBlock && isListToolbarPage && toolbar);

  const menuHiddenFrom = mobileNavBreakpoint === "md" ? "md:hidden" : "lg:hidden";
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  const [userData, setUserData] = useState<{ firstName: string, lastName: string, avatarUrl: string, email: string, role: string } | null>(null);

  const fetchUserProfile = async () => {
    // We can't use server actions directly in a component that might be rendered deeply without care, 
    // but here it's fine. Alternatively, use a simple fetch.
    try {
      const { getProfile } = await import("../settings/profile/actions");
      const res = await getProfile();
      if (res.success && res.data) {
        setUserData({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          avatarUrl: res.data.avatarUrl || '',
          email: res.data.email || '',
          role: res.data.role || '',
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile in header", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    const handleUpdate = () => fetchUserProfile();
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const initials = userData?.firstName && userData?.lastName 
    ? `${userData.firstName[0].toUpperCase()}${userData.lastName[0].toUpperCase()}`
    : 'SA';

  const displayName = userData?.firstName 
    ? `${userData.firstName} ${userData.lastName}`
    : 'Super Admin';

  const displayEmail = userData?.email || 'superadmin@vscanmail.com';

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const el = e.target as Node;
      if (notificationsRef.current?.contains(el) || profileRef.current?.contains(el)) return;
      setShowNotifications(false);
      setShowProfile(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    notificationsBtnRef.current?.setAttribute("aria-expanded", showNotifications ? "true" : "false");
    profileBtnRef.current?.setAttribute("aria-expanded", showProfile ? "true" : "false");
  }, [showNotifications, showProfile]);

  const searchPlaceholder =
    pathname === "/superadmin/companies"
      ? "Search companies..."
      : pathname === "/superadmin/deposits"
        ? "Search deposit requests..."
        : "Search delivery requests...";

  const searchLabel =
    pathname === "/superadmin/companies"
      ? "Search companies"
      : pathname === "/superadmin/deposits"
        ? "Search deposit requests"
        : "Search delivery requests";

  /** HEADER-108: Inter 14px / 500 input; Roboto 14px/600 & 12px/400 profile */
  const searchFieldClass =
    "w-full h-[38px] box-border rounded-full bg-[#F1F5F9] border-0 pl-[41px] pr-[17px] py-[9px] text-[14px] leading-5 font-medium text-slate-900 placeholder:text-[#9CA3AF] placeholder:font-medium outline-none focus:ring-2 focus:ring-[#0A3D8F]/25 focus:ring-offset-0 [font-family:Inter,system-ui,sans-serif]";

  const notificationsAndProfile = (
    <div className="flex items-center gap-3 shrink-0">
      <div className="relative" ref={notificationsRef}>
        <button
          ref={notificationsBtnRef}
          type="button"
          onClick={() => {
            setShowNotifications((v) => !v);
            setShowProfile(false);
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full p-2 text-[#475569] hover:bg-slate-100 transition-colors cursor-pointer"
          aria-haspopup="true"
          aria-label="Notifications"
        >
          <i className="ri-notification-3-line text-[21px] leading-none"></i>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" aria-hidden />
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-[min(100vw-2rem,20rem)] sm:w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900 text-sm [font-family:Roboto,system-ui,sans-serif]">Notifications</h3>
              <button
                type="button"
                className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap cursor-pointer hover:underline [font-family:Roboto,system-ui,sans-serif]"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {headerNotifications.map((n, i) => (
                <div key={i} className={`p-4 hover:bg-slate-50 border-l-4 ${n.border} cursor-pointer`}>
                  <div className="flex items-start gap-3">
                    <i className={`${n.icon} ${n.color} text-xl mt-0.5 shrink-0`}></i>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 text-center">
              <button
                type="button"
                className="text-sm text-[#0A3D8F] font-medium whitespace-nowrap cursor-pointer hover:underline [font-family:Roboto,system-ui,sans-serif]"
              >
                View All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative border-l border-slate-200 pl-[13px]" ref={profileRef}>
        <button
          ref={profileBtnRef}
          type="button"
          onClick={() => {
            setShowProfile((v) => !v);
            setShowNotifications(false);
          }}
          className="flex items-center gap-2 cursor-pointer rounded-r-lg hover:bg-slate-50 py-1 min-h-[32px] pr-0 transition-colors"
          aria-haspopup="true"
          aria-label="Account menu"
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white font-semibold text-xs leading-4 [font-family:Roboto,system-ui,sans-serif] overflow-hidden">
            {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="SA" className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-sm font-semibold leading-[14px] text-[#0F172A] truncate [font-family:Roboto,system-ui,sans-serif]">
              {displayName}
            </p>
            <p className="text-xs font-normal leading-4 text-[#64748B] mt-0.5 [font-family:Roboto,system-ui,sans-serif]">
              {userData?.role === 'super_admin' ? 'System Administrator' : (userData?.role?.replace('_', ' ') || 'Administrator')}
            </p>
          </div>
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900 text-sm [font-family:Roboto,system-ui,sans-serif] truncate">{displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{displayEmail}</p>
            </div>
            <div className="p-2">
              <Link
                href="/superadmin/settings/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                onClick={() => setShowProfile(false)}
              >
                <i className="ri-settings-3-line text-slate-500"></i>
                Settings
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                onClick={() => setShowProfile(false)}
              >
                <i className="ri-logout-box-line"></i>
                Sign Out
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const primaryBtnClass =
    "inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#0A3D8F] px-4 py-2 text-sm font-semibold text-white transition-colors [font-family:Roboto,system-ui,sans-serif] hover:bg-[#083170]";

  if (showListToolbar && toolbar) {
    return (
      <header className="z-20 flex-shrink-0 border-b border-slate-200 bg-white pt-3 pb-[13px] pl-4 pr-4 sm:pl-6 sm:pr-6">
        <div className="flex min-h-[44px] w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {onMobileNavOpen && (
              <button
                type="button"
                onClick={onMobileNavOpen}
                className={`${menuHiddenFrom} h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50`}
                aria-label="Open menu"
              >
                <i className="ri-menu-line text-xl"></i>
              </button>
            )}

            <div className="relative h-[38px] w-full max-w-[576px]">
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={toolbar.search}
                onChange={(e) => toolbar.setSearch(e.target.value)}
                className={searchFieldClass}
                aria-label={searchLabel}
              />
              <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#94A3B8]"></i>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 md:pl-4">
            {pathname === "/superadmin/companies" && (
              <button
                type="button"
                onClick={() => toolbar.addCompanyHandlerRef.current?.()}
                className={primaryBtnClass}
              >
                <i className="ri-add-line text-[15px] leading-none"></i>
                <span className="hidden sm:inline">Add Company</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {(pathname === "/superadmin/deposits" || pathname === "/superadmin/deliveries") && (
              <Link href="/superadmin/scan" className={primaryBtnClass}>
                <i className="ri-scan-2-line text-[15px] leading-none"></i>
                <span className="hidden sm:inline">New Scan</span>
                <span className="sm:hidden">Scan</span>
              </Link>
            )}

            {notificationsAndProfile}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`z-20 flex-shrink-0 border-b border-slate-200 bg-white pl-4 pr-4 sm:pl-6 sm:pr-6 ${
        hideTitleBlock ? "flex h-[69px] items-center py-0" : "pt-3 pb-[13px]"
      }`}
    >
      <div
        className={
          hideTitleBlock
            ? "flex min-h-[44px] w-full flex-row items-center justify-between gap-4"
            : "flex min-h-[44px] w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
        }
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onMobileNavOpen && (
            <button
              type="button"
              onClick={onMobileNavOpen}
              className={`${menuHiddenFrom} h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50`}
              aria-label="Open menu"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
          )}
          {!hideTitleBlock && (
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight text-slate-900 sm:text-xl">{title}</h1>
              <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 sm:line-clamp-none sm:text-xs">{subtitle}</div>
            </div>
          )}
        </div>

        <div
          className={
            hideTitleBlock
              ? "flex min-w-0 shrink-0 flex-row items-center justify-end gap-3"
              : "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:shrink-0"
          }
        >
          {!hideSearch && (
            <div className="relative h-[38px] w-full min-w-0 max-w-[576px] sm:w-full lg:w-[576px]">
              <input
                type="search"
                placeholder="Search companies, requests..."
                className={searchFieldClass}
                aria-label="Search companies and requests"
              />
              <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#94A3B8]"></i>
            </div>
          )}

          {notificationsAndProfile}
        </div>
      </div>
    </header>
  );
}
