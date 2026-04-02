"use client";

import { useMemo, useState } from "react";

interface ActivityEntry {
  no: number;
  activity: string;
  category: string;
  user: string;
  date: string;
  time: string;
}

const allLogs: ActivityEntry[] = [
  { no: 1, activity: 'Admin login successful', category: 'Auth', user: 'James Mitchell', date: '2026-03-27', time: '09:14:22' },
  { no: 2, activity: 'New company "Apex Logistics" added', category: 'Company', user: 'James Mitchell', date: '2026-03-27', time: '09:21:05' },
  { no: 3, activity: 'Mail scan completed — ref #SC-2847', category: 'Scan', user: 'Sarah Thompson', date: '2026-03-27', time: '09:35:48' },
  { no: 4, activity: 'Cheque scan completed — ref #CH-1129', category: 'Scan', user: 'Sarah Thompson', date: '2026-03-27', time: '09:42:17' },
  { no: 5, activity: 'Delivery request approved for Apex Logistics', category: 'Delivery', user: 'Robert Chen', date: '2026-03-27', time: '10:08:33' },
  { no: 6, activity: 'New admin "Emily Walsh" added', category: 'Admin', user: 'James Mitchell', date: '2026-03-26', time: '14:55:01' },
  { no: 7, activity: 'Deposit request processed — $4,200.00', category: 'Deposit', user: 'Maria Garcia', date: '2026-03-26', time: '15:20:44' },
  { no: 8, activity: 'Mail scan completed — ref #SC-2846', category: 'Scan', user: 'Robert Chen', date: '2026-03-26', time: '11:05:29' },
  { no: 9, activity: 'Company "BrightPath Inc." updated', category: 'Company', user: 'James Mitchell', date: '2026-03-26', time: '10:48:15' },
  { no: 10, activity: 'Subscription plan updated to Business Pro', category: 'Billing', user: 'James Mitchell', date: '2026-03-25', time: '16:30:00' },
  { no: 11, activity: 'Admin "David Patel" set to Inactive', category: 'Admin', user: 'James Mitchell', date: '2026-03-25', time: '09:55:12' },
  { no: 12, activity: 'Cheque deposit confirmed — Westfield Corp', category: 'Deposit', user: 'Maria Garcia', date: '2026-03-25', time: '11:22:40' },
  { no: 13, activity: 'Mail scan completed — ref #SC-2845', category: 'Scan', user: 'Emily Walsh', date: '2026-03-24', time: '13:44:07' },
  { no: 14, activity: 'Delivery request submitted — Metro Finance', category: 'Delivery', user: 'Sarah Thompson', date: '2026-03-24', time: '15:07:55' },
  { no: 15, activity: 'Profile information updated', category: 'Auth', user: 'James Mitchell', date: '2026-03-24', time: '08:30:11' },
  { no: 16, activity: 'New company "Summit Holdings" added', category: 'Company', user: 'Robert Chen', date: '2026-03-23', time: '10:15:22' },
  { no: 17, activity: 'Cheque scan completed — ref #CH-1128', category: 'Scan', user: 'Emily Walsh', date: '2026-03-23', time: '14:02:38' },
  { no: 18, activity: 'Deposit request declined — insufficient info', category: 'Deposit', user: 'Maria Garcia', date: '2026-03-22', time: '11:50:03' },
  { no: 19, activity: 'Manual billing plan renewed — Apex Logistics', category: 'Billing', user: 'James Mitchell', date: '2026-03-22', time: '09:00:00' },
  { no: 20, activity: 'Admin login successful', category: 'Auth', user: 'Sarah Thompson', date: '2026-03-21', time: '08:10:45' },
];

const categoryColors: Record<string, string> = {
  Auth: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  Company: 'bg-emerald-100 text-emerald-700',
  Scan: 'bg-amber-100 text-amber-700',
  Delivery: 'bg-violet-100 text-violet-700',
  Deposit: 'bg-teal-100 text-teal-700',
  Admin: 'bg-red-100 text-red-600',
  Billing: 'bg-orange-100 text-orange-600',
};

const categories = ['All', 'Auth', 'Company', 'Scan', 'Delivery', 'Deposit', 'Admin', 'Billing'];

export default function ActivityLogTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    return allLogs.filter(log => {
      const matchSearch = search === '' || log.activity.toLowerCase().includes(search.toLowerCase()) || log.user.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || log.category === categoryFilter;
      const matchDate = dateFilter === '' || log.date === dateFilter;
      return matchSearch && matchCategory && matchDate;
    });
  }, [search, categoryFilter, dateFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
        <p className="text-sm text-slate-500 mt-0.5">Track all system activities and admin actions.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48 relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activity or user..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
          />
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-filter-3-line text-slate-400 text-sm"></i>
          <select
            title="Filter by category"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
          >
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <i className="ri-calendar-line text-slate-400 text-sm"></i>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
          />
        </div>
        {(search || categoryFilter !== 'All' || dateFilter) && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); setDateFilter(''); }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-close-line mr-1"></i>Clear
          </button>
        )}
        <div className="ml-auto text-xs text-slate-400 font-medium">
          {filtered.length} records
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-14">No.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-36">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-24">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    <i className="ri-file-search-line text-2xl block mb-2"></i>
                    No activity records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => (
                  <tr key={log.no} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3 text-slate-400 font-medium text-xs">{String(log.no).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{log.activity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[log.category] || 'bg-slate-100 text-slate-600'}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{log.user}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{log.date}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
