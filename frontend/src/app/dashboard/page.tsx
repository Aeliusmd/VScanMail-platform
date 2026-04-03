"use client";

import StatCard from './components/statCard';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import styles from './page.module.css';

export default function DashboardOverview() {
  return (
    <div className={`flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 min-h-full ${styles.homeContainer}`}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Mails"
          value="0"
          subtitle="No mails yet"
          iconifyId="ri:mail-line"
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Total Cheques"
          value="0"
          subtitle="No cheques yet"
          iconifyId="iconamoon:cheque"
          iconBg="bg-green-100"
          iconColor="text-green-500"
        />
        <StatCard
          title="Active Companies"
          value="0"
          subtitle="No companies yet"
          iconifyId="mdi:company"
          iconBg="bg-[#DBEAFE]"
          iconColor="text-[#1E40AF]"
        />
        <StatCard
          title="Pending Requests"
          value="0"
          subtitle="No pending requests"
          iconifyId="ri:time-line"
          iconBg="bg-red-100"
          iconColor="text-red-400"
        />
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 flex-1">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
}
