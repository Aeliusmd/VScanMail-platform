"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function BillingPlanPage() {
  const [currentPlan] = useState('Business Pro');

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Billing Plan</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your subscription and payment details.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="rounded-2xl overflow-hidden bg-[#0A3D8F] border border-[#0A3D8F] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-blue-100 font-semibold">Current Plan</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{currentPlan}</h2>
              <p className="text-sm text-blue-100 mt-1">
                $149 / month · Renews July 15, 2025
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <Icon icon="ri:wallet-3-line" className="text-white text-xl" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-blue-100">Companies</p>
              <p className="text-base font-bold text-white mt-1">10 / 25</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-blue-100">Scanning</p>
              <p className="text-base font-bold text-white mt-1">847 / 2,000</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-blue-100">Storage</p>
              <p className="text-base font-bold text-white mt-1">12.4 / 50 GB</p>
            </div>
          </div>

          <div className="mt-5">
            <button className="px-5 py-2.5 rounded-lg bg-white text-[#0A3D8F] font-semibold text-sm hover:bg-slate-100 transition cursor-pointer">
              Upgrade Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-900">Payment Method</p>
              <button className="text-xs font-semibold text-[#0A3D8F] hover:text-[#083170] cursor-pointer">
                Add New
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Icon icon="ri-credit-card-line" className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Visa ending in 4242</p>
                  <p className="text-xs text-slate-500 mt-1">Expires 08/2027</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#2F8F3A]">
                Default
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-900 mb-4">Billing History</p>

            <div className="space-y-3">
              {['INV-2025-006', 'INV-2025-005', 'INV-2025-004', 'INV-2025-003'].map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{id}</p>
                    <p className="text-xs text-slate-500 mt-1">May 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">$149.00</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                        Paid
                      </span>
                      <button className="text-xs text-[#0A3D8F] hover:text-[#083170] cursor-pointer">
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
    </div>
  );
}

