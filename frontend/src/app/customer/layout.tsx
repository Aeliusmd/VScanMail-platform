"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import CustomerNav from "./components/CustomerNav";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hideNav =
    pathname === "/customer" ||
    pathname === "/customer/home" ||
    pathname === "/customer/login" ||
    pathname === "/customer/select-plan" ||
    pathname === "/customer/register";

  return (
    <>
      {!hideNav && <CustomerNav />}
      {children}
    </>
  );
}

