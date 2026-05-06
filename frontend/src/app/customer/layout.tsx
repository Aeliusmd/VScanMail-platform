"use client";

import type { ReactNode } from "react";
import CustomerNav from "./components/CustomerNav";
import { OrgContextProvider } from "./components/OrgContext";
import SessionTimeoutProvider from "@/components/SessionTimeoutProvider";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionTimeoutProvider>
      <OrgContextProvider>
        <CustomerNav />
        {children}
      </OrgContextProvider>
    </SessionTimeoutProvider>
  );
}

