"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCustomerMailsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer");
  }, [router]);

  return null;
}

