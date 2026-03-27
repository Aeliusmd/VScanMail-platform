"use client";

import { useEffect, useState } from "react";
import StatCard from "./components/statCard";
import RecentActivity from "./components/RecentActivity";
import QuickActions from "./components/QuickActions";
import styles from './page.module.css';
import { dashboardApi, type DashboardStatsResponse } from "@/lib/api/dashboard";

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStatsResponse>({
    total: 0,
    byType: {},
    byStatus: {},
    totalMails: 0,
    totalCheques: 0,
    activeCompanies: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setStats(res))
      .catch(() => {
        // Keep dashboard usable even if the endpoint is temporarily unavailable.
      });
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className={`flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 min-h-full ${styles.homeContainer}`}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Mails"
          value={fmt(stats.totalMails)}
          subtitle="+12% from last month"
          iconifyId="ri:mail-line"
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Total Cheques"
          value={fmt(stats.totalCheques)}
          subtitle="+8% from last month"
          iconifyId="iconamoon:cheque"
          iconBg="bg-green-100"
          iconColor="text-green-500"
        />
        <StatCard
          title="Active Companies"
          value={fmt(stats.activeCompanies)}
          subtitle="+5 new this month"
          iconifyId="mdi:company"
          iconBg="bg-[#DBEAFE]"
          iconColor="text-[#1E40AF]"
        />
        <StatCard
          title="Pending Requests"
          value={fmt(stats.pendingRequests)}
          subtitle="Requires attention"
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
