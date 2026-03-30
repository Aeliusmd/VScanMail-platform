"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function BillingPlanPage() {
  const [currentPlan] = useState('Business Pro');

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Billing & Plan</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your subscription and payment details.</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Current plan — blue card (vertical rhythm: header + stacked stat blocks + action) */}
        <div className="overflow-hidden rounded-2xl border border-[#0A3D8F] bg-[#0A3D8F] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-100">Current Plan</p>
              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{currentPlan}</h2>
              <p className="mt-1 text-sm text-blue-100">$149 / month · Renews July 15, 2025</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon icon="ri:vip-crown-line" className="text-white text-2xl" aria-hidden />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-blue-100">Companies</p>
              <p className="mt-1 text-base font-bold text-white">10 / 25</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-blue-100">Scans / month</p>
              <p className="mt-1 text-base font-bold text-white">847 / 2,000</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-blue-100">Storage</p>
              <p className="mt-1 text-base font-bold text-white">12.4 / 50 GB</p>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0A3D8F] transition hover:bg-slate-100"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Payment method card (matches screenshot layout) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-white">
            <div className="flex items-center gap-2">
              <Icon icon="ri:bank-card-line" className="text-[#0A3D8F] text-lg" aria-hidden />
              <p className="text-sm font-semibold text-slate-900">Payment Method</p>
            </div>
            <button
              type="button"
              className="cursor-pointer text-xs font-semibold text-[#0A3D8F] hover:text-[#083170]"
            >
              Add New
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-[#0F2A5A]">
                  <span className="text-[10px] font-bold tracking-wide text-white">VISA</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Visa ending in 4242</p>
                  <p className="mt-1 text-xs text-slate-500">Expires 08/2027</p>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#2F8F3A]">
                Default
              </span>
            </div>
          </div>
        </div>

        {/* Billing history card (matches screenshot list + dividers) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4">
            <Icon icon="ri:receipt-line" className="text-[#0A3D8F] text-base" aria-hidden />
            <p className="text-sm font-semibold text-slate-900">Billing History</p>
          </div>

          <div className="divide-y divide-slate-200">
            {[
              { id: 'INV-2025-006', date: 'Jun 15, 2025' },
              { id: 'INV-2025-005', date: 'May 15, 2025' },
              { id: 'INV-2025-004', date: 'Apr 15, 2025' },
              { id: 'INV-2025-003', date: 'Mar 15, 2025' },
            ].map((row) => (
              <div key={row.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.id}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.date}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <p className="text-sm font-bold text-slate-900">$149.00</p>
                    <span className="inline-flex w-fit rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#2F8F3A]">
                      Paid
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0A3D8F] hover:text-[#083170]"
                    >
                      <Icon icon="ri:download-line" className="text-base" aria-hidden />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
