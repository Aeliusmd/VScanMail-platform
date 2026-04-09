"use client";

import { useEffect, useState } from 'react';
import StatCard from './components/statCard';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import styles from './page.module.css';
import { apiClient } from '@/lib/api-client';

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiClient('/api/reports/dashboard');
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-full ${styles.homeContainer}`}>
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-full ${styles.homeContainer}`}>
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl shadow-sm border border-red-100 flex items-center gap-3">
          <span className="font-bold">Error:</span> {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 min-h-full ${styles.homeContainer}`}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Mails"
          value={data?.totalMails?.toLocaleString() || "0"}
          subtitle="All organizations"
          iconifyId="ri:mail-line"
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Total Cheques"
          value={data?.totalCheques?.toLocaleString() || "0"}
          subtitle="All organizations"
          iconifyId="iconamoon:cheque"
          iconBg="bg-green-100"
          iconColor="text-green-500"
        />
        <StatCard
          title="Active Companies"
          value={data?.activeCompanies?.toLocaleString() || "0"}
          subtitle="Platform total"
          iconifyId="mdi:company"
          iconBg="bg-[#DBEAFE]"
          iconColor="text-[#1E40AF]"
        />
        <StatCard
          title="Pending Requests"
          value={data?.pendingRequests?.toLocaleString() || "0"}
          subtitle="Requires attention"
          iconifyId="ri:time-line"
          iconBg="bg-red-100"
          iconColor="text-red-400"
        />
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 flex-1">
        <RecentActivity activities={data?.recentActivity || []} />
        <QuickActions />
      </div>
    </div>
  );
}
