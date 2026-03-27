"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { authApi } from "@/lib/api/auth";
import { mailApi, type MailStatus, type MailItem } from "@/lib/api/mail";

function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function mapStatus(status: MailStatus): { label: string; color: string } {
  switch (status) {
    case "delivered":
      return { label: "Delivered", color: "bg-green-100 text-green-700" };
    case "processed":
      return { label: "Processed", color: "bg-[#DBEAFE] text-[#1E40AF]" };
    case "scanned":
    case "received":
    default:
      return { label: "Pending", color: "bg-yellow-100 text-yellow-700" };
  }
}

export default function RecentActivity() {
  const [companyName, setCompanyName] = useState<string>("");
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      company: string;
      type: "Mail" | "Cheque";
      time: string;
      status: string;
      statusColor: string;
      icon: string;
    }>
  >([]);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setCompanyName(res?.client?.company_name || ""))
      .catch(() => {
        // ignore - dashboard can still render without company name
      });

    mailApi
      .list({ limit: 7, page: 1 })
      .then((res) => {
        const items: MailItem[] = res.items || [];
        setActivities(
          items.map((item) => {
            const mapped = mapStatus(item.status);
            const type = item.type === "cheque" ? "Cheque" : "Mail";
            return {
              id: item.id,
              company: companyName,
              type,
              time: formatTime(item.scanned_at || item.created_at),
              status: mapped.label,
              statusColor: mapped.color,
              icon: type === "Cheque" ? "iconamoon:cheque" : "ri:mail-line",
            };
          })
        );
      })
      .catch(() => {
        // ignore
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedActivities = useMemo(
    () =>
      activities.map((a) => ({
        ...a,
        company: a.company || companyName,
      })),
    [activities, companyName]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-900 font-roboto">Recent Activity</h2>
        <Link href="/dashboard/mails" className="text-sm text-[#1E40AF] hover:underline cursor-pointer font-roboto whitespace-nowrap">View All</Link>
      </div>

      <div className="space-y-1">
        {resolvedActivities.map((item) => (
          <Link
            key={item.id}
            href={item.type === "Cheque" ? "/dashboard/cheques" : "/dashboard/mails"}
            className="flex items-center justify-between py-3 border-b border-gray-50 hover:bg-gray-50/60 rounded-lg px-2 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <Icon icon={item.icon} className="text-gray-500 text-base" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 font-roboto">{item.company}</p>
                <p className="text-xs text-gray-400 font-roboto">{item.type} &bull; {item.time}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${item.statusColor}`}>
              {item.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
