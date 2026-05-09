"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { resetSessionTimer, startSessionTimer, stopSessionTimer } from "@/lib/session-timeout";

export default function SessionTimeoutProvider({ children }: { children: ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
    if (publicPaths.some((path) => window.location.pathname.startsWith(path))) return;

    const handleWarn = () => {
      setShowWarning(true);
    };

    const handleExpire = () => {
      window.localStorage.removeItem("vscanmail_last_activity");
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).finally(() => {
        window.location.href = "/login";
      });
    };

    startSessionTimer(handleExpire, handleWarn);
    return () => {
      stopSessionTimer();
    };
  }, []);

  return (
    <>
      {children}

      {showWarning === true && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="text-orange-500 text-3xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Session Expiring Soon</h2>
            <p className="text-slate-600 text-sm mb-6">
              You've been inactive for 55 minutes. Your session will expire in 5 minutes.
            </p>
            <button
              type="button"
              className="bg-[#0A3D8F] text-white px-6 py-3 rounded-full font-semibold w-full"
              onClick={() => {
                resetSessionTimer();
                setShowWarning(false);
              }}
            >
              Stay Logged In
            </button>
            <p className="text-slate-500 text-xs mt-4">
              You will be automatically logged out due to inactivity.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

