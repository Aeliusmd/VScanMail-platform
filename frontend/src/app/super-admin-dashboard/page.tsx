"use client";

import React, { useState } from "react";
import Link from "next/link";
import SuperAdminHeader from "../superadmin/components/SuperAdminHeader";

const admins = [
  {
    name: "Sarah Mitchell",
    email: "sarah@vscanmail.com",
    role: "Admin",
    status: "Active",
    scansToday: 47,
    lastActive: "2 mins ago",
    avatar: "SM",
  },
  {
    name: "James Okonkwo",
    email: "james@vscanmail.com",
    role: "Admin",
    status: "Active",
    scansToday: 38,
    lastActive: "15 mins ago",
    avatar: "JO",
  },
  {
    name: "Lin Wei",
    email: "lin@vscanmail.com",
    role: "Admin",
    status: "Active",
    scansToday: 29,
    lastActive: "1 hour ago",
    avatar: "LW",
  },
  {
    name: "Priya Nair",
    email: "priya@vscanmail.com",
    role: "Admin",
    status: "Offline",
    scansToday: 0,
    lastActive: "3 hours ago",
    avatar: "PN",
  },
];

const recentCompanies = [
  { name: "TechNova Solutions", plan: "Enterprise", joined: "2026/03/28", mails: 342, status: "Active" },
  { name: "Gulf Bridge Trading", plan: "Business", joined: "2026/03/25", mails: 128, status: "Active" },
  { name: "Horizon Logistics", plan: "Starter", joined: "2026/03/20", mails: 56, status: "Active" },
  { name: "Atlas Finance Group", plan: "Enterprise", joined: "2026/03/15", mails: 519, status: "Suspended" },
];

const recentRequests = [
  {
    company: "TechNova Solutions",
    type: "Deposit",
    amount: "AED 12,500",
    status: "Open",
    time: "8 mins ago",
    icon: "ri-exchange-dollar-line",
    color: "orange",
  },
  {
    company: "Gulf Bridge Trading",
    type: "Delivery",
    status: "On the Way",
    time: "22 mins ago",
    icon: "ri-truck-line",
    color: "sky",
  },
  {
    company: "Horizon Logistics",
    type: "Deposit",
    amount: "AED 4,200",
    status: "Deposited",
    time: "1 hr ago",
    icon: "ri-exchange-dollar-line",
    color: "green",
  },
  {
    company: "Summit LLC",
    type: "Delivery",
    status: "Confirmed",
    time: "2 hrs ago",
    icon: "ri-truck-line",
    color: "green",
  },
  {
    company: "Atlas Finance Group",
    type: "Deposit",
    amount: "AED 31,000",
    status: "Processing",
    time: "3 hrs ago",
    icon: "ri-exchange-dollar-line",
    color: "sky",
  },
];

const navItems = [
  { label: "Dashboard", icon: "ri-dashboard-3-line", path: "/superadmin/dashboard", active: true },
  { label: "Companies", icon: "ri-building-4-line", path: "/superadmin/companies", active: false },
  { label: "Deposit Requests", icon: "ri-exchange-dollar-line", path: "/superadmin/deposits", active: false },
  { label: "Delivery Requests", icon: "ri-truck-line", path: "/superadmin/deliveries", active: false },
];

export default function SuperAdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState<"All" | "Deposit" | "Delivery">("All");

  const getRecentRequestPath = (type: string) =>
    type === "Delivery" ? "/superadmin/deliveries" : "/superadmin/deposits";
  const filteredRecentRequests =
    requestFilter === "All" ? recentRequests : recentRequests.filter((req) => req.type === requestFilter);

  const stats = [
    { label: "Total Companies", value: "156", icon: "ri-building-4-line", change: "+8 this month", up: true },
    { label: "Active Admins", value: "4", icon: "ri-user-settings-line", change: "3 online now", up: true },
    {
      label: "Open Deposit Requests",
      value: "23",
      icon: "ri-exchange-dollar-line",
      change: "+5 today",
      up: false,
    },
    { label: "Pending Deliveries", value: "11", icon: "ri-truck-line", change: "3 on the way", up: true },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex relative">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col flex-shrink-0 bg-slate-900 shadow-xl lg:shadow-none transition-all duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="p-5 border-b border-slate-700/60">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0A3D8F] rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-star-line text-white text-base"></i>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">VScan Mail</p>
                  <p className="text-blue-400 text-xs font-medium mt-0.5">Super Admin</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-8 h-8 bg-[#0A3D8F] rounded-lg flex items-center justify-center mx-auto">
                <i className="ri-shield-star-line text-white text-base"></i>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-menu-fold-line text-slate-400 text-lg"></i>
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="mt-4 w-full flex justify-center p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-menu-unfold-line text-slate-400 text-lg"></i>
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                item.active ? "bg-[#0A3D8F] text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              <i className={`${item.icon} text-lg flex-shrink-0`}></i>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/60 space-y-1 shrink-0">
          <Link
            href="/superadmin/settings/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-700/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <i className="ri-settings-3-line text-lg flex-shrink-0"></i>
            {sidebarOpen && <span className="truncate">Settings</span>}
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-red-900/40 hover:text-red-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <i className="ri-logout-box-line text-lg flex-shrink-0"></i>
            {sidebarOpen && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:min-h-0">
        <SuperAdminHeader
          title="Super Admin Dashboard"
          subtitle={
            <>
              <span className="hidden sm:inline">Full system overview — </span>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </>
          }
          onMobileNavOpen={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
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
                    key={i}
                    href={getRecentRequestPath(req.type)}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          req.color === "orange" ? "bg-orange-100" : req.color === "sky" ? "bg-sky-100" : "bg-blue-100"
                        }`}
                      >
                        <i
                          className={`${req.icon} text-lg ${
                            req.color === "orange" ? "text-orange-600" : req.color === "sky" ? "text-sky-600" : "text-[#0A3D8F]"
                          }`}
                        ></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 break-words">{req.company}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {req.type}
                          {req.amount ? ` · ${req.amount}` : ""} · {req.time}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto shrink-0 ${
                        req.status === "Open"
                          ? "bg-orange-100 text-orange-700"
                          : req.status === "Processing"
                            ? "bg-sky-100 text-sky-700"
                            : req.status === "On the Way"
                              ? "bg-sky-100 text-sky-700"
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
                    Manage Companies
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
                    key={i}
                    className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {admin.avatar}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            admin.status === "Active" ? "bg-[#0A3D8F]" : "bg-slate-400"
                          }`}
                        ></span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{admin.name}</p>
                        <p className="text-xs text-slate-400">{admin.lastActive}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{admin.scansToday}</p>
                      <p className="text-xs text-slate-400">scans today</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 min-w-0">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Companies</h2>
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
                    key={i}
                    className="flex flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                        <i className="ri-building-4-line text-slate-600 text-lg"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 break-words">{company.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {company.plan} · Joined {company.joined}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 sm:pl-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          company.status === "Active" ? "bg-blue-100 text-[#0A3D8F]" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {company.status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{company.mails} mails</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
