"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useAdminProfile } from './useAdminProfile';
import NotificationBell from './NotificationBell';

interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Omit search field (e.g. on Settings). */
  hideSearch?: boolean;
}

export default function TopBar({ title, subtitle, hideSearch }: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { userData, initials, displayName, displayRole } = useAdminProfile();

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

        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-4">{displayName}</p>
              <p className="text-xs text-gray-500 uppercase">{displayRole}</p>
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
                href="/admin/settings/profile"
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
