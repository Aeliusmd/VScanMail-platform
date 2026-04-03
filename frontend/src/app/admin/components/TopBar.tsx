"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Omit search field (e.g. on Settings). */
  hideSearch?: boolean;
}

export default function TopBar({ title, subtitle, hideSearch }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, text: 'New mail received from Tech Solutions Inc', time: '5 mins ago', unread: true },
    { id: 2, text: 'Cheque deposit request from Global Enterprises', time: '12 mins ago', unread: true },
    { id: 3, text: 'Delivery completed for Innovate Corp', time: '25 mins ago', unread: false },
    { id: 4, text: 'New company registration pending approval', time: '1 hour ago', unread: false },
  ];

  return (
    <header
      className={`bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 ${
        subtitle ? 'min-h-[64px] py-2' : 'h-[64px]'
      }`}
    >
      {/* Title */}
      <div className="pl-11 md:pl-0 flex flex-col justify-center min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 font-roboto leading-tight">{title}</h1>
        {subtitle ? (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-roboto">{subtitle}</p>
        ) : null}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {!hideSearch && (
          <div className="relative hidden md:block">
            <div className="w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon="ri:search-line" className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] w-[220px] transition"
            />
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative"
          >
            <div className="w-[20.84px] h-[20px] text-[#334155] flex items-center justify-center">
              <Icon icon="ri:notification-3-line" className="text-[20px] leading-none" />
            </div>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                <span className="text-xs text-[#1E40AF] cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${n.unread ? 'bg-[#EFF6FF]/40' : ''}`}>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] flex-shrink-0">
                      <Icon icon="ri:mail-line" className="text-[#1E40AF] text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-5">{n.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                    {n.unread && <span className="w-2 h-2 bg-[#1E40AF] rounded-full flex-shrink-0 mt-1.5"></span>}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 text-center">
                <span className="text-xs text-[#1E40AF] cursor-pointer hover:underline">View all notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              AD
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-4">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-4 h-4 items-center justify-center text-gray-400 hidden sm:flex">
              <Icon icon="ri:arrow-down-s-line" className="text-base" />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-[180px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
              <Link href="/admin/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:user-line" className="text-sm" /></div>
                My Profile
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:settings-3-line" className="text-sm" /></div>
                Settings
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:logout-box-r-line" className="text-sm" /></div>
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
