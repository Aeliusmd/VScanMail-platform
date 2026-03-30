"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationAccent = "primary" | "success" | "amber" | "neutral";

const notifications = [
  {
    id: 1,
    accent: "primary" as NotificationAccent,
    title: "New Mail Received",
    desc: "Invoice from ABC Corp",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    accent: "success" as NotificationAccent,
    title: "Cheque Deposited",
    desc: "$5,000 deposited successfully",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    accent: "neutral" as NotificationAccent,
    title: "Mail Delivery Scheduled",
    desc: "Expected delivery: Tomorrow",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 4,
    accent: "amber" as NotificationAccent,
    title: "Action Required",
    desc: "Cheque #CH-2024-016 needs your decision",
    time: "2 days ago",
    unread: false,
  },
];

const navLinks = [
  { label: "Dashboard", href: "/customer-dashboard/dashboard", icon: "ri-dashboard-line" },
  { label: "Mails", href: "/customer-dashboard/mails", icon: "ri-mail-line" },
  { label: "Cheques", href: "/customer-dashboard/cheques", icon: "ri-bank-card-line" },
  { label: "Account", href: "/customer-dashboard/account", icon: "ri-user-settings-line" },
] as const;

const accentBorder: Record<NotificationAccent, string> = {
  primary: "border-[#0A3D8F]",
  success: "border-[#2F8F3A]",
  amber: "border-amber-500",
  neutral: "border-gray-300",
};

function isNavActive(pathname: string, href: string) {
  if (href === "/customer-dashboard/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CustomerNav() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const closePanels = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  useEffect(() => {
    closePanels();
    setMobileOpen(false);
  }, [pathname, closePanels]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (notificationsRef.current?.contains(target) || userMenuRef.current?.contains(target)) return;
      closePanels();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closePanels]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" aria-label="Customer dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-controls="customer-nav-mobile"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => {
                setMobileOpen((o) => !o);
                closePanels();
              }}
            >
              <i className={`text-xl ${mobileOpen ? "ri-close-line" : "ri-menu-line"}`} aria-hidden />
            </button>

            <Link href="/customer-dashboard/dashboard" className="flex items-center flex-shrink-0">
              <img
                src="/images/A-4.png"
                alt="VScan Mail"
                className="w-[139px] h-[72px] object-contain opacity-100"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-blue-50 text-[#0A3D8F]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <i className={`${link.icon} text-base`} aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserMenu(false);
                }}
                className="relative w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-haspopup="dialog"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <i className="ri-notification-3-line text-xl" aria-hidden />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl border border-gray-200 py-2 z-50 shadow-lg"
                  role="region"
                  aria-label="Notifications list"
                >
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <button
                      type="button"
                      className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${accentBorder[n.accent]} ${
                          n.unread ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{n.desc}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      type="button"
                      className="text-sm text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-haspopup="menu"
                aria-label="Account menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AC</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">Acme Corporation</p>
                  <p className="text-[10px] text-gray-500">Company Account</p>
                </div>
                <i className="ri-arrow-down-s-line text-gray-500 text-sm" aria-hidden />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 py-2 z-50 shadow-lg">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">Acme Corporation</p>
                    <p className="text-xs text-gray-500">acme@company.com</p>
                  </div>
                  <Link
                    href="/customer-dashboard/account"
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    onClick={closePanels}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center text-gray-400" aria-hidden>
                      <i className="ri-user-settings-line" />
                    </span>
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center text-gray-400" aria-hidden>
                      <i className="ri-question-line" />
                    </span>
                    Help &amp; Support
                  </button>
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <Link
                      href="/customer-dashboard/login"
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                      onClick={closePanels}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
                        <i className="ri-logout-box-line" />
                      </span>
                      Sign Out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div id="customer-nav-mobile" className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active ? "bg-blue-50 text-[#0A3D8F]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <i className={`${link.icon} text-base`} aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
