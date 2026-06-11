"use client";

import type { ReactNode } from "react";
import CustomerNav from "./components/CustomerNav";
import { OrgContextProvider } from "./components/OrgContext";
import SessionTimeoutProvider from "@/components/SessionTimeoutProvider";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authorized = useRoleGuard(["client"]);
  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D8F]" />
      </div>
    );
  }

  return (
    <SessionTimeoutProvider>
      <OrgContextProvider>
        <CustomerNav />
        {children}
      </OrgContextProvider>
    </SessionTimeoutProvider>
  );
}

