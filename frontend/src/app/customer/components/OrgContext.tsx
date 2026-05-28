"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type ClientInfo, type UserRole } from "@/lib/api/auth";

type OrgContextValue = {
  loading: boolean;
  role: UserRole | null;
  clientId: string | null;
  client: ClientInfo | null;
  companyName: string | null;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  refreshClient: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgContextProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined);

  const refreshClient = useCallback(async () => {
    const me = await authApi.me();
    setRole(me.role);
    setClientId(me.clientId);
    setClient(me.client);
    setAvatarOverride(undefined);
  }, []);

  const setAvatarUrl = useCallback((url: string | null) => {
    setAvatarOverride(url);
  }, []);

  const checkSession = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const me = await authApi.me();
      setRole(me.role);
      setClientId(me.clientId);
      setClient(me.client);
      if (me.role !== "client" || !me.clientId) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    checkSession().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [checkSession]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkSession({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [checkSession]);

  const value = useMemo<OrgContextValue>(
    () => ({
      loading,
      role,
      clientId,
      client,
      companyName: client?.company_name ?? null,
      avatarUrl: avatarOverride !== undefined ? avatarOverride : (client?.avatar_url ?? null),
      setAvatarUrl,
      refreshClient,
    }),
    [loading, role, clientId, client, avatarOverride, setAvatarUrl, refreshClient]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrgContext must be used within OrgContextProvider");
  return ctx;
}
