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
    pathname === "/customer/landing" ||
    pathname === "/customer/home" ||
    pathname === "/customer/select-plan";

  return (
    <>
      {!hideNav && <CustomerNav />}
      {children}
    </>
  );
}

