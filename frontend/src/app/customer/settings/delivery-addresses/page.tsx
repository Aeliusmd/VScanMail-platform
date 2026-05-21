"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerDeliveryAddressesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer/account?tab=delivery-addresses");
  }, [router]);

  return null;
}
