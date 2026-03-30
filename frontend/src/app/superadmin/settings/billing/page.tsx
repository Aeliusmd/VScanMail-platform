"use client";

import { Icon } from "@iconify/react";

export default function SuperAdminBillingPage() {
  return (
    <div className="py-2">
      <h1 className="text-lg sm:text-xl font-bold text-slate-900">Billing</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">Plans billing and payment preferences (demo).</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Icon icon="ri:bank-card-line" className="text-[#0A3D8F] text-lg" />
          <p className="text-sm font-semibold text-slate-900">Billing Overview</p>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600">This UI is frontend-only. Later, connect it to your billing backend.</p>
        </div>
      </div>
    </div>
  );
}

