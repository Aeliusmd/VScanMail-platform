"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";
import ClickedDelivery from "./components/ClickedDelivery";

type TabType = "All" | "Pending" | "Approved" | "In Transit" | "Delivered" | "Rejected" | "Cancelled";

function toTab(status: DeliveryDto["status"]): TabType {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return "All";
  }
}

function statusMeta(status: DeliveryDto["status"]): {
  label: TabType;
  pillClass: string;
  accentClass: string;
} {
  const label = toTab(status);
  switch (status) {
    case "pending":
      return { label, pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", accentClass: "bg-amber-500" };
    case "approved":
      return { label, pillClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", accentClass: "bg-blue-600" };
    case "in_transit":
      return { label, pillClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", accentClass: "bg-indigo-600" };
    case "delivered":
      return { label, pillClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", accentClass: "bg-emerald-600" };
    case "rejected":
      return { label, pillClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", accentClass: "bg-rose-600" };
    case "cancelled":
      return { label, pillClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", accentClass: "bg-slate-500" };
    default:
      return { label, pillClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", accentClass: "bg-slate-400" };
  }
}

function sourceMeta(sourceType: DeliveryDto["sourceType"]): { label: string; className: string } {
  if (sourceType === "cheque") return { label: "Cheque", className: "bg-[#0A3D8F]/10 text-[#0A3D8F]" };
  return { label: "Mail", className: "bg-slate-100 text-slate-700" };
}

export default function AdminDeliveriesPage() {
  const pathname = usePathname() ?? "";
  const isSuperadminRoute = pathname.startsWith("/superadmin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("All");
  const [rows, setRows] = useState<DeliveryDto[]>([]);
  const [opened, setOpened] = useState<DeliveryDto | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveriesApi.adminList();
      setRows(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load delivery requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesTab = tab === "All" || toTab(r.status) === tab;
      const q = query.toLowerCase();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.irn.toLowerCase().includes(q) ||
        (r.clientName || "").toLowerCase().includes(q) ||
        (r.trackingNumber || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [rows, tab, query]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter((r) => r.status === "approved" || r.status === "in_transit").length;
    const delivered = rows.filter((r) => r.status === "delivered").length;
    return { total, pending, active, delivered };
  }, [rows]);

  const tabs: TabType[] = ["All", "Pending", "Approved", "In Transit", "Delivered", "Rejected", "Cancelled"];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery Requests</h1>
            <p className="text-sm text-slate-500">Admin queue for cheque and mail pickups/deliveries</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] text-slate-500">Total</div>
              <div className="text-sm font-semibold text-slate-900">{metrics.total}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] text-slate-500">Pending</div>
              <div className="text-sm font-semibold text-slate-900">{metrics.pending}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] text-slate-500">Active</div>
              <div className="text-sm font-semibold text-slate-900">{metrics.active}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] text-slate-500">Delivered</div>
              <div className="text-sm font-semibold text-slate-900">{metrics.delivered}</div>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-xl border border-slate-200 mb-4">
          <div className="p-4 border-b border-slate-100">
            <div className="w-full md:w-[440px]">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, client, IRN, tracking…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none text-slate-900 placeholder:text-slate-400 focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/15"
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Tip: Paste an ID or IRN to jump straight to a request.</div>
            </div>
          </div>
          <div className="flex items-center px-4 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  tab === t ? "border-[#0A3D8F] text-[#0A3D8F]" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
                      <div className="mt-2 h-4 w-56 bg-slate-100 rounded animate-pulse" />
                      <div className="mt-2 h-3 w-72 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="w-28">
                      <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
              <i className="ri-inbox-2-line text-xl" />
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900">No delivery requests</div>
            <div className="mt-1 text-sm text-slate-500">Try switching tabs or clearing your search.</div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Queue</div>
              <div className="text-xs text-slate-500">{filtered.length} shown</div>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const s = statusMeta(r.status);
                const src = sourceMeta(r.sourceType);
                const addressLine = [
                  r.addressLine1,
                  r.addressLine2,
                  r.addressCity,
                  [r.addressState, r.addressZip].filter(Boolean).join(" "),
                  r.addressCountry,
                ]
                  .filter(Boolean)
                  .join(", ");

                const secondary = [
                  r.irn ? `IRN ${r.irn}` : null,
                  r.requestedAt ? `Requested ${new Date(r.requestedAt).toLocaleString()}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <button
                    key={r.id}
                    onClick={() => setOpened(r)}
                    className="group w-full text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A3D8F]/30"
                  >
                    <div className="relative px-4 py-4">
                      <div className={`absolute left-0 top-0 h-full w-1 ${s.accentClass}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.pillClass}`}>
                              {s.label}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${src.className}`}>
                              {src.label}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate">{r.id}</span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0A3D8F] to-[#083170] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(r.clientName || r.clientId || "?").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {r.clientName || r.clientId}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{secondary || "—"}</div>
                            </div>
                          </div>

                          {addressLine ? (
                            <div className="mt-2 text-xs text-slate-500 truncate">
                              <span className="text-slate-400">To:</span> {r.addressName ? `${r.addressName} · ` : ""}{addressLine}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="text-[11px] text-slate-500">Tracking</div>
                          <div className="mt-1 text-xs font-semibold text-slate-900 max-w-[180px] truncate">
                            {r.trackingNumber || "Not set"}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <i className="ri-arrow-right-s-line text-slate-400" />
                            <span className="group-hover:text-[#0A3D8F] transition-colors">Open</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {opened && (
        <ClickedDelivery
          request={opened}
          onClose={() => setOpened(null)}
          onUpdated={load}
          readOnly={isSuperadminRoute}
        />
      )}
    </div>
  );
}
