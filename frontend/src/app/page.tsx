"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/images/icon.jpg" alt="VScanMail" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">VScan Mail</h1>
            <p className="text-sm text-slate-500">Select Customer or Admin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => router.push("/customer-dashboard")}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-900">Customer</div>
            <div className="text-xs text-slate-500 mt-1">Open customer portal</div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-left text-white hover:bg-blue-700 transition-colors"
          >
            <div className="text-sm font-semibold">Admin</div>
            <div className="text-xs text-white/80 mt-1">Open admin login</div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/superadmin")}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-900">Super Admin</div>
            <div className="text-xs text-slate-500 mt-1">Open super admin dashboard</div>
          </button>
        </div>
      </div>
    </div>
  );
}