"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import CustomerNav from "./components/CustomerNav";

export default function CustomerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hideNav =
    pathname === "/customer-dashboard" ||
    pathname === "/customer-dashboard/home" ||
    pathname === "/customer-dashboard/login" ||
    pathname === "/customer-dashboard/select-plan" ||
    pathname === "/customer-dashboard/register";

  return (
    <>
      {!hideNav && <CustomerNav />}
      {children}
    </>
  );
}

