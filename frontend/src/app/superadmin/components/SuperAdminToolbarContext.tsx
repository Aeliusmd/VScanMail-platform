"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type SuperAdminToolbarContextValue = {
  search: string;
  setSearch: (value: string) => void;
  setAddCompanyHandler: (fn: (() => void) | null) => void;
  addCompanyHandlerRef: MutableRefObject<(() => void) | null>;
};

const SuperAdminToolbarContext = createContext<SuperAdminToolbarContextValue | null>(null);

export function SuperAdminToolbarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [search, setSearchState] = useState("");
  const addCompanyHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSearchState("");
  }, [pathname]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const setAddCompanyHandler = useCallback((fn: (() => void) | null) => {
    addCompanyHandlerRef.current = fn;
  }, []);

  const value = useMemo(
    (): SuperAdminToolbarContextValue => ({
      search,
      setSearch,
      setAddCompanyHandler,
      addCompanyHandlerRef,
    }),
    [search, setSearch, setAddCompanyHandler]
  );

  return <SuperAdminToolbarContext.Provider value={value}>{children}</SuperAdminToolbarContext.Provider>;
}

export function useSuperAdminToolbar(): SuperAdminToolbarContextValue {
  const ctx = useContext(SuperAdminToolbarContext);
  if (!ctx) {
    throw new Error("useSuperAdminToolbar must be used within SuperAdminToolbarProvider");
  }
  return ctx;
}

/** Safe for shared admin pages: null outside super-admin layout. */
export function useSuperAdminToolbarOptional(): SuperAdminToolbarContextValue | null {
  return useContext(SuperAdminToolbarContext);
}
