"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCustomerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer");
  }, [router]);

  return null;
}