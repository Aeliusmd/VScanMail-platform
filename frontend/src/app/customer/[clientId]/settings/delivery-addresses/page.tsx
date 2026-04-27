"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CustomerDeliveryAddressesRedirectPage() {
  const router = useRouter();
  const params = useParams<{ clientId?: string }>();
  const clientId = params?.clientId;

  useEffect(() => {
    const target = clientId
      ? `/customer/${clientId}/account?tab=delivery-addresses`
      : "/customer/account?tab=delivery-addresses";
    router.replace(target);
  }, [clientId, router]);

  return null;
}
