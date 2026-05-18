"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { clientsApi, type ClientDirectoryItem } from "@/lib/api/clients";
import { mailApi } from "@/lib/api/mail";
import { chequeApi } from "@/lib/api/cheques";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { resolveAvatarUrl } from "@/lib/resolve-avatar-url";

type Props = {
  title: string;
  subtitle?: string;
  kind?: "mails" | "cheques";
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onPick: (client: ClientDirectoryItem) => void;
};

type ActivitySummary = {
  total: number;
  label: string;
  description: string;
  time: string;
  timestamp: number;
};

export default function OrganizationPicker({
  title,
  subtitle,
  kind = "mails",
  searchValue,
  onSearchChange,
  showSearch = true,
  onPick,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ClientDirectoryItem[]>([]);
  const [activity, setActivity] = useState<Record<string, ActivitySummary>>({});
  const [search, setSearch] = useState("");
  const activeSearch = searchValue ?? search;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientsApi.list(1, 200);
      setItems(res.clients || []);
      setActivity({});
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load organizations.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (items.length === 0) return;

    let alive = true;
    setActivityLoading(true);

    Promise.allSettled(
      items.map(async (client) => {
        if (kind === "cheques") {
          const res = await chequeApi.list({ archived: false, clientId: client.id, limit: 1 });
          const latest = res.cheques[0];
          const raw = latest?.ai_raw_result || {};
          const chequeNumber =
            raw.cheque_number ||
            raw.chequeNumber ||
            raw.number ||
            latest?.id?.slice(0, 8) ||
            "";

          return {
            clientId: client.id,
            summary: {
              total: res.total,
              label: latest
                ? `${raw.bank_name || raw.bankName || "Cheque"}${chequeNumber ? ` - ${chequeNumber}` : ""}`
                : "No cheques yet",
              description: latest
                ? raw.summary || raw.notes || `Payee: ${latest.beneficiary || "Unknown"}`
                : "No recent cheque activity",
              time: latest ? formatRelativeTime(latest.created_at) : "",
              timestamp: latest ? new Date(latest.created_at).getTime() || 0 : 0,
            },
          };
        }

        const res = await mailApi.list({ archived: false, clientId: client.id, limit: 1 });
        const latest = res.items[0];
        return {
          clientId: client.id,
          summary: {
            total: res.total,
            label: latest
              ? `${latest.type.charAt(0).toUpperCase()}${latest.type.slice(1)} - ${latest.irn}`
              : "No mails yet",
            description: latest?.ai_summary || "No recent mail activity",
            time: latest ? formatRelativeTime(latest.scanned_at || latest.created_at) : "",
            timestamp: latest ? new Date(latest.scanned_at || latest.created_at).getTime() || 0 : 0,
          },
        };
      })
    )
      .then((results) => {
        if (!alive) return;
        const next: Record<string, ActivitySummary> = {};
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next[result.value.clientId] = result.value.summary;
          }
        });
        setActivity(next);
      })
      .finally(() => {
        if (alive) setActivityLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [items, kind]);

  const filtered = useMemo(() => {
    const q = activeSearch.trim().toLowerCase();
    const base = q
      ? items.filter((c) => {
          const name = (c.company_name || "").toLowerCase();
          return name.includes(q);
        })
      : items;

    return [...base].sort((a, b) => {
      const aSummary = activity[a.id];
      const bSummary = activity[b.id];
      const aHasRecords = (aSummary?.total ?? 0) > 0;
      const bHasRecords = (bSummary?.total ?? 0) > 0;
      if (aHasRecords !== bHasRecords) return aHasRecords ? -1 : 1;
      return (bSummary?.timestamp ?? 0) - (aSummary?.timestamp ?? 0);
    });
  }, [items, activeSearch, activity]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
        <button
          onClick={fetchClients}
          className="px-3 py-2 text-sm font-semibold text-slate-800 bg-white rounded-xl border border-slate-300 hover:bg-slate-50 transition"
        >
          Refresh
        </button>
      </div>

      {showSearch && (
      <div className="mt-5">
        <div className="relative">
          <Icon icon="ri:search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={activeSearch}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            placeholder="Search organizations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition"
          />
        </div>
      </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading organizations...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <Icon icon="ri:error-warning-line" className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-bold mb-2">Error loading organizations</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <button
              onClick={fetchClients}
              className="mt-6 px-4 py-2 bg-[#0A3D8F] text-white rounded-lg text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Icon icon="ri:building-line" className="text-2xl text-slate-500" />
            </div>
            <p className="text-slate-700 font-semibold">No organizations found</p>
            <p className="text-slate-500 text-sm mt-1">Try a different search.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {filtered.map((c) => {
              const initial = (c.company_name || "C").trim().slice(0, 1).toUpperCase();
              const avatarSrc = resolveAvatarUrl(c.avatar_url);
              const summary = activity[c.id];

              return (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={c.company_name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#0A3D8F]/10 text-[#0A3D8F] flex items-center justify-center font-bold flex-shrink-0">
                      {initial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.company_name}</p>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                        {String(c.status || "unknown")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {c.industry || "-"} · {c.email || "-"}
                    </p>
                    <p className="text-xs text-slate-700 truncate mt-1">
                      {summary?.label ||
                        (activityLoading
                          ? "Loading recent activity..."
                          : kind === "cheques"
                            ? "No cheques yet"
                            : "No mails yet")}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{summary?.description || ""}</p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end flex-shrink-0 min-w-[90px]">
                    <span className="text-sm font-bold text-slate-800">{summary?.total ?? "-"}</span>
                    <span className="text-[11px] text-slate-500">{kind}</span>
                    {summary?.time ? <span className="text-[11px] text-slate-400 mt-1">{summary.time}</span> : null}
                  </div>
                  <Icon icon="ri:arrow-right-s-line" className="text-slate-400 text-xl flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
