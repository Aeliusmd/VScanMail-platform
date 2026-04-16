"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { clientsApi, type ClientDirectoryItem } from "@/lib/api/clients";

type Props = {
  title: string;
  subtitle?: string;
  onPick: (client: ClientDirectoryItem) => void;
};

export default function OrganizationPicker({ title, subtitle, onPick }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ClientDirectoryItem[]>([]);
  const [search, setSearch] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // MVP: load a page of orgs; refine later if you need full directory search.
      const res = await clientsApi.list(1, 200);
      setItems(res.clients || []);
    } catch (e: any) {
      setError(e?.body?.error || e?.message || "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const name = (c.company_name || "").toLowerCase();
      const industry = (c.industry || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(q) || industry.includes(q) || email.includes(q);
    });
  }, [items, search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
        <button
          onClick={fetchClients}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5">
        <div className="relative">
          <Icon
            icon="ri:search-line"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition"
          />
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading organizations…</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <Icon
              icon="ri:error-warning-line"
              className="text-4xl text-red-500 mx-auto mb-4"
            />
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
              return (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0A3D8F]/10 text-[#0A3D8F] flex items-center justify-center font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {c.company_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {c.industry || "—"} · {c.email || "—"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                    {String(c.status || "unknown")}
                  </span>
                  <Icon
                    icon="ri:arrow-right-s-line"
                    className="text-slate-400 text-xl flex-shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

