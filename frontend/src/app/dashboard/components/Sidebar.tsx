"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';

const navItems = [
  { icon: 'ri:dashboard-line', label: 'Dashboard', slug: '' },
  { icon: 'ri:scan-2-line', label: 'Scan Document', slug: '/scan' },
  { icon: 'ri:mail-line', label: 'All Mails', slug: '/mails' },
  { icon: 'ri:bank-card-line', label: 'All Cheques', slug: '/cheques' },
  { icon: 'ri:building-line', label: 'Companies', slug: '/companies' },
  { icon: 'ri:exchange-dollar-line', label: 'Deposit Requests', slug: '/deposits' },
  { icon: 'ri:truck-line', label: 'Delivery Requests', slug: '/deliveries' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const isSuperadminArea = pathname.startsWith('/superadmin');
  const basePath = isSuperadminArea ? '/superadmin' : '/dashboard';
  const settingsPath = isSuperadminArea ? '/superadmin/settings/profile' : '/dashboard/settings';
  const resolvedNavItems = navItems.map((item) => ({
    ...item,
    path:
      isSuperadminArea && item.slug === ''
        ? `${basePath}/dashboard`
        : `${basePath}${item.slug}`,
  }));
  const isSettingsRoute =
    pathname === '/dashboard/settings' ||
    pathname.startsWith('/dashboard/settings/') ||
    pathname === '/superadmin/settings' ||
    pathname.startsWith('/superadmin/settings/');
  const isMailsPage = pathname === `${basePath}/mails`;
  const isChequesPage = pathname === `${basePath}/cheques`;
  const isCompaniesPage = pathname === `${basePath}/companies`;
  const isDepositsPage = pathname === `${basePath}/deposits`;
  const isDeliveriesPage = pathname === `${basePath}/deliveries`;

  const getTabValueForLabel = (pagePath: string, label: string): string | null => {
    // Mail page tabs: All | Processed | Delivered | Pending Delivery
    if (pagePath.endsWith('/mails')) {
      if (label === 'All Mail') return 'All';
      if (label === 'Processed') return 'Processed';
      if (label === 'Delivered') return 'Delivered';
      if (label === 'Pending') return 'Pending Delivery';
      return null;
    }

    // Cheques page tabs: All | Pending Deposit | Deposited | Rejected | On Hold
    if (pagePath.endsWith('/cheques')) {
      if (label === 'All Cheques') return 'All';
      if (label === 'Pending') return 'Pending Deposit';
      if (label === 'Deposited') return 'Deposited';
      if (label === 'Rejected') return 'Rejected';
      if (label === 'On Hold') return 'On Hold';
      return null;
    }

    // Companies page tabs: All | Active | Pending | Inactive
    if (pagePath.endsWith('/companies')) {
      if (label === 'All Companies') return 'All';
      if (label === 'Active') return 'Active';
      if (label === 'Pending') return 'Pending';
      if (label === 'Inactive') return 'Inactive';
      return null;
    }

    // Deposits page tabs: All | Pending | Approved | Rejected | Deposited
    if (pagePath.endsWith('/deposits')) {
      if (label === 'All Requests') return 'All';
      if (label === 'Pending') return 'Pending';
      if (label === 'Approved') return 'Approved';
      if (label === 'Rejected') return 'Rejected';
      if (label === 'Deposited') return 'Deposited';
      return null;
    }

    // Deliveries page tabs: All | Pending | In Transit | Delivered | Failed
    if (pagePath.endsWith('/deliveries')) {
      if (label === 'All Requests') return 'All';
      if (label === 'Pending') return 'Pending';
      if (label === 'In Transit') return 'In Transit';
      if (label === 'Delivered') return 'Delivered';
      if (label === 'Failed') return 'Failed';
      return null;
    }

    return null;
  };

  const labelsPagePath = isMailsPage
    ? `${basePath}/mails`
    : isChequesPage
      ? `${basePath}/cheques`
      : isCompaniesPage
        ? `${basePath}/companies`
        : isDepositsPage
          ? `${basePath}/deposits`
          : isDeliveriesPage
            ? `${basePath}/deliveries`
            : null;

  const mailLabels = [
    {
      icon: 'ri:inbox-line',
      label: 'All Mail',
      count: 0,
      color: '#0F172A',
      bg: 'bg-[#F1F5F9]',
      fontWeight: 'font-semibold',
    },
    {
      icon: 'ri:mail-check-line',
      label: 'Processed',
      count: 0,
      color: '#0A3D8F',
    },
    {
      icon: 'ri:truck-line',
      label: 'Delivered',
      count: 0,
      color: '#2F8F3A',
    },
    {
      icon: 'ri:time-line',
      label: 'Pending',
      count: 0,
      color: '#F59E0B',
    },
  ];

  const chequeLabels = [
    {
      icon: 'ri:inbox-archive-line',
      label: 'All Cheques',
      count: 0,
      color: '#0F172A',
      bg: 'bg-[#F1F5F9]',
      fontWeight: 'font-semibold',
    },
    {
      icon: 'ri:time-line',
      label: 'Pending',
      count: 0,
      color: '#F59E0B',
    },
    {
      icon: 'ri:checkbox-circle-line',
      label: 'Deposited',
      count: 0,
      color: '#2F8F3A',
    },
    {
      icon: 'ri:close-circle-line',
      label: 'Rejected',
      count: 0,
      color: '#EF4444',
    },
    {
      icon: 'ri:pause-circle-line',
      label: 'On Hold',
      count: 0,
      color: '#64748B',
    },
  ];

  const companyLabels = [
    {
      icon: 'ri:building-line',
      label: 'All Companies',
      count: 0,
      color: '#0F172A',
      bg: 'bg-[#F1F5F9]',
      fontWeight: 'font-semibold',
    },
    {
      icon: 'ri:checkbox-circle-line',
      label: 'Active',
      count: 0,
      color: '#2F8F3A',
    },
    {
      icon: 'ri:time-line',
      label: 'Pending',
      count: 0,
      color: '#F59E0B',
    },
    {
      icon: 'ri:pause-circle-line',
      label: 'Inactive',
      count: 0,
      color: '#64748B',
    },
  ];

  const depositLabels = [
    {
      icon: 'ri:inbox-archive-line',
      label: 'All Requests',
      count: 0,
      color: '#0F172A',
      bg: 'bg-[#F1F5F9]',
      fontWeight: 'font-semibold',
    },
    {
      icon: 'ri:time-line',
      label: 'Pending',
      count: 0,
      color: '#F59E0B',
    },
    {
      icon: 'ri:checkbox-circle-line',
      label: 'Approved',
      count: 0,
      color: '#2F8F3A',
    },
    {
      icon: 'ri:close-circle-line',
      label: 'Rejected',
      count: 0,
      color: '#EF4444',
    },
    {
      icon: 'ri:bank-line',
      label: 'Deposited',
      count: 0,
      color: '#0D9488',
    },
  ];

  const deliveryLabels = [
    {
      icon: 'ri:inbox-archive-line',
      label: 'All Requests',
      count: 0,
      color: '#0F172A',
      bg: 'bg-[#F1F5F9]',
      fontWeight: 'font-semibold',
    },
    {
      icon: 'ri:time-line',
      label: 'Pending',
      count: 0,
      color: '#F59E0B',
    },
    {
      icon: 'ri:truck-line',
      label: 'In Transit',
      count: 0,
      color: '#0A3D8F',
    },
    {
      icon: 'ri:check-double-line',
      label: 'Delivered',
      count: 0,
      color: '#2F8F3A',
    },
    {
      icon: 'ri:close-circle-line',
      label: 'Failed',
      count: 0,
      color: '#EF4444',
    },
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

  /** Count for the main nav badge when that route is active — reflects current `?tab=` filter. */
  const getMainNavBadgeCount = (slug: string): number | null => {
    return 0; // Return 0 as we're moving away from mock data
  };

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
      case '#0D9488':
        return 'text-teal-600';
      default:
        return 'text-inherit';
    }
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-white border-r border-gray-200 transition-[width] duration-300 ease-out ${collapsed ? 'w-[72px]' : 'w-[min(100%,260px)] sm:w-[260px]'} flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 h-[64px]">
        {!collapsed && (
          <Image
            src="/images/A-4.png"
            alt="VScanMail"
            width={140}
            height={100}
            className="w-[140px] h-[100px] object-contain opacity-100 ml-[-4px]"
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
        {resolvedNavItems.map((item) => {
          const isActive = pathname === item.path;
          const badgeCount = isActive ? getMainNavBadgeCount(item.slug) : null;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center gap-0 transition cursor-pointer font-roboto py-3 pl-4 pr-3 sm:pl-[18px] sm:pr-3 min-h-[52px] ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#0A3D8F] font-medium rounded-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg'
              }`}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 bg-[#0A3D8F] rounded-r"
                  aria-hidden
                />
              )}
              <div className="flex items-center justify-center flex-shrink-0 w-[20.84px] h-[28px]">
                <Icon icon={item.icon} className="text-[20px]" />
              </div>
              {!collapsed && (
                <>
                  <span
                    className={`ml-2.5 text-[13px] sm:text-[14px] leading-snug flex-1 min-w-0 line-clamp-2 ${
                      isActive ? 'font-semibold' : 'font-normal'
                    }`}
                  >
                    {item.label}
                  </span>
                  {badgeCount !== null && (
                    <span className="ml-1.5 flex-shrink-0 min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center rounded-full bg-[#0A3D8F] text-white text-[11px] font-bold leading-none tabular-nums self-center">
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Labels Section */}
      {!collapsed && labels && (
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 min-h-0">
          <h3 className="text-[#94A3B8] font-semibold tracking-[0.6px] mb-2 px-3 text-[12px]">
            Labels
          </h3>
          <div className="flex flex-col gap-0.5">
            {labels.map((item, idx) => (
              <Link
                key={idx}
                href={
                  labelsPagePath
                    ? `${labelsPagePath}?tab=${encodeURIComponent(
                        getTabValueForLabel(labelsPagePath, item.label) ?? 'All'
                      )}`
                    : '#'
                }
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors min-h-[36px] ${
                  item.bg || 'hover:bg-gray-50'
                } ${tabFromUrl && getTabValueForLabel(labelsPagePath ?? '', item.label) === tabFromUrl ? 'bg-[#EFF6FF]' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon
                    icon={item.icon}
                    className={`text-[16px] flex-shrink-0 ${getLabelColorClass(item.color)}`}
                  />
                  <span
                    className={`text-[13px] leading-snug ${item.fontWeight || 'font-normal'} text-[#0F172A] min-w-0 line-clamp-2`}
                  >
                    {item.label}
                  </span>
                </div>
                <span
                  className={`text-xs flex-shrink-0 tabular-nums ${item.fontWeight || 'font-normal'} text-[#94A3B8]`}
                >
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="border-t border-gray-100 py-4">
        <Link
          href={settingsPath}
          className={`relative flex items-center transition cursor-pointer font-roboto py-3 pl-4 pr-3 sm:pl-[18px] sm:pr-3 min-h-[52px] ${
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
