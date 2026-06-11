"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type UserRole } from "@/lib/api/auth";

const HOME_BY_ROLE: Record<UserRole, string> = {
  super_admin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  operator: "/admin/dashboard",
  client: "/customer/dashboard",
};

export function useRoleGuard(allowedRoles: UserRole[]): boolean {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const rolesRef = useRef(allowedRoles);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((data) => {
        if (cancelled) return;
        if (rolesRef.current.includes(data.role)) {
          setAuthorized(true);
        } else {
          router.replace(HOME_BY_ROLE[data.role] ?? "/login");
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authorized;
}
