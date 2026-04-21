"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { mailApi } from "@/lib/api/mail";
import { chequeApi } from "@/lib/api/cheques";
import { useOrgContext } from "../../components/OrgContext";

type CustomerDashboardResponse = {
  totalMails: number;
  totalCheques: number;
  pendingRequests: number;
  recentActivity: Array<{
    id: string;
    clientId: string;
    company: string;
    type: "Cheque" | "Mail";
    time: string;
    status: string;
    statusColor: string;
    icon: string;
  }>;
};

function timeAgoFromIso(iso: string | null | undefined) {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  const diffInSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const seconds = Math.abs(diffInSeconds);
  if (seconds < 45) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function CustomerDashboard() {
  const org = useOrgContext();
  const baseHref = org.clientId ? `/customer/${org.clientId}` : "/customer";
  const [dashboard, setDashboard] = useState<CustomerDashboardResponse | null>(null);
  const [recentMails, setRecentMails] = useState<
    Array<{
      id: string;
      subject: string;
      sender: string;
      date: string;
      status: "unread" | "read";
      category: string;
      thumbnail: string | null;
    }>
  >([]);
  const [pendingCheques, setPendingCheques] = useState<Array<{ id: string; amount: number; from: string; date: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (org.loading) return;
    if (!org.clientId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [dash, mails, cheques] = await Promise.all([
          apiClient<CustomerDashboardResponse>("/api/customer/dashboard", { method: "GET" }),
          mailApi.list({ limit: 3, type: "letter" }),
          chequeApi.list({ limit: 3, status: "flagged" }),
        ]);

        if (cancelled) return;

        setDashboard(dash);
        setRecentMails(
          mails.items.map((m) => ({
            id: m.id,
            subject: m.ai_summary || m.irn || "Mail item",
            sender: m.scanned_by || "Sender",
            date: timeAgoFromIso(m.scanned_at),
            status: m.status === "received" ? "unread" : "read",
            category: m.type,
            thumbnail: m.envelope_front_url,
          }))
        );
        setPendingCheques(
          cheques.cheques.map((c) => ({
            id: c.id,
            amount: Number(c.amount_figures || 0),
            from: c.beneficiary || "Beneficiary",
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [org.loading, org.clientId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#0A3D8F] to-[#083170] rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />
            <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-[260px]">
                <h1 className="text-3xl font-bold mb-2">
                  {loading || org.loading ? "Welcome back!" : `Welcome back, ${org.companyName || "Customer"}!`}
                </h1>
                <p className="text-blue-100">Here&apos;s what&apos;s happening with your mail and cheques today.</p>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Link
                  href={`${baseHref}/mails`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-mail-line" /> View Mails
                </Link>
                <Link
                  href={`${baseHref}/cheques`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-bank-card-line" /> View Cheques
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
                  <i className="ri-mail-line text-xl text-[#0A3D8F]" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{dashboard?.totalMails ?? "—"}</h3>
              <p className="text-sm text-gray-500">Total Mails</p>
              <p className="text-xs text-[#0A3D8F] mt-1 font-medium">3 unread</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
                  <i className="ri-bank-card-line text-xl text-[#2F8F3A]" />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {(dashboard?.pendingRequests ?? 0) > 0 ? `${dashboard?.pendingRequests} pending` : "0 pending"}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{dashboard?.totalCheques ?? "—"}</h3>
              <p className="text-sm text-gray-500">Cheques Received</p>
              <p className="text-xs text-amber-600 mt-1 font-medium">Action required</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center">
                  <i className="ri-exchange-dollar-line text-xl text-teal-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">$19,300</h3>
              <p className="text-sm text-gray-500">Total Deposited</p>
              <p className="text-xs text-gray-400 mt-1">This month</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <i className="ri-bank-line text-xl text-indigo-600" />
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">2 active</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">2</h3>
              <p className="text-sm text-gray-500">Bank Accounts</p>
              <Link href={`${baseHref}/account`} className="text-xs text-[#0A3D8F] mt-1 font-medium hover:underline">
                Manage
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Mails */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Recent Mails</h2>
                <Link
                  href={`${baseHref}/mails`}
                  className="text-sm text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap"
                >
                  View all <i className="ri-arrow-right-line" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentMails.map((mail) => (
                  <Link
                    href={`${baseHref}/mails`}
                    key={mail.id}
                    className="flex gap-4 p-4 hover:bg-gray-50 cursor-pointer block"
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {mail.thumbnail ? (
                        <img src={mail.thumbnail} alt={mail.subject} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Mail</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {mail.status === "unread" && <span className="w-1.5 h-1.5 bg-[#0A3D8F] rounded-full flex-shrink-0" />}
                          <h3
                            className={`text-sm truncate ${
                              mail.status === "unread" ? "font-bold text-gray-900" : "font-medium text-gray-700"
                            }`}
                          >
                            {mail.subject}
                          </h3>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{mail.date}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{mail.sender}</p>
                      <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {mail.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pending Cheques */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Pending Cheque Actions</h2>
                <Link
                  href={`${baseHref}/cheques`}
                  className="text-sm text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap"
                >
                  View all <i className="ri-arrow-right-line" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingCheques.map((cheque) => (
                  <div key={cheque.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-gray-500">{cheque.id}</span>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Action Required
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">${cheque.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          From: {cheque.from} • {cheque.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`${baseHref}/cheques`}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-1.5 bg-[#2F8F3A] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#267a2f] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-bank-line" /> Deposit
                      </Link>
                      <Link
                        href={`${baseHref}/cheques`}
                        className="flex-1 min-w-[150px] flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-hand-coin-line" /> Request Pickup
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`${baseHref}/mails`}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#0A3D8F] hover:bg-blue-50/50 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i className="ri-mail-line text-xl text-[#0A3D8F]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-sm">View All Mails</h3>
                  <p className="text-xs text-gray-500">Browse your mail archive</p>
                </div>
                <i className="ri-arrow-right-line text-gray-300 group-hover:text-[#0A3D8F] ml-auto transition-colors" />
              </Link>

              <Link
                href={`${baseHref}/cheques`}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#2F8F3A] hover:bg-green-50/50 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i className="ri-bank-card-line text-xl text-[#2F8F3A]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-sm">Manage Cheques</h3>
                  <p className="text-xs text-gray-500">Deposit or request pickup</p>
                </div>
                <i className="ri-arrow-right-line text-gray-300 group-hover:text-[#2F8F3A] ml-auto transition-colors" />
              </Link>

              <Link
                href={`${baseHref}/account`}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i className="ri-user-settings-line text-xl text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-sm">Account Settings</h3>
                  <p className="text-xs text-gray-500">Profile & bank accounts</p>
                </div>
                <i className="ri-arrow-right-line text-gray-300 group-hover:text-indigo-500 ml-auto transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

