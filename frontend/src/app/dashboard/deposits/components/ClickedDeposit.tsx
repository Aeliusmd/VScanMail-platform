"use client";

import { useState } from 'react';
import type { Deposit } from '@/types/deposit';

interface ClickedDepositProps {
  deposit: Deposit;
  onClose: () => void;
}

export default function ClickedDeposit({ deposit, onClose }: ClickedDepositProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(deposit.amount);

  const statusColors: Record<Deposit['status'], string> = {
    Pending: 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]',
    Approved: 'bg-[#DCFCE7] text-[#2F8F3A] border border-[#86EFAC]',
    Rejected: 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]',
    Review: 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]',
  };

  const companyEmail = `${deposit.company.replace(/\s+/g, '').toLowerCase()}@example.com`;
  const chequeNumber = `#${1000 + deposit.id}`;
  const aiSummary = `Automated review: ${deposit.status} request for ${deposit.company}. Verify bank details and approve once all fields look consistent.`;

  const thumbnailSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0A3D8F" stop-opacity="0.15"/>
          <stop offset="1" stop-color="#0A3D8F" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#g)"/>
      <rect x="60" y="70" width="1080" height="260" rx="22" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="120" y="210" font-family="Arial" font-size="44" fill="#94A3B8" font-weight="700">Deposit Document</text>
      <text x="120" y="265" font-family="Arial" font-size="22" fill="#64748B">${deposit.company}</text>
    </svg>
  `);

  const [actionFeedback, setActionFeedback] = useState<
    Record<number, 'approved' | 'rejected' | 'resent' | undefined>
  >({});

  const handleApprove = (id: number) => {
    setActionFeedback((prev) => ({ ...prev, [id]: 'approved' }));
  };

  const handleReject = (id: number) => {
    setActionFeedback((prev) => ({ ...prev, [id]: 'rejected' }));
  };

  const handleResend = (id: number) => {
    setActionFeedback((prev) => ({ ...prev, [id]: 'resent' }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
              <i className="ri-exchange-dollar-line text-[#0A3D8F] text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Deposit Request</h2>
              <p className="text-xs text-slate-500">
                {deposit.id} • {deposit.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-slate-600 text-xl" />
          </button>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="w-full h-40 sm:h-52 rounded-xl overflow-hidden border border-slate-200">
              <img
                src={`data:image/svg+xml;charset=utf-8,${thumbnailSvg}`}
                alt="Cheque document"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Requesting Company</p>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {deposit.company.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{deposit.company}</p>
                  <p className="text-xs text-slate-500">{companyEmail}</p>
                </div>
              </div>
            </div>

              <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Deposit Amount</p>
              <p className="text-2xl font-bold text-[#0A3D8F]">{formattedAmount}</p>
              <span
                className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[deposit.status]}`}
              >
                {deposit.status}
              </span>
            </div>

              <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Bank Details</p>
              <p className="text-sm font-semibold text-slate-900">{deposit.bankName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Cheque No. {chequeNumber}</p>
            </div>

              <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Requested By</p>
              <p className="text-sm font-semibold text-slate-900">{deposit.requestedBy}</p>
              <p className="text-xs text-slate-500 mt-0.5">{deposit.time}</p>
            </div>
          </div>

            <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
              <div className="flex items-center space-x-2 mb-3">
                <i className="ri-sparkling-line text-amber-500 text-lg"></i>
                <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
              <div className="mt-3 flex items-center space-x-2">
                <i className="ri-robot-line text-[#0A3D8F] text-sm"></i>
                <span className="text-xs text-slate-400">Generated by VScan AI</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 pt-1">
              {deposit.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleApprove(deposit.id)}
                    className="w-full sm:flex-1 min-w-[170px] py-3.5 px-4 bg-[#2F8F3A] text-white font-semibold rounded-lg hover:bg-[#267a30] transition-colors text-xs whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-check-line mr-2"></i>
                    {actionFeedback[deposit.id] === 'approved' ? 'Approved!' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => handleReject(deposit.id)}
                    className="w-full sm:flex-1 min-w-[170px] py-3.5 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-xs whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-close-line mr-2"></i>
                    {actionFeedback[deposit.id] === 'rejected' ? 'Rejected!' : 'Reject Request'}
                  </button>
                </>
              )}

              <button
                onClick={() => handleResend(deposit.id)}
                className="w-full sm:flex-1 min-w-[170px] py-3.5 px-4 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-xs whitespace-nowrap cursor-pointer"
              >
                <i className="ri-send-plane-line mr-2"></i>
                {actionFeedback[deposit.id] === 'resent' ? 'Sent!' : 'Resend Email'}
              </button>
              <button className="w-full sm:flex-1 min-w-[170px] py-3.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs whitespace-nowrap cursor-pointer">
                <i className="ri-download-line mr-2"></i>Download
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer"
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
