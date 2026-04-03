"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { Cheque } from '../../../../mocks/cheques';

interface ChequeRowProps {
  cheque: Cheque;
  selected: boolean;
  onSelect: (id: number) => void;
  onOpen: () => void;
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

export default function ChequeRow({ cheque, selected, onSelect, onOpen }: ChequeRowProps) {
  const [starred, setStarred] = useState(cheque.starred);
  const [flagged, setFlagged] = useState(cheque.flagged);
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cheque.amount);

  return (
    <div
      onClick={onOpen}
      className={`flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group ${selected ? 'bg-[#EFF6FF]' : ''}`}
    >
      {/* Checkbox + star + flag */}
      <div className="flex items-center gap-1.5 w-[78px] flex-shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(cheque.id)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setStarred(!starred); }}
          className={`w-4 h-4 flex items-center justify-center cursor-pointer transition ${starred ? 'text-[#FBBF24]' : 'text-gray-300 hover:text-[#FBBF24]'}`}
        >
          <Icon icon={starred ? 'ri:star-fill' : 'ri:star-line'} className="text-sm" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setFlagged(!flagged); }}
          className={`w-4 h-4 flex items-center justify-center cursor-pointer transition ${flagged ? 'text-[#94A3B8]' : 'text-gray-300 hover:text-[#CBD5E1]'}`}
        >
          <Icon icon={flagged ? 'ri-bookmark-fill' : 'ri-bookmark-line'} className="text-sm" />
        </button>
      </div>

      {/* Avatar */}
      <div className="w-[36px] flex-shrink-0 mr-3">
        <div className={`w-9 h-9 rounded-full ${cheque.companyColor} flex items-center justify-center text-white font-semibold text-sm`}>
          {cheque.companyInitial}
        </div>
      </div>

      {/* Company Name */}
      <div className="w-[180px] flex-shrink-0 mr-4">
        <span className="text-sm font-semibold text-gray-700 truncate block">{cheque.company}</span>
      </div>

      {/* Status badge */}
      <div className="w-[110px] flex-shrink-0 mr-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyles[cheque.status]}`}>
          {cheque.status}
        </span>
      </div>

      {/* Bank + cheque number */}
      <div className="w-[170px] flex-shrink-0 mr-2">
        <span className="text-sm font-medium text-slate-700 truncate block">
          {cheque.bankName} - {cheque.chequeNumber}
        </span>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0 mr-3 flex items-center">
        <span className="text-sm text-slate-400 truncate block">- {cheque.description}</span>
      </div>

      {/* Amount */}
      <div className="w-[95px] flex-shrink-0 mr-4 text-right">
        <span className="text-sm font-bold text-slate-700">{formattedAmount}</span>
      </div>

      {/* Bank icon */}
      <div className="w-[28px] flex-shrink-0 mr-3 flex items-center justify-center text-slate-300">
        <Icon icon="ri:bank-line" className="text-sm" />
      </div>

      {/* Recipient */}
      <div className="w-[130px] flex-shrink-0 mr-3">
        <span className="text-xs text-slate-500 truncate block">{cheque.recipient}</span>
      </div>

      {/* Time */}
      <div className="w-[70px] flex-shrink-0 text-right">
        <span className="text-xs text-slate-500 whitespace-nowrap">{cheque.time}</span>
      </div>
    </div>
  );
}
