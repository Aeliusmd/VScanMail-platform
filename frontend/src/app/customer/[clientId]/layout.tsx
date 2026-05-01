"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrgContext } from "../components/OrgContext";

function TenantGuard({ children }: { children: ReactNode }) {
  const params = useParams<{ clientId: string }>();
  const urlClientId = params?.clientId;
  const org = useOrgContext();
  const router = useRouter();

  useEffect(() => {
    if (org.loading) return;
    if (!org.clientId) {
      router.replace("/login");
      return;
    }
    if (urlClientId && org.clientId !== urlClientId) {
      router.replace(`/customer/${org.clientId}/dashboard`);
    }
  }, [org.loading, org.clientId, urlClientId, router]);

  if (org.loading) return null;
  return <>{children}</>;
}

export default function CustomerClientIdLayout({ children }: { children: ReactNode }) {
  return <TenantGuard>{children}</TenantGuard>;
}

