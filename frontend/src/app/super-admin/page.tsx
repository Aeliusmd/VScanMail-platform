"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SuperAdminHeader from "../superadmin/components/SuperAdminHeader";
import { useSuperAdminOpenMobileNav } from "../superadmin/components/SuperAdminMobileNavContext";
import { apiClient } from "@/lib/api-client";

function formatUtcLongDate(d: Date): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()];
  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][d.getUTCMonth()];
  const day = String(d.getUTCDate());
  const year = String(d.getUTCFullYear());
  return `${weekday}, ${day} ${month} ${year}`;
}

type DashboardPayload = {
  stats: {
    totalOrganizations: number;
    organizationsThisMonth: number;
    activeAdmins: number;
    onlineAdmins: number;
    openDeposits: number;
    openDepositsToday: number;
    pendingDeliveries: number;
    pendingDeliveriesToday: number;
  };
  recentRequests: Array<{
    id: string;
    clientName: string;
    type: "Deposit" | "Delivery";
    amount: number | null;
    status: string;
    requestedAt: string | null;
  }>;
  admins: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    lastLoginAt: string | null;
    isOnline: boolean;
  }>;
  recentOrganizations: Array<{
    id: string;
    name: string;
    plan: string;
    joined: string | null;
    status: string;
    records: number | null;
  }>;
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function initialsFromName(nameOrEmail: string): string {
  const s = (nameOrEmail || "").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "AD";
}

