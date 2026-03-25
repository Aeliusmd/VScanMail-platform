"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@iconify/react';

const navItems = [
  { icon: 'ri:dashboard-line', label: 'Dashboard', path: '/dashboard' },
  { icon: 'ri:scan-2-line', label: 'Scan Document', path: '/dashboard/scan' },
  { icon: 'ri:mail-line', label: 'All Mails', path: '/dashboard/mails' },
  { icon: 'ri:bank-card-line', label: 'All Cheques', path: '/dashboard/cheques' },
  { icon: 'ri:building-line', label: 'Companies', path: '/dashboard/companies' },
  { icon: 'ri:exchange-dollar-line', label: 'Deposit Requests', path: '/dashboard/deposits' },
  { icon: 'ri:truck-line', label: 'Delivery Requests', path: '/dashboard/deliveries' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isSettingsRoute =
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/');
  const isMailsPage = pathname === '/dashboard/mails';
  const isChequesPage = pathname === '/dashboard/cheques';
  const isCompaniesPage = pathname === '/dashboard/companies';
  const isDepositsPage = pathname === '/dashboard/deposits';
  const isDeliveriesPage = pathname === '/dashboard/deliveries';

  const mailLabels = [
    { icon: 'ri:inbox-line', label: 'All Mail', count: 10, color: '#0F172A', bg: 'bg-[#F1F5F9]', fontWeight: 'font-semibold' },
    { icon: 'ri:mail-check-line', label: 'Processed', count: 6, color: '#0A3D8F' },
    { icon: 'ri:truck-line', label: 'Delivered', count: 3, color: '#2F8F3A' },
    { icon: 'ri:time-line', label: 'Pending', count: 1, color: '#F59E0B' },
  ];

  const chequeLabels = [
    { icon: 'ri:inbox-archive-line', label: 'All Cheques', count: 10, color: '#0F172A', bg: 'bg-[#F1F5F9]', fontWeight: 'font-semibold' },
    { icon: 'ri:time-line', label: 'Pending', count: 4, color: '#F59E0B' },
    { icon: 'ri:checkbox-circle-line', label: 'Deposited', count: 4, color: '#2F8F3A' },
    { icon: 'ri:close-circle-line', label: 'Rejected', count: 1, color: '#EF4444' },
    { icon: 'ri:pause-circle-line', label: 'On Hold', count: 1, color: '#64748B' },
  ];

  const companyLabels = [
    { icon: 'ri:building-line', label: 'All Companies', count: 10, color: '#0F172A', bg: 'bg-[#F1F5F9]', fontWeight: 'font-semibold' },
    { icon: 'ri:checkbox-circle-line', label: 'Active', count: 8, color: '#2F8F3A' },
    { icon: 'ri:time-line', label: 'Pending', count: 1, color: '#F59E0B' },
    { icon: 'ri:pause-circle-line', label: 'Inactive', count: 1, color: '#64748B' },
  ];

  const depositLabels = [
    { icon: 'ri:inbox-archive-line', label: 'All Requests', count: 10, color: '#0F172A', bg: 'bg-[#F1F5F9]', fontWeight: 'font-semibold' },
    { icon: 'ri:time-line', label: 'Pending', count: 5, color: '#F59E0B' },
    { icon: 'ri:checkbox-circle-line', label: 'Approved', count: 4, color: '#2F8F3A' },
    { icon: 'ri:close-circle-line', label: 'Rejected', count: 1, color: '#EF4444' },
  ];

  const deliveryLabels = [
    { icon: 'ri:inbox-archive-line', label: 'All Requests', count: 10, color: '#0F172A', bg: 'bg-[#F1F5F9]', fontWeight: 'font-semibold' },
    { icon: 'ri:time-line', label: 'Pending', count: 4, color: '#F59E0B' },
    { icon: 'ri:truck-line', label: 'In Transit', count: 3, color: '#0A3D8F' },
    { icon: 'ri:check-double-line', label: 'Delivered', count: 2, color: '#2F8F3A' },
    { icon: 'ri:close-circle-line', label: 'Failed', count: 1, color: '#EF4444' },
  ];

  const labels =
    isMailsPage
      ? mailLabels
      : isChequesPage
        ? chequeLabels
        : isCompaniesPage
          ? companyLabels
          : isDepositsPage
            ? depositLabels
            : isDeliveriesPage
              ? deliveryLabels
            : null;

  const getLabelColorClass = (color?: string) => {
    switch (color) {
      case '#0F172A':
        return 'text-[#0F172A]';
      case '#0A3D8F':
        return 'text-[#0A3D8F]';
      case '#2F8F3A':
        return 'text-[#2F8F3A]';
      case '#F59E0B':
        return 'text-[#F59E0B]';
      case '#EF4444':
        return 'text-[#EF4444]';
      case '#64748B':
        return 'text-[#64748B]';
      default:
        return 'text-inherit';
    }
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[210px]'} flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 h-[64px]">
        {!collapsed && (
          <Image
            src="/images/icon.jpg"
            alt="VScanMail"
            width={130}
            height={52}
            className="w-[130px] h-[52px] object-contain opacity-100 ml-[-4px]"
          />
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition cursor-pointer ml-auto"
        >
          <Icon icon={collapsed ? 'ri:menu-unfold-line' : 'ri:menu-fold-line'} className="text-lg" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center transition cursor-pointer font-roboto pt-[12px] pb-[12px] pl-[20px] pr-[16px] h-[52px] ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#0A3D8F] font-medium rounded-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0A3D8F] rounded-r opacity-0"></div> /* the screenshot didn't have the blue bar, but keeping placeholder just in case */
              )}
              <div 
                className="flex items-center justify-center flex-shrink-0 w-[20.84px] h-[28px]"
              >
                <Icon icon={item.icon} className="text-[20px]" />
              </div>
              {!collapsed && (
                <span 
                  className={`whitespace-nowrap ml-[12px] text-[14px] leading-[20px] ${
                    isActive ? 'font-medium' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Labels Section */}
      {!collapsed && labels && (
        <div className="px-4 py-4 border-t border-gray-100">
          <h3 
            className="text-[#94A3B8] font-semibold tracking-[0.6px] mb-2 px-4 text-[12px]"
          >
            Labels
          </h3>
          <div className="flex flex-col gap-1">
            {labels.map((item, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-colors h-[36px] ${
                  item.bg || 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    icon={item.icon}
                    className={`text-[16px] ${getLabelColorClass(item.color)}`}
                  />
                  <span 
                    className={`text-sm ${item.fontWeight || 'font-normal'} text-[#0F172A] text-[14px]`}
                  >{item.label}</span>
                </div>
                <span 
                  className={`text-xs ${item.fontWeight || 'font-normal'} text-[#94A3B8] text-[12px]`}
                >{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="border-t border-gray-100 py-4">
        <Link
          href="/dashboard/settings"
          className={`relative flex items-center transition cursor-pointer font-roboto pt-[12px] pb-[12px] pl-[20px] pr-[16px] h-[52px] ${
            isSettingsRoute
              ? 'bg-[#EFF6FF] text-[#0A3D8F] font-medium rounded-lg mx-2'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg mx-2'
          }`}
        >
          {isSettingsRoute && (
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#0A3D8F] rounded-r" />
          )}
          <div 
            className="flex items-center justify-center flex-shrink-0 w-[20.84px] h-[28px]"
          >
            <Icon icon="ri:settings-3-line" className="text-[20px]" />
          </div>
          {!collapsed && (
            <span 
              className={`whitespace-nowrap ml-[12px] text-[14px] leading-[20px] ${
                isSettingsRoute ? 'font-medium' : 'font-normal'
              }`}
            >
              Settings
            </span>
          )}
        </Link>

        {/* Bottom illustration */}
        {!collapsed && (
          <div className="mx-3 mt-4 rounded-xl overflow-hidden flex flex-col bg-[#1E40AF]">
            <img
              src="/images/wgd.jpeg"
              alt="Good Day"
              className="w-full h-auto object-contain"
            />
            <div className="text-white text-center py-2">
              <p className="text-[10px] font-light">Willing a</p>
              <p className="text-sm font-bold">Good Day !</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
