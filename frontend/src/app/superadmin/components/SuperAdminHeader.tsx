"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

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
  /** Opens the mobile sidebar when set (hamburger hidden from this breakpoint up). Layout sidebar uses `md`; standalone super-admin dashboard shell uses `lg`. */
  onMobileNavOpen?: () => void;
  mobileNavBreakpoint?: "md" | "lg";
};

export default function SuperAdminHeader({
  title,
  subtitle,
  onMobileNavOpen,
  mobileNavBreakpoint = "lg",
}: SuperAdminHeaderProps) {
  const menuHiddenFrom = mobileNavBreakpoint === "md" ? "md:hidden" : "lg:hidden";
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

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

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex-shrink-0 z-20">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onMobileNavOpen && (
            <button
              type="button"
              onClick={onMobileNavOpen}
              className={`${menuHiddenFrom} shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50`}
              aria-label="Open menu"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight truncate">{title}</h1>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">{subtitle}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 min-w-0 lg:shrink-0">
          <div className="relative w-full sm:max-w-xs lg:w-60 min-w-0">
            <input
              type="search"
              placeholder="Search companies, requests..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent outline-none bg-white"
              aria-label="Search companies and requests"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
            <div className="relative" ref={notificationsRef}>
              <button
                ref={notificationsBtnRef}
                type="button"
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowProfile(false);
                }}
                className="relative w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-haspopup="true"
                aria-label="Notifications"
              >
                <i className="ri-notification-3-line text-slate-600 text-lg"></i>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[min(100vw-2rem,20rem)] sm:w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                    <button
                      type="button"
                      className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap cursor-pointer hover:underline"
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
                      className="text-sm text-[#0A3D8F] font-medium whitespace-nowrap cursor-pointer hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                ref={profileBtnRef}
                type="button"
                onClick={() => {
                  setShowProfile((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200 cursor-pointer rounded-r-lg hover:bg-slate-50 py-1 -my-1 pr-1 min-h-[44px] sm:min-h-0"
                aria-haspopup="true"
                aria-label="Account menu"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#0A3D8F] to-[#083170] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  SA
                </div>
                <div className="text-left hidden sm:block min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-none truncate">Super Admin</p>
                  <p className="text-xs text-[#0A3D8F] mt-0.5">Full Access</p>
                </div>
                <i className="ri-arrow-down-s-line text-slate-400 hidden sm:block shrink-0"></i>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-lg z-50">
                  <div className="p-4 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm">Super Admin</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">superadmin@vscanmail.com</p>
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
                      href="/super-admin-login"
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
        </div>
      </div>
    </header>
  );
}
