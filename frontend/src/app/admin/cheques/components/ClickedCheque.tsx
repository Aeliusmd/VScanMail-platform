"use client";

import { Icon } from '@iconify/react';
import type { Cheque } from '../../../../mocks/cheques';

interface ClickedChequeProps {
  cheque: Cheque;
  onClose: () => void;
}

const statusStyles: Record<string, string> = {
  'Pending Deposit': 'bg-[#FEF3C7] text-[#B45309]',
  Deposited: 'bg-[#DCFCE7] text-[#2F8F3A]',
  Rejected: 'bg-[#FEE2E2] text-[#B91C1C]',
  'On Hold': 'bg-[#F1F5F9] text-[#475569]',
  Active: 'bg-green-100 text-green-700',
  Pending: 'bg-orange-100 text-orange-600',
  Inactive: 'bg-gray-100 text-gray-600',
};

export default function ClickedCheque({ cheque, onClose }: ClickedChequeProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cheque.amount);

  const scanLabel = `CHQ-${String(cheque.id).padStart(3, '0')} • ${cheque.chequeNumber} • ${cheque.time}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3"
      onClick={onClose}
    >
      <div
        className="bg-[#F8FAFC] rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden border border-[#E2E8F0] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 min-h-0">
        <div className="bg-white px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-[#E2E8F0] sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-[#DBEAFE] rounded-lg">
                <Icon icon="ri:bank-card-line" className="text-[#0A3D8F] text-lg" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-[#0F172A] leading-6">{cheque.bankName} Cheque</h2>
                <p className="text-xs text-[#64748B] mt-1">{scanLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#334155] rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <Icon icon="ri:close-line" className="text-lg" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2 mb-4">
            <img
              src="https://readdy.ai/api/search-image?query=business%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20and%20signature%20lines%20professional%20financial%20instrument%20scanned%20clean&width=160&height=100&seq=chq-thumb-1&orientation=landscape"
              alt="Cheque preview"
              className="w-full h-[140px] sm:h-[180px] object-cover rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-[#EEF2F7] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-[#64748B] mb-2">Recipient Company</p>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${cheque.companyColor} flex items-center justify-center text-white text-xs font-bold`}>
                  {cheque.companyInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B] leading-4">{cheque.recipient}</p>
                  <p className="text-xs text-[#64748B] mt-1">{cheque.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#EEF2F7] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-[#64748B] mb-2">Cheque Amount</p>
              <p className="text-2xl sm:text-4xl font-bold text-[#0A3D8F] leading-none">{formattedAmount}</p>
              <span className={`inline-flex mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[cheque.status]}`}>
                {cheque.status}
              </span>
            </div>

            <div className="bg-[#EEF2F7] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-[#64748B] mb-2">Issuing Bank</p>
              <p className="text-base font-semibold text-[#1E293B] leading-5">{cheque.bankName}</p>
              <p className="text-xs text-[#64748B] mt-1">Cheque No. {cheque.chequeNumber}</p>
            </div>

            <div className="bg-[#EEF2F7] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-[#64748B] mb-2">Payee</p>
              <p className="text-base font-semibold text-[#1E293B] leading-5">{cheque.recipient}</p>
              <p className="text-xs text-[#64748B] mt-1">Scanned: {cheque.time}</p>
            </div>
          </div>

          <div className="bg-[#DCE7F7] rounded-xl p-4 mb-5 border border-[#C8D8F2]">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="ri:sparkling-2-fill" className="text-[#F59E0B]" />
              <p className="text-sm font-semibold text-[#334155]">AI-Generated Summary</p>
            </div>
            <p className="text-sm text-[#475569] leading-7">{cheque.description} Successfully {cheque.status.toLowerCase()} on June 13, 2025. Transaction reference: TXN-2025-{String(cheque.id).padStart(6, '0')}.</p>
            <div className="mt-3 flex items-center gap-1.5 text-[#94A3B8]">
              <Icon icon="ri:shield-check-line" className="text-xs" />
              <span className="text-xs">Generated by VScan AI</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button className="w-full sm:flex-1 h-11 rounded-lg bg-[#0A3D8F] hover:bg-[#083170] text-white text-sm font-semibold flex items-center justify-center gap-2 transition">
              <Icon icon="ri:send-plane-line" className="text-sm" />
              Resend Email
            </button>
            <button className="w-full sm:flex-1 h-11 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] text-sm font-semibold flex items-center justify-center gap-2 transition">
              <Icon icon="ri:download-line" className="text-sm" />
              Download
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-20 h-11 rounded-lg bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#475569] text-sm font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
