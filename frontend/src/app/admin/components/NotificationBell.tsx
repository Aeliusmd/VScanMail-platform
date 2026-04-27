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
  const hasUnread = useMemo(() => notifications.some((n) => !n.notifIsRead), [notifications]);

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
        <div className="absolute right-0 top-12 w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-[#1E40AF] cursor-pointer hover:underline"
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
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${
                    !n.notifIsRead ? "bg-[#EFF6FF]/40" : ""
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] flex-shrink-0">
                    <Icon icon="ri:notification-3-line" className="text-[#1E40AF] text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-5">{n.notifTitle || "New notification"}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.notifIsRead && (
                    <span className="w-2 h-2 bg-[#1E40AF] rounded-full flex-shrink-0 mt-1.5"></span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
