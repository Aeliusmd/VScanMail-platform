"use client";

import { createContext, useContext, type ReactNode } from "react";

const SuperAdminOpenMobileNavContext = createContext<(() => void) | null>(null);

export function SuperAdminOpenMobileNavProvider({
  open,
  children,
}: {
  open: () => void;
  children: ReactNode;
}) {
  return (
    <SuperAdminOpenMobileNavContext.Provider value={open}>{children}</SuperAdminOpenMobileNavContext.Provider>
  );
}

export function useSuperAdminOpenMobileNav() {
  return useContext(SuperAdminOpenMobileNavContext) ?? (() => {});
}
