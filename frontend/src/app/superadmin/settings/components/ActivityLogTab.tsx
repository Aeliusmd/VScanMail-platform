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
  // Metadata for details popup
  ipAddress?: string;
  userAgent?: string;
  beforeState?: any;
  afterState?: any;
  entityType?: string;
}


function mapEntityType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('auth') || t.includes('user')) return 'Auth';
  if (t.includes('company') || t.includes('client')) return 'Client';
  if (t === 'record' || t.includes('scan') || t.includes('mail')) return 'Records';
  if (t === 'delivery') return 'Delivery';
  if (t === 'deposit') return 'Cheque';
  if (t.includes('delivery')) return 'Delivery';
  if (t.includes('deposit') || t.includes('cheque')) return 'Cheque';
  if (t.includes('admin') || t.includes('profile')) return 'System';
  if (t.includes('billing') || t.includes('subscription')) return 'Billing';
  return 'Other';
}

function mapActionToLabel(action: string): string {
  const mapping: Record<string, string> = {
    'auth.login': 'Logged In',
    'auth.login_failed': 'Login Failed',
    'auth.email_verified': 'Email Verified',
    'auth.2fa_enabled': '2FA Enabled',
    'auth.2fa_setup_started': '2FA Setup Started',
    'client.registered': 'New Client Registered',
    'client.created': 'Client Created (Manual)',
    'client.updated': 'Client Profile Updated',
    'client.deleted': 'Client Account Deleted',
    'admin.created': 'Admin Created',
    'admin.updated': 'Admin Updated',
    'admin.deleted': 'Admin Deleted',
    'mail.created': 'Mail Item Ingested',
    'mail.updated': 'Mail Item Updated',
    'record.created': 'Mail Item Ingested',
    'record.updated': 'Mail Item Updated',
    'cheque.validated': 'Cheque AI Validation',
    'cheque.decided': 'Cheque Decision Made',
    'cheque.batch_deposited': 'Cheque Batch Deposited',
    'billing.manual_payment': 'Manual Payment Recorded',
    'deposit.requested': 'Deposit Requested',
    'deposit.cancelled': 'Deposit Cancelled',
    'deposit.approved': 'Deposit Approved',
    'deposit.rejected': 'Deposit Rejected',
    'deposit.mark_deposited': 'Cheque Marked Deposited',
    'deposit.slip_uploaded': 'Deposit Slip Uploaded',
    'delivery.requested': 'Delivery Requested',
    'delivery.cancelled': 'Delivery Cancelled',
    'delivery.approved': 'Delivery Approved',
    'delivery.rejected': 'Delivery Rejected',
    'delivery.in_transit': 'Delivery In Transit',
    'delivery.delivered': 'Delivery Completed',
    'record.created': 'Document Scanned',
    'record.finalized': 'Document Finalized',
  };
  return mapping[action] || action;
}


const categoryColors: Record<string, string> = {
  Auth: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  Client: 'bg-emerald-100 text-emerald-700',
  Records: 'bg-amber-100 text-amber-700',
  Delivery: 'bg-violet-100 text-violet-700',
  Cheque: 'bg-teal-100 text-teal-700',
  System: 'bg-red-100 text-red-600',
  Billing: 'bg-orange-100 text-orange-600',
};

const categories = ['All', 'Auth', 'Client', 'Records', 'Delivery', 'Cheque', 'System', 'Billing'];

export default function ActivityLogTab() {
  const [allLogs, setAllLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityEntry | null>(null);


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
        const actorDisplayName = 
          l.actorRole === 'client' 
            ? (l.companyName || l.actorName || l.actorId.slice(0, 8)) 
            : (l.actorName || l.actorId.slice(0, 8));

        return {
          no: i + 1,
          activity: mapActionToLabel(l.action),
          category: mapEntityType(l.entityType),
          user: actorDisplayName,
          date: dt.toISOString().split('T')[0],
          time: dt.toTimeString().split(' ')[0],
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          beforeState: l.beforeState,
          afterState: l.afterState,
          entityType: l.entityType,
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
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-36">User</th>
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
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-slate-800 font-medium hover:text-[#0A3D8F] hover:underline cursor-pointer text-left transition-colors"
                      >
                        {log.activity}
                      </button>
                    </td>

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
      
      {/* Details Popup */}
      {selectedLog && (
        <LogDetailsPopup 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}

function LogDetailsPopup({ log, onClose }: { log: ActivityEntry; onClose: () => void }) {
  // Simple JSON comparison logic
  const renderChanges = () => {
    if (!log.beforeState && !log.afterState) return <p className="text-slate-400 italic">No state changes recorded.</p>;

    const before = log.beforeState || {};
    const after = log.afterState || {};
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    return (
      <div className="space-y-3">
        {allKeys.map(key => {
          const bValObj = before[key] === undefined ? null : before[key];
          const aValObj = after[key] === undefined ? null : after[key];
          
          if (JSON.stringify(bValObj) === JSON.stringify(aValObj)) return null;

          const renderValue = (val: any) => {
            if (val === null) return "null";
            if (typeof val === 'object') {
              return (
                <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[10px] bg-white/50 p-2 rounded border border-current/20 overflow-x-auto max-h-48 overflow-y-auto w-full no-scrollbar">
                  {JSON.stringify(val, null, 2)}
                </pre>
              );
            }
            return String(val);
          };

          return (
            <div key={key} className="border-b border-slate-100 pb-3 mt-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">{key}</p>
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex-1 bg-red-50/50 text-red-600 px-2 py-1.5 rounded line-through opacity-70 text-xs w-full overflow-hidden break-words">
                  {renderValue(bValObj)}
                </div>
                <div className="flex items-center justify-center py-2 sm:py-0">
                  <Icon icon="ri:arrow-right-line" className="text-slate-300 transform sm:rotate-0 rotate-90" />
                </div>
                <div className="flex-1 bg-emerald-50/50 text-emerald-700 font-medium px-2 py-1.5 rounded text-xs w-full overflow-hidden break-words">
                  {renderValue(aValObj)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
              <Icon icon="ri:history-line" className="text-[#0A3D8F] text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Activity Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Full audit trail for this action</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Icon icon="ri:close-line" className="text-slate-500 text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Main Action */}
          <div className="bg-[#0A3D8F] text-white p-4 rounded-xl shadow-lg shadow-[#0A3D8F]/10">
            <p className="text-xs opacity-70 font-semibold uppercase tracking-wider mb-1">Action Performed</p>
            <p className="text-lg font-bold">{log.activity}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">User</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{log.user}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Category</p>
              <p className="text-xs font-semibold text-slate-800">{log.category}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">IP Address</p>
              <p className="text-xs font-semibold text-slate-800 font-mono tracking-tighter">
                {log.ipAddress || 'Unknown'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Date/Time</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{log.date} {log.time}</p>
            </div>
          </div>

          {/* User Agent */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">User Agent</p>
            <p className="text-xs text-slate-600 italic leading-relaxed break-all">
              {log.userAgent || 'No device information available.'}
            </p>
          </div>

          {/* State Changes */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Icon icon="ri:code-line" className="text-[#0A3D8F]" />
              Data Changes
            </h4>
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              {renderChanges()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer active:scale-95 duration-150"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
