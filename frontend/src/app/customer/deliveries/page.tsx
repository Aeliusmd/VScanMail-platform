"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCustomerDeliveriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer");
  }, [router]);

  return null;
}

