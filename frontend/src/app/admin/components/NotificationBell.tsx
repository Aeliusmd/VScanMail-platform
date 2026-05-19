"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { notificationsApi, type AdminNotification } from "@/lib/api/notifications";

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.notifIsRead).length, [notifications]);
  const hasUnread = unreadCount > 0;

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const rows = await notificationsApi.list();
      setNotifications(rows);
    } catch (error) {
      console.error("Failed to load admin notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showNotifications]);

  const formatRelativeTime = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(ms) || ms < 0) return "just now";
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, notifIsRead: true } : n))
    );

    try {
      await notificationsApi.markRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setShowNotifications(false);

    if (notification.notifTargetUrl) {
      router.push(notification.notifTargetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, notifIsRead: true })));
    try {
      await notificationsApi.markAllRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setShowNotifications((prev) => !prev)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative"
      >
        <div className="w-[20.84px] h-[20px] text-[#334155] flex items-center justify-center">
          <Icon icon="ri:notification-3-line" className="text-[20px] leading-none" />
        </div>
        {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-[340px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-[#0A3D8F] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!hasUnread}
              className="text-xs font-semibold text-[#1E40AF] cursor-pointer hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {notificationsLoading && (
              <div className="px-4 py-6 text-center text-xs text-gray-500">Loading notifications...</div>
            )}
            {!notificationsLoading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications yet.</div>
            )}
            {!notificationsLoading &&
              notifications.map((n) => {
                const unread = !n.notifIsRead;

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 border-l-4 cursor-pointer flex gap-3 transition-colors ${
                      unread
                        ? "border-l-[#0A3D8F] bg-blue-50 hover:bg-blue-100/70"
                        : "border-l-transparent bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${
                        unread ? "bg-[#0A3D8F] text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon icon={unread ? "ri:notification-3-fill" : "ri:notification-3-line"} className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs leading-5 ${unread ? "font-bold text-gray-950" : "font-medium text-gray-500"}`}>
                          {n.notifTitle || "New notification"}
                        </p>
                        {unread && (
                          <span className="mt-0.5 shrink-0 rounded-full bg-[#0A3D8F] px-2 py-0.5 text-[10px] font-bold text-white">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${unread ? "font-semibold text-[#0A3D8F]" : "text-gray-400"}`}>
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
