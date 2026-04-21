"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type ClientInfo, type UserRole } from "@/lib/api/auth";

type OrgContextValue = {
  loading: boolean;
  role: UserRole | null;
  clientId: string | null;
  client: ClientInfo | null;
  companyName: string | null;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgContextProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const me = await authApi.me();
        if (cancelled) return;

        setRole(me.role);
        setClientId(me.clientId);
        setClient(me.client);

        if (me.role !== "client" || !me.clientId) {
          router.replace("/login");
        }
      } catch {
        if (cancelled) return;
        router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const value = useMemo<OrgContextValue>(
    () => ({
      loading,
      role,
      clientId,
      client,
      companyName: client?.company_name ?? null,
    }),
    [loading, role, clientId, client]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrgContext must be used within OrgContextProvider");
  return ctx;
}

