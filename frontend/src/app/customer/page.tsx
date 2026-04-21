"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";

export default function CustomerResolverPage() {
  const router = useRouter();

  useEffect(() => {
    authApi
      .me()
      .then((m) => {
        if (m.role === "client" && m.clientId) router.replace(`/customer/${m.clientId}/dashboard`);
        else if (m.role === "admin") router.replace("/admin");
        else if (m.role === "super_admin") router.replace("/superadmin/dashboard");
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return null;
}
