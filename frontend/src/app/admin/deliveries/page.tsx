"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";
import { useAdminProfile } from "../components/useAdminProfile";
import NotificationBell from "../components/NotificationBell";
import ClickedDelivery from "./components/ClickedDelivery";
import { useSuperAdminToolbarOptional } from "../../superadmin/components/SuperAdminToolbarContext";

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

export default function AdminDeliveriesPage() {
  return (
    <Suspense fallback={null}>
      <AdminDeliveriesPageContent />
    </Suspense>
  );
}

function AdminDeliveriesPageContent() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyFromUrl = searchParams.get("company") ?? "";
  const clientIdFromUrl = searchParams.get("clientId") ?? "";

  const isSuperadminRoute = pathname.startsWith("/superadmin");
  const toolbar = useSuperAdminToolbarOptional();
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(companyFromUrl);
  const [tab, setTab] = useState<TabType>("All");
  const [rows, setRows] = useState<DeliveryDto[]>([]);
  const [opened, setOpened] = useState<DeliveryDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCancelling, setBulkCancelling] = useState(false);

  const profilePath = isSuperadminRoute ? "/superadmin/settings/profile" : "/admin/settings/profile";
  const settingsPath = isSuperadminRoute ? "/superadmin/settings" : "/admin/settings";
  const scanPath = isSuperadminRoute ? "/superadmin/scan" : "/admin/scan";

  useEffect(() => {
    setQuery(companyFromUrl);
  }, [companyFromUrl]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!value.trim()) {
      if (params.has("company") || params.has("clientId")) {
        params.delete("company");
        params.delete("clientId");
        changed = true;
      }
    } else if (params.has("clientId") && value !== companyFromUrl) {
      params.delete("company");
      params.delete("clientId");
      changed = true;
    }
    if (changed) {
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    }
  };

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
      if (clientIdFromUrl) {
        return matchesTab && r.clientId === clientIdFromUrl;
      }
      const q = (isSuperadminRoute ? (toolbar?.search ?? query) : query).trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.irn.toLowerCase().includes(q) ||
        (r.clientName || "").toLowerCase().includes(q) ||
        (r.trackingNumber || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [rows, tab, query, clientIdFromUrl, isSuperadminRoute, toolbar?.search]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter((r) => r.status === "approved" || r.status === "in_transit").length;
    const delivered = rows.filter((r) => r.status === "delivered").length;
    return { total, pending, active, delivered };
  }, [rows]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleCheck = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllCheck = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleBulkCancel = async () => {
    const cancellable = Array.from(selectedIds).filter((id) => {
      const r = rows.find((x) => x.id === id);
      return r && r.status !== "cancelled" && r.status !== "delivered";
    });
    if (!cancellable.length) {
      alert("None of the selected deliveries can be cancelled (already delivered or cancelled).");
      return;
    }
    if (!confirm(`Cancel ${cancellable.length} delivery request(s)? This cannot be undone.`)) return;
    setBulkCancelling(true);
    try {
      await Promise.all(
        cancellable.map((id) =>
          fetch(`/api/admin/deliveries/${id}/cancel`, { method: "POST" })
        )
      );
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      console.error("Bulk cancel failed:", err);
    } finally {
      setBulkCancelling(false);
    }
  };

  const tabs: TabType[] = ["All", "Pending", "Approved", "In Transit", "Delivered", "Rejected", "Cancelled"];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white min-w-0 overflow-x-hidden">

      {/* Header — deposits style */}
      {!isSuperadminRoute && (
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left: search */}
            <div className="relative flex-1 max-w-xl min-w-0">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <input
                type="text"
                placeholder="Search delivery requests..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Right: scan + notification + user */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href={scanPath}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#0A3D8F] text-white text-sm font-semibold rounded-full hover:bg-[#083170] transition-colors whitespace-nowrap"
              >
                <i className="ri-scan-2-line text-sm" />
                <span className="hidden sm:inline">New Scan</span>
              </Link>
              <NotificationBell />
              <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-1 py-1 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white font-semibold text-xs overflow-hidden flex-shrink-0">
                    {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900 leading-none">{displayName}</p>
                    <p className="text-xs text-slate-500 uppercase">{displayRole}</p>
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-[200px] bg-white rounded-2xl shadow-lg border border-slate-200 z-50 py-1 overflow-hidden">
                    <Link href={profilePath} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setShowUserMenu(false)}>
                      <i className="ri-user-line text-sm" /> My Profile
                    </Link>
                    <Link href={settingsPath} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setShowUserMenu(false)}>
                      <i className="ri-settings-3-line text-sm" /> Settings
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <i className="ri-logout-box-r-line text-sm" /> Sign Out
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Filter tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              tab === t ? "bg-[#0A3D8F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white min-w-0">
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
              <i className="ri-inbox-2-line text-xl" />
            </div>
            <div className="text-sm font-semibold text-slate-900">No delivery requests</div>
            <div className="text-sm text-slate-500">Try switching tabs or clearing your search.</div>
          </div>
        ) : (
          <div>
            {/* Queue toolbar */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllCheck}
                  className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-900">Queue</span>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
                    <button
                      onClick={handleBulkCancel}
                      disabled={bulkCancelling}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <i className="ri-close-circle-line text-sm" />
                      {bulkCancelling ? "Cancelling…" : "Cancel Selected"}
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-1 hover:bg-slate-100 rounded-lg"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">{filtered.length} shown</div>
            </div>

            {/* Column sub-header */}
            <div className="hidden md:flex items-center border-b border-slate-100 bg-slate-50/70 px-4 py-2 gap-3">
              <div className="w-4 flex-shrink-0" />
              <div className="w-3 flex-shrink-0" />
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client / Details</div>
              <div className="w-44 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:block">Recipient</div>
              <div className="w-28 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Tracking</div>
              <div className="w-10" />
            </div>

            {/* Rows */}
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

                return (
                  <div
                    key={r.id}
                    className={`group flex items-stretch border-l-[3px] ${s.borderClass} hover:bg-slate-50/80 transition-colors`}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center px-3 py-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={(e) => { e.stopPropagation(); toggleCheck(r.id); }}
                        className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                      />
                    </div>

                    {/* Clickable row content */}
                    <button
                      onClick={() => setOpened(r)}
                      className="flex-1 flex items-center gap-3 py-3.5 pr-4 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A3D8F]/30"
                    >
                      {/* Left: badges + name + address */}
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

                        {/* Client avatar + name + meta */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#0A3D8F] to-[#083170] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {(r.clientName || r.clientId || "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {r.clientName || r.clientId}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {r.irn ? `IRN ${r.irn}` : ""}
                              {r.irn && r.requestedAt ? " · " : ""}
                              {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : ""}
                            </div>
                          </div>
                        </div>

                        {/* Address — visible on mobile, hidden on lg (shown in column) */}
                        {addressLine && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 truncate lg:hidden">
                            <i className="ri-map-pin-line text-slate-400 flex-shrink-0 text-xs" />
                            <span className="truncate">
                              {r.addressName ? `${r.addressName} · ` : ""}
                              {addressLine}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Recipient column (desktop) */}
                      {addressLine && (
                        <div className="hidden lg:block w-44 flex-shrink-0 min-w-0">
                          <div className="text-xs font-medium text-slate-700 truncate">
                            {r.addressName || "—"}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{addressLine}</div>
                        </div>
                      )}

                      {/* Tracking + Open */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-0.5 w-28">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tracking</span>
                        <span className={`text-xs font-semibold truncate ${r.trackingNumber ? "text-slate-800" : "text-slate-400"}`}>
                          {r.trackingNumber || "Not set"}
                        </span>
                        <span className="mt-1.5 flex items-center gap-0.5 text-[11px] font-medium text-slate-400 group-hover:text-[#0A3D8F] transition-colors">
                          Open <i className="ri-arrow-right-s-line" />
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

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
