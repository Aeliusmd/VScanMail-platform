"use client";

import { useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 transition-all duration-300 flex flex-col flex-shrink-0`}
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

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                item.active ? "bg-[#0A3D8F] text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              <i className={`${item.icon} text-lg flex-shrink-0`}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/60 space-y-1">
          <Link
            href="/superadmin/settings/profile"
            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-700/60 hover:text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <i className="ri-settings-3-line text-lg flex-shrink-0"></i>
            {sidebarOpen && <span>Settings</span>}
          </Link>
          <Link
            href="/super-admin-login"
            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-red-900/40 hover:text-red-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <i className="ri-logout-box-line text-lg flex-shrink-0"></i>
            {sidebarOpen && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2 min-h-[64px] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="pl-11 md:pl-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Full system overview -{" "}
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative text-slate-600"
              aria-label="Notifications"
            >
              <i className="ri-notification-3-line text-[20px] leading-none"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <Link href="/superadmin/settings/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition">
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xs">
                JM
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-4">James Mitchell</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#0A3D8F]/30 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <i className={`${stat.icon} text-slate-600 text-xl`}></i>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-xs text-slate-500 mb-2 leading-tight">{stat.label}</p>
                <p className={`text-xs font-medium flex items-center gap-1 ${stat.up ? "text-[#0A3D8F]" : "text-orange-600"}`}>
                  <i className={stat.up ? "ri-arrow-up-line" : "ri-arrow-right-line"}></i>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Recent Requests</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Deposit & delivery activity</p>
                </div>
                <div className="flex gap-2">
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
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
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
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{req.company}</p>
                        <p className="text-xs text-slate-400">
                          {req.type}
                          {req.amount ? ` · ${req.amount}` : ""} · {req.time}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
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
                  <div className="px-6 py-10 text-center text-sm text-slate-400">No requests for this filter.</div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 text-base mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/superadmin/companies"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all text-sm whitespace-nowrap"
                  >
                    <i className="ri-building-4-line text-lg"></i>
                    Manage Companies
                  </Link>
                  <Link
                    href="/superadmin/deposits"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-all text-sm whitespace-nowrap"
                  >
                    <i className="ri-exchange-dollar-line text-lg"></i>
                    Deposit Requests
                  </Link>
                  <Link
                    href="/superadmin/deliveries"
                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm whitespace-nowrap"
                  >
                    <i className="ri-truck-line text-lg"></i>
                    Delivery Requests
                  </Link>
                  <Link
                    href="/superadmin/settings/profile"
                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm whitespace-nowrap"
                  >
                    <i className="ri-settings-3-line text-lg"></i>
                    Settings
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 text-base mb-4">System Health</h2>
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

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Admin Team</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor admin activity</p>
                </div>
                <Link
                  href="/superadmin/settings/manage-admins"
                  className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap border border-[#0A3D8F]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A3D8F]/5 transition-colors"
                >
                  Manage Admins
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {admins.map((admin, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {admin.avatar}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            admin.status === "Active" ? "bg-[#0A3D8F]" : "bg-slate-400"
                          }`}
                        ></span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{admin.name}</p>
                        <p className="text-xs text-slate-400">{admin.lastActive}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{admin.scansToday}</p>
                      <p className="text-xs text-slate-400">scans today</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Recent Companies</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Newly registered or updated</p>
                </div>
                <Link
                  href="/superadmin/companies"
                  className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap border border-[#0A3D8F]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A3D8F]/5 transition-colors"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentCompanies.map((company, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                        <i className="ri-building-4-line text-slate-600 text-lg"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{company.name}</p>
                        <p className="text-xs text-slate-400">
                          {company.plan} · Joined {company.joined}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
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
