"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";


interface ActivityEntry {
  no: number;
  activity: string;
  category: string;
  user: string;
  date: string;
  time: string;
}

function mapEntityType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('auth') || t.includes('user')) return 'Auth';
  if (t.includes('company') || t.includes('client')) return 'Company';
  if (t.includes('scan') || t.includes('mail')) return 'Scan';
  if (t.includes('delivery')) return 'Delivery';
  if (t.includes('deposit') || t.includes('cheque')) return 'Deposit';
  if (t.includes('admin') || t.includes('profile')) return 'Admin';
  if (t.includes('billing') || t.includes('subscription')) return 'Billing';
  return 'Other';
}


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
  const [allLogs, setAllLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("vscanmail_token");
      const res = await fetch("/api/audit-logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      
      const mapped: ActivityEntry[] = data.logs.map((l: any, i: number) => {
        const dt = new Date(l.createdAt);
        return {
          no: i + 1,
          activity: l.action,
          category: mapEntityType(l.entityType),
          user: l.actorEmail || l.actorId.slice(0, 8),
          date: dt.toISOString().split('T')[0],
          time: dt.toTimeString().split(' ')[0],
        };
      });
      setAllLogs(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    return allLogs.filter(log => {
      const matchSearch = search === '' || log.activity.toLowerCase().includes(search.toLowerCase()) || log.user.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || log.category === categoryFilter;
      const matchDate = dateFilter === '' || log.date === dateFilter;
      return matchSearch && matchCategory && matchDate;
    });
  }, [allLogs, search, categoryFilter, dateFilter]);


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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500 font-medium">Loading activity records...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