export default function SuperAdminDashboardPage() {
  const openMobileNav = useSuperAdminOpenMobileNav();
  const [requestFilter, setRequestFilter] = useState<"All" | "Deposit" | "Delivery">("All");
  const todayLabel = formatUtcLongDate(new Date());
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await apiClient<DashboardPayload>("/api/superadmin/dashboard");
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const getRecentRequestPath = (type: string) =>
    type === "Delivery" ? "/superadmin/deliveries" : "/superadmin/deposits";
  const filteredRecentRequests = useMemo(() => {
    const list = data?.recentRequests ?? [];
    return requestFilter === "All" ? list : list.filter((r) => r.type === requestFilter);
  }, [data?.recentRequests, requestFilter]);

  const stats = useMemo(() => {
    const s = data?.stats;
    return [
      {
        label: "Total Organizations",
        value: s ? String(s.totalOrganizations) : "—",
        icon: "ri-building-4-line",
        change: s ? `+${s.organizationsThisMonth} this month` : "—",
        up: true,
      },
      {
        label: "Active Admins",
        value: s ? String(s.activeAdmins) : "—",
        icon: "ri-user-settings-line",
        change: s ? `${s.onlineAdmins} online now` : "—",
        up: true,
      },
      {
        label: "Open Deposit Requests",
        value: s ? String(s.openDeposits) : "—",
        icon: "ri-exchange-dollar-line",
        change: s ? `+${s.openDepositsToday} today` : "—",
        up: false,
      },
      {
        label: "Pending Deliveries",
        value: s ? String(s.pendingDeliveries) : "—",
        icon: "ri-truck-line",
        change: s ? `+${s.pendingDeliveriesToday} today` : "—",
        up: true,
      },
    ];
  }, [data?.stats]);

  const admins = useMemo(() => data?.admins ?? [], [data?.admins]);
  const recentCompanies = useMemo(() => data?.recentOrganizations ?? [], [data?.recentOrganizations]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D8F]" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="max-w-3xl">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        </div>
      );
    }
    return null;
  }, [error, loading]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50">
      <SuperAdminHeader
        title="Super Admin Dashboard"
        subtitle={
          <>
            <span className="hidden sm:inline">Full system overview — </span>
            <span suppressHydrationWarning>{todayLabel}</span>
          </>
        }
        onMobileNavOpen={openMobileNav}
        mobileNavBreakpoint="md"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-h-0">
          {content}
          {!content && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-[#0A3D8F]/30 transition-colors min-w-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <i className={`${stat.icon} text-slate-600 text-lg sm:text-xl`}></i>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 tabular-nums">{stat.value}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-2 leading-snug">{stat.label}</p>
                <p className={`text-xs font-medium flex items-center gap-1 ${stat.up ? "text-[#0A3D8F]" : "text-orange-600"}`}>
                  <i className={stat.up ? "ri-arrow-up-line" : "ri-arrow-right-line"}></i>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-6 sm:mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 min-w-0">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Requests</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Deposit & delivery activity</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRequestFilter("Deposit")}
                    className={`text-xs font-medium whitespace-nowrap border px-3 py-1.5 rounded-lg transition-colors ${
                      requestFilter === "Deposit"
                        ? "text-[#0A3D8F] border-[#0A3D8F]/40 bg-[#0A3D8F]/5"
                        : "text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Deposits
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter("Delivery")}
                    className={`text-xs font-medium whitespace-nowrap border px-3 py-1.5 rounded-lg transition-colors ${
                      requestFilter === "Delivery"
                        ? "text-[#0A3D8F] border-[#0A3D8F]/40 bg-[#0A3D8F]/5"
                        : "text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Deliveries
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter("All")}
                    className={`text-xs font-medium whitespace-nowrap border px-3 py-1.5 rounded-lg transition-colors ${
                      requestFilter === "All"
                        ? "text-[#0A3D8F] border-[#0A3D8F]/40 bg-[#0A3D8F]/5"
                        : "text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredRecentRequests.map((req, i) => (
                  <Link
                    key={`${req.type}-${req.id}-${i}`}
                    href={getRecentRequestPath(req.type)}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          req.type === "Deposit" ? "bg-orange-100" : "bg-sky-100"
                        }`}
                      >
                        <i
                          className={`${req.type === "Deposit" ? "ri-exchange-dollar-line" : "ri-truck-line"} text-lg ${
                            req.type === "Deposit" ? "text-orange-600" : "text-sky-600"
                          }`}
                        ></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 break-words">{req.clientName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {req.type}
                          {req.amount != null ? ` · AED ${Number(req.amount || 0).toLocaleString()}` : ""} ·{" "}
                          {formatRelativeTime(req.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto shrink-0 ${
                        req.status === "Open" || req.status === "Slip Uploaded"
                          ? "bg-orange-100 text-orange-700"
                          : req.status === "On the Way" || req.status === "In Transit"
                            ? "bg-sky-100 text-sky-700"
                            : req.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-[#0A3D8F]"
                      }`}
                    >
                      {req.status}
                    </span>
                  </Link>
                ))}
                {filteredRecentRequests.length === 0 && (
                  <div className="px-4 sm:px-6 py-10 text-center text-sm text-slate-400">
                    No requests for this filter.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-3 sm:mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/superadmin/companies"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all text-sm text-left min-h-[44px]"
                  >
                    <i className="ri-building-4-line text-lg"></i>
                    Manage Organizations
                  </Link>
                  <Link
                    href="/superadmin/deposits"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-all text-sm text-left min-h-[44px]"
                  >
                    <i className="ri-exchange-dollar-line text-lg"></i>
                    Deposit Requests
                  </Link>
                  <Link
                    href="/superadmin/deliveries"
                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm text-left min-h-[44px]"
                  >
                    <i className="ri-truck-line text-lg shrink-0"></i>
                    Delivery Requests
                  </Link>
                  <Link
                    href="/superadmin/settings/profile"
                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm text-left min-h-[44px]"
                  >
                    <i className="ri-settings-3-line text-lg"></i>
                    Settings
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-3 sm:mb-4">System Health</h2>
                <div className="space-y-3">
                  {[
                    { label: "Scanner Service", status: "Online" },
                    { label: "AI Processing", status: "Active" },
                    { label: "Email Service", status: "Running" },
                    { label: "Database", status: "Healthy" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{s.label}</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#0A3D8F]">
                        <span className="w-1.5 h-1.5 bg-[#0A3D8F] rounded-full"></span>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl border border-slate-200 min-w-0">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Admin Team</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor admin activity</p>
                </div>
                <Link
                  href="/superadmin/settings/manage-admins"
                  className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap border border-[#0A3D8F]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A3D8F]/5 transition-colors self-start sm:self-auto shrink-0"
                >
                  Manage Admins
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {admins.map((admin, i) => (
                  <div
                    key={admin.id ?? i}
                    className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {initialsFromName(admin.name || admin.email)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            admin.isOnline ? "bg-[#0A3D8F]" : "bg-slate-400"
                          }`}
                        ></span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{admin.name}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(admin.lastLoginAt)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{admin.isOnline ? "Online" : "Offline"}</p>
                      <p className="text-xs text-slate-400">status</p>
                    </div>
                  </div>
                ))}
                {admins.length === 0 && (
                  <div className="px-4 sm:px-6 py-10 text-center text-sm text-slate-400">No admins found.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 min-w-0">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Organizations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Newly registered or updated</p>
                </div>
                <Link
                  href="/superadmin/companies"
                  className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap border border-[#0A3D8F]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A3D8F]/5 transition-colors self-start sm:self-auto shrink-0"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentCompanies.map((company, i) => (
                  <div
                    key={company.id ?? i}
                    className="flex flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                        <i className="ri-building-4-line text-slate-600 text-lg"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 break-words">{company.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {company.plan} · Joined {company.joined ? new Date(company.joined).toISOString().slice(0, 10) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 sm:pl-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          company.status === "active" ? "bg-blue-100 text-[#0A3D8F]" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {company.status === "active" ? "Active" : company.status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {company.records == null ? "—" : company.records} records
                      </p>
                    </div>
                  </div>
                ))}
                {recentCompanies.length === 0 && (
                  <div className="px-4 sm:px-6 py-10 text-center text-sm text-slate-400">No organizations found.</div>
                )}
              </div>
            </div>
          </div>
          </>
          )}
      </main>
    </div>
  );
}
