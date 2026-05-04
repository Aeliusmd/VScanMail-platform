"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

interface ActivityEntry {
  no: number;
  rawAction: string;
  activity: string;
  category: string;
  user: string;
  date: string;
  time: string;
  ipAddress?: string;
  userAgent?: string;
  beforeState?: any;
  afterState?: any;
  entityType?: string;
}

interface ActionDisplay {
  icon: string;
  text: string;
  iconBg: string;
  iconColor: string;
}

function getActionDisplay(action: string): ActionDisplay {
  const map: Record<string, ActionDisplay> = {
    'auth.login':             { icon: 'ri-login-circle-line',       text: 'Signed in',               iconBg: 'bg-blue-100',    iconColor: 'text-[#0A3D8F]'    },
    'auth.login_failed':      { icon: 'ri-error-warning-line',      text: 'Login attempt failed',    iconBg: 'bg-red-100',     iconColor: 'text-red-500'      },
    'auth.email_verified':    { icon: 'ri-mail-check-line',         text: 'Email verified',          iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'auth.2fa_enabled':       { icon: 'ri-shield-check-line',       text: '2FA turned on',           iconBg: 'bg-blue-100',    iconColor: 'text-[#0A3D8F]'    },
    'auth.2fa_setup_started': { icon: 'ri-shield-line',             text: '2FA setup started',       iconBg: 'bg-blue-50',     iconColor: 'text-blue-400'     },
    'client.registered':      { icon: 'ri-user-add-line',           text: 'New client joined',       iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'client.created':         { icon: 'ri-user-line',               text: 'Client manually added',   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'client.updated':         { icon: 'ri-user-settings-line',      text: 'Client profile updated',  iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'client.deleted':         { icon: 'ri-user-unfollow-line',      text: 'Client account removed',  iconBg: 'bg-red-100',     iconColor: 'text-red-500'      },
    'admin.created':          { icon: 'ri-admin-line',              text: 'Admin account created',   iconBg: 'bg-violet-100',  iconColor: 'text-violet-600'   },
    'admin.updated':          { icon: 'ri-settings-3-line',         text: 'Admin account updated',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'admin.deleted':          { icon: 'ri-delete-bin-line',         text: 'Admin account removed',   iconBg: 'bg-red-100',     iconColor: 'text-red-500'      },
    'mail.created':           { icon: 'ri-mail-add-line',           text: 'Mail item scanned in',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'mail.updated':           { icon: 'ri-mail-edit-line',          text: 'Mail item updated',       iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'record.created':         { icon: 'ri-file-add-line',           text: 'Document scanned',        iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'record.updated':         { icon: 'ri-file-edit-line',          text: 'Document updated',        iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'    },
    'record.finalized':       { icon: 'ri-file-check-line',         text: 'Document finalized',      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'cheque.validated':       { icon: 'ri-bank-card-line',          text: 'Cheque AI scan done',     iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'     },
    'cheque.decided':         { icon: 'ri-checkbox-line',           text: 'Cheque decision made',    iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'     },
    'cheque.batch_deposited': { icon: 'ri-secure-payment-line',     text: 'Cheque batch deposited',  iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'     },
    'billing.manual_payment': { icon: 'ri-money-dollar-circle-line',text: 'Payment recorded',        iconBg: 'bg-orange-100',  iconColor: 'text-orange-600'   },
    'deposit.requested':      { icon: 'ri-inbox-archive-line',      text: 'Deposit requested',       iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'     },
    'deposit.cancelled':      { icon: 'ri-close-circle-line',       text: 'Deposit cancelled',       iconBg: 'bg-slate-100',   iconColor: 'text-slate-500'    },
    'deposit.approved':       { icon: 'ri-check-double-line',       text: 'Deposit approved',        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'deposit.rejected':       { icon: 'ri-thumb-down-line',         text: 'Deposit rejected',        iconBg: 'bg-red-100',     iconColor: 'text-red-500'      },
    'deposit.mark_deposited': { icon: 'ri-bank-line',               text: 'Marked as deposited',     iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'deposit.slip_uploaded':  { icon: 'ri-upload-cloud-line',       text: 'Deposit slip uploaded',   iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'     },
    'delivery.requested':     { icon: 'ri-truck-line',              text: 'Delivery requested',      iconBg: 'bg-violet-100',  iconColor: 'text-violet-600'   },
    'delivery.cancelled':     { icon: 'ri-close-circle-line',       text: 'Delivery cancelled',      iconBg: 'bg-slate-100',   iconColor: 'text-slate-500'    },
    'delivery.approved':      { icon: 'ri-thumb-up-line',           text: 'Delivery approved',       iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
    'delivery.rejected':      { icon: 'ri-thumb-down-line',         text: 'Delivery rejected',       iconBg: 'bg-red-100',     iconColor: 'text-red-500'      },
    'delivery.in_transit':    { icon: 'ri-navigation-line',         text: 'Out for delivery',        iconBg: 'bg-violet-100',  iconColor: 'text-violet-600'   },
    'delivery.delivered':     { icon: 'ri-checkbox-circle-fill',    text: 'Delivery completed',      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'  },
  };
  return map[action] ?? {
    icon: 'ri-history-line',
    text: action.replace(/[._]/g, ' '),
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
  };
}

function mapEntityType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('auth') || t.includes('user')) return 'Auth';
  if (t.includes('company') || t.includes('client')) return 'Client';
  if (t === 'record' || t.includes('scan') || t.includes('mail')) return 'Records';
  if (t === 'delivery' || t.includes('delivery')) return 'Delivery';
  if (t === 'deposit' || t.includes('deposit') || t.includes('cheque')) return 'Cheque';
  if (t.includes('admin') || t.includes('profile')) return 'System';
  if (t.includes('billing') || t.includes('subscription')) return 'Billing';
  return 'Other';
}

const categoryColors: Record<string, string> = {
  Auth:     'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  Client:   'bg-emerald-100 text-emerald-700',
  Records:  'bg-amber-100   text-amber-700',
  Delivery: 'bg-violet-100  text-violet-700',
  Cheque:   'bg-teal-100    text-teal-700',
  System:   'bg-red-100     text-red-600',
  Billing:  'bg-orange-100  text-orange-600',
};

const categoryBorderColors: Record<string, string> = {
  Auth:     'border-l-[#0A3D8F]',
  Client:   'border-l-emerald-400',
  Records:  'border-l-amber-400',
  Delivery: 'border-l-violet-400',
  Cheque:   'border-l-teal-400',
  System:   'border-l-red-400',
  Billing:  'border-l-orange-400',
  Other:    'border-l-slate-200',
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
        headers: { Authorization: `Bearer ${token}` },
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
          rawAction: l.action,
          activity: getActionDisplay(l.action).text,
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

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLogs.filter(log => {
      const matchSearch =
        q === '' ||
        log.activity.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.rawAction.toLowerCase().includes(q);
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
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D8F] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-slate-400 text-sm"></i>
          <select
            title="Filter by category"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <i className="ri-calendar-line text-slate-400 text-sm"></i>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
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
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-36">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500 font-medium">Loading activity records...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-400">
                    <i className="ri-file-search-line text-3xl block mb-2 opacity-50"></i>
                    No activity records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(log => {
                  const display = getActionDisplay(log.rawAction);
                  const borderClass = categoryBorderColors[log.category] ?? 'border-l-slate-200';
                  return (
                    <tr
                      key={log.no}
                      className={`group border-l-[3px] ${borderClass} hover:bg-slate-50/80 transition-colors`}
                    >
                      <td className="px-4 py-3.5 text-xs text-slate-300 font-mono font-medium">
                        {String(log.no).padStart(2, '0')}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="flex items-center gap-2.5 text-left w-full hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${display.iconBg}`}>
                            <i className={`${display.icon} text-sm ${display.iconColor}`}></i>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight text-sm group-hover:text-[#0A3D8F] transition-colors">
                              {display.text}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.rawAction}</p>
                          </div>
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${categoryColors[log.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {log.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <i className="ri-user-line text-[10px] text-slate-500"></i>
                          </div>
                          <span className="text-xs text-slate-700 font-medium truncate max-w-[100px]">{log.user}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-xs text-slate-600 font-medium">{log.date}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.time}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <LogDetailsPopup log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

function LogDetailsPopup({ log, onClose }: { log: ActivityEntry; onClose: () => void }) {
  const display = getActionDisplay(log.rawAction);

  const renderChanges = () => {
    if (!log.beforeState && !log.afterState)
      return <p className="text-slate-400 italic text-sm">No state changes recorded.</p>;

    const before = log.beforeState || {};
    const after = log.afterState || {};
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    const renderValue = (val: any) => {
      if (val === null) return <span className="italic opacity-60">null</span>;
      if (typeof val === 'object') {
        return (
          <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[10px] bg-white/50 p-2 rounded border border-current/20 overflow-x-auto max-h-48 overflow-y-auto w-full">
            {JSON.stringify(val, null, 2)}
          </pre>
        );
      }
      return String(val);
    };

    const changedKeys = allKeys.filter(k => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));

    if (changedKeys.length === 0)
      return <p className="text-slate-400 italic text-sm">No field-level changes detected.</p>;

    return (
      <div className="space-y-3">
        {changedKeys.map(key => (
          <div key={key} className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{key}</p>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1 bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg line-through opacity-70 text-xs break-words overflow-hidden">
                {renderValue(before[key] ?? null)}
              </div>
              <div className="flex items-center justify-center">
                <Icon icon="ri:arrow-right-line" className="text-slate-300 rotate-90 sm:rotate-0 text-base" />
              </div>
              <div className="flex-1 bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1.5 rounded-lg text-xs break-words overflow-hidden">
                {renderValue(after[key] ?? null)}
              </div>
            </div>
          </div>
        ))}
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
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Icon icon="ri:close-line" className="text-slate-500 text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
          {/* Action banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${display.iconBg}`}>
            <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className={`${display.icon} text-xl ${display.iconColor}`}></i>
            </div>
            <div>
              <p className={`text-base font-bold ${display.iconColor}`}>{display.text}</p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">{log.rawAction}</p>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'User',      value: log.user,                   icon: 'ri-user-line'    },
              { label: 'Category',  value: log.category,               icon: 'ri-tag-line'     },
              { label: 'IP Address',value: log.ipAddress || 'Unknown', icon: 'ri-global-line'  },
              { label: 'Date/Time', value: `${log.date} ${log.time}`,  icon: 'ri-time-line'    },
            ].map(item => (
              <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 mb-1">
                  <i className={`${item.icon} text-slate-400 text-[10px]`}></i>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1 mb-1">
                <i className="ri-computer-line text-slate-400 text-[10px]"></i>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Agent</p>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed break-all">{log.userAgent}</p>
            </div>
          )}

          {/* State changes */}
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
