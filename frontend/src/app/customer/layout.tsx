"use client";

import type { ReactNode } from "react";
import CustomerNav from "./components/CustomerNav";
import { OrgContextProvider } from "./components/OrgContext";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OrgContextProvider>
      <CustomerNav />
      {children}
    </OrgContextProvider>
  );
}

