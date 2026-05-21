"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";

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
  borderClass: string;
} {
  const label = toTab(status);
  switch (status) {
    case "pending":
      return { label, pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", accentClass: "bg-amber-500", borderClass: "border-l-amber-400" };
    case "approved":
      return { label, pillClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", accentClass: "bg-blue-600", borderClass: "border-l-blue-500" };
    case "in_transit":
      return { label, pillClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", accentClass: "bg-indigo-600", borderClass: "border-l-indigo-500" };
    case "delivered":
      return { label, pillClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", accentClass: "bg-emerald-600", borderClass: "border-l-emerald-500" };
    case "rejected":
      return { label, pillClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", accentClass: "bg-rose-600", borderClass: "border-l-rose-500" };
    case "cancelled":
      return { label, pillClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", accentClass: "bg-slate-500", borderClass: "border-l-slate-300" };
    default:
      return { label, pillClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", accentClass: "bg-slate-400", borderClass: "border-l-slate-200" };
  }
}

function sourceMeta(sourceType: DeliveryDto["sourceType"]): { label: string; className: string } {
  if (sourceType === "cheque") return { label: "Cheque", className: "bg-[#0A3D8F]/10 text-[#0A3D8F]" };
  return { label: "Mail", className: "bg-slate-100 text-slate-700" };
}

export default function CustomerDeliveryRequestsPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("All");
  const [rows, setRows] = useState<DeliveryDto[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveriesApi.listMine();
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
        (r.trackingNumber || "").toLowerCase().includes(q) ||
        (r.addressName || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [rows, query, tab]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter((r) => r.status === "approved" || r.status === "in_transit").length;
    const delivered = rows.filter((r) => r.status === "delivered").length;
    return { total, pending, active, delivered };
  }, [rows]);

  const tabs: TabType[] = ["All", "Pending", "Approved", "In Transit", "Delivered", "Rejected", "Cancelled"];

  const onCancel = async (row: DeliveryDto) => {
    if (row.status !== "pending") return;
    try {
      await deliveriesApi.cancel(row.id, row.sourceType);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to cancel request.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery Requests</h1>
            <p className="text-sm text-slate-500">Track pickup and delivery requests for cheques and mails</p>
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
                  placeholder="Search by ID, IRN, tracking, recipient…"
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
            {/* Queue header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">Queue</span>
              <span className="text-xs text-slate-500">{filtered.length} shown</span>
            </div>

            {/* Column sub-header */}
            <div className="hidden md:flex items-center border-b border-slate-100 bg-slate-50/70 px-4 py-2 gap-3">
              <div className="w-3 flex-shrink-0" />
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recipient / Details</div>
              <div className="w-44 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:block">Address</div>
              <div className="w-28 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Tracking</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const s = statusMeta(r.status);
                const src = sourceMeta(r.sourceType);
                const highlighted = Boolean(highlightId && highlightId === r.id);
                const addressLine = [
                  r.addressLine1,
                  r.addressLine2,
                  r.addressCity,
                  [r.addressState, r.addressZip].filter(Boolean).join(" "),
                  r.addressCountry,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={r.id}
                    className={`group flex items-stretch border-l-[3px] ${s.borderClass} hover:bg-slate-50/80 transition-colors ${
                      highlighted ? "bg-[#0A3D8F]/5" : ""
                    }`}
                  >
                    {/* Clickable row */}
                    <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
                      {/* Left: badges + recipient + address */}
                      <div className="flex-1 min-w-0">
                        {/* Status + source + ID */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.pillClass}`}>
                            {s.label}
                          </span>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${src.className}`}>
                            {src.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300 truncate max-w-[160px] hidden sm:block">
                            {r.id}
                          </span>
                        </div>

                        {/* Recipient avatar + name + meta */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#0A3D8F] to-[#083170] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {(r.addressName || "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {r.addressName || "Recipient"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {r.irn ? `IRN ${r.irn}` : ""}
                              {r.irn && r.requestedAt ? " · " : ""}
                              {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : ""}
                            </div>
                          </div>
                        </div>

                        {/* Address — mobile */}
                        {addressLine && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 truncate lg:hidden">
                            <i className="ri-map-pin-line text-slate-400 flex-shrink-0 text-xs" />
                            <span className="truncate">{addressLine}</span>
                          </div>
                        )}

                        {/* Inline info: reject reason, proof link, cancel */}
                        {(r.rejectReason || r.proofOfServiceUrl || r.status === "pending") && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {r.rejectReason && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <i className="ri-error-warning-line text-xs" />
                                {r.rejectReason}
                              </span>
                            )}
                            {r.proofOfServiceUrl && (
                              <a
                                href={r.proofOfServiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] text-[#0A3D8F] font-semibold hover:underline"
                              >
                                <i className="ri-file-text-line text-xs" />
                                View Proof of Service
                              </a>
                            )}
                            {r.status === "pending" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void onCancel(r);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-200 text-rose-700 text-[11px] font-semibold hover:bg-rose-50 transition-colors"
                              >
                                <i className="ri-close-line text-xs" />
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Address column (desktop) */}
                      {addressLine && (
                        <div className="hidden lg:block w-44 flex-shrink-0 min-w-0">
                          <div className="text-xs font-medium text-slate-700 truncate">{addressLine.split(",")[0]}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {addressLine.split(",").slice(1).join(",").trim()}
                          </div>
                        </div>
                      )}

                      {/* Tracking */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-0.5 w-28">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tracking</span>
                        <span className={`text-xs font-semibold truncate ${r.trackingNumber ? "text-slate-800" : "text-slate-400"}`}>
                          {r.trackingNumber || "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
