"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrgContext } from "./OrgContext";
import { customerNotificationsApi, type AdminNotification } from "@/lib/api/notifications";

type NotificationAccent = "primary" | "success" | "amber" | "neutral";

const accentBorder: Record<NotificationAccent, string> = {
  primary: "border-[#0A3D8F]",
  success: "border-[#2F8F3A]",
  amber: "border-amber-500",
  neutral: "border-gray-300",
};

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatRelativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function pickAccent(n: AdminNotification): NotificationAccent {
  const target = (n.notifTargetUrl || "").toLowerCase();
  const action = String(n.action || "").toLowerCase();

  if (target.includes("/deposits") || action.includes("deposit")) return "success";
  if (target.includes("/deliveries") || action.includes("delivery")) return "primary";
  if (action.includes("action_required") || action.includes("requires") || action.includes("flag")) return "amber";
  if (target.includes("/mails") || action.includes("mail") || target.includes("/cheques") || action.includes("cheque"))
    return "neutral";
  return "neutral";
}

export default function CustomerNav() {
  const org = useOrgContext();
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.notifIsRead).length, [notifications]);

  const companyName = org.companyName || "Organization";
  const email = org.client?.email || "";
  const clientId = org.clientId;
  const avatarUrl = org.avatarUrl;
  const baseHref = clientId ? `/customer/${clientId}` : "/customer";

  const navLinks = [
    { label: "Dashboard", href: `${baseHref}/dashboard`, icon: "ri-dashboard-line" },
    { label: "Mails", href: `${baseHref}/mails`, icon: "ri-mail-line" },
    { label: "Cheques", href: `${baseHref}/cheques`, icon: "ri-bank-card-line" },
    { label: "Deposits", href: `${baseHref}/deposits`, icon: "ri-exchange-dollar-line" },
    { label: "Deliveries", href: `${baseHref}/deliveries`, icon: "ri-truck-line" },
    { label: "Account", href: `${baseHref}/account`, icon: "ri-user-settings-line" },
  ] as const;
  const initials =
    companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "??";

  const avatarSrc = avatarUrl
    ? avatarUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}${avatarUrl}` : avatarUrl
    : null;

  const closePanels = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const rows = await customerNotificationsApi.list();
      setNotifications(rows);
    } catch (error) {
      console.error("Failed to load customer notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    closePanels();
    setMobileOpen(false);
  }, [pathname, closePanels]);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (notificationsRef.current?.contains(target) || userMenuRef.current?.contains(target)) return;
      closePanels();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closePanels]);

  const handleNotificationClick = useCallback(
    async (n: AdminNotification) => {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, notifIsRead: true } : x)));
      try {
        await customerNotificationsApi.markRead(n.id);
      } catch (error) {
        console.error("Failed to mark customer notification as read:", error);
      }

      setShowNotifications(false);
      if (n.notifTargetUrl) {
        router.push(n.notifTargetUrl);
      }
    },
    [router]
  );

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, notifIsRead: true })));
    try {
      await customerNotificationsApi.markAllRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all customer notifications as read:", error);
    }
  }, [loadNotifications]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" aria-label="Customer dashboard">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
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

            <Link href={`${baseHref}/dashboard`} className="flex items-center flex-shrink-0">
              <img
                src="/images/A-4.png"
                alt="VScan Mail"
                className="w-[139px] h-[72px] object-contain opacity-100"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
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
                  className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl border border-gray-200 py-2 z-50 shadow-lg overflow-hidden"
                  role="region"
                  aria-label="Notifications list"
                >
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <button
                      type="button"
                      className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap hover:underline"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading && (
                      <div className="px-4 py-6 text-center text-xs text-gray-500">Loading notifications...</div>
                    )}
                    {!notificationsLoading && notifications.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications yet.</div>
                    )}
                    {!notificationsLoading &&
                      notifications.map((n) => {
                        const accent = pickAccent(n);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => void handleNotificationClick(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${accentBorder[accent]} ${
                              !n.notifIsRead ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">{n.notifTitle || "New notification"}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </button>
                        );
                      })}
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
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={companyName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{companyName}</p>
                  <p className="text-[10px] text-gray-500">Organization Account</p>
                </div>
                <i className="ri-arrow-down-s-line text-gray-500 text-sm" aria-hidden />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 py-2 z-50 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                    <p className="text-xs text-gray-500">{email || "—"}</p>
                  </div>
                  <Link
                    href={`${baseHref}/account`}
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
                      href="/login"
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
