"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';

type Deposit = {
  id: number;
  starred: boolean;
  flagged: boolean;
  company: string;
  companyColor: string;
  companyInitial: string;
  priority: 'Urgent' | 'Normal' | 'Low';
  bankName: string;
  bankCode: string;
  requestedBy: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
  time: string;
};

interface DepositRowProps {
  deposit: Deposit;
  selected: boolean;
  onSelect: (id: number) => void;
  onOpen: () => void;
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-[#FEF3C7] text-[#B45309]',
  Approved: 'bg-[#DCFCE7] text-[#2F8F3A]',
  Rejected: 'bg-[#FEE2E2] text-[#B91C1C]',
  Review: 'bg-[#F1F5F9] text-[#475569]',
};

const priorityStyles: Record<string, string> = {
  Urgent: 'bg-[#FEE2E2] text-[#B91C1C]',
  Normal: 'bg-[#E0E7FF] text-[#3730A3]',
  Low: 'bg-[#F0FDF4] text-[#166534]',
};

export default function DepositRow({ deposit, selected, onSelect, onOpen }: DepositRowProps) {
  const [starred, setStarred] = useState(deposit.starred);
  const [flagged, setFlagged] = useState(deposit.flagged);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(deposit.amount);

  return (
    <div
      onClick={onOpen}
      className={`w-full min-w-0 flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group ${selected ? 'bg-[#EFF6FF]' : ''}`}
    >
      {/* Checkbox + star + flag */}
      <div className="flex items-center gap-1.5 w-[78px] flex-shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(deposit.id)}
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
        <div className={`w-9 h-9 rounded-full ${deposit.companyColor} flex items-center justify-center text-white font-semibold text-sm`}>
          {deposit.companyInitial}
        </div>
      </div>

      {/* Company Name */}
      <div className="w-[180px] mr-4 min-w-[120px]">
        <span className="text-sm font-semibold text-gray-700 truncate block min-w-0">{deposit.company}</span>
      </div>

      {/* Priority badge */}
      <div className="w-[80px] mr-4 min-w-[70px]">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap text-center block ${priorityStyles[deposit.priority]}`}>
          {deposit.priority}
        </span>
      </div>

      {/* Bank + Code */}
      <div className="w-[140px] mr-4 min-w-[110px]">
        <span className="text-sm font-medium text-slate-700 truncate block min-w-0">
          {deposit.bankName} - {deposit.bankCode}
        </span>
      </div>
      {/* Requested by */}
      <div className="flex-1 min-w-[120px] mr-3">
        <span className="text-sm font-medium text-slate-700 truncate block min-w-0">
          Requested by {deposit.requestedBy}
        </span>
      </div>

      {/* Amount */}
      <div className="w-[95px] mr-4 min-w-[70px] text-right">
        <span className="text-sm font-bold text-slate-700 min-w-0">{formattedAmount}</span>
      </div>

      

      {/* Status badge */}
      <div className="w-[90px] mr-4 min-w-[70px]">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap text-center block ${statusStyles[deposit.status]}`}>
          {deposit.status}
        </span>
      </div>

      {/* Name before time */}
      <div className="w-[80px] min-w-[60px] text-right">
        <span className="text-sm font-medium text-slate-700 truncate block min-w-0">
          {deposit.requestedBy}
        </span>
      </div>

      {/* Time */}
      <div className="w-[80px] min-w-[60px] text-right">
        <span className="text-sm text-slate-400 min-w-0">{deposit.time}</span>
      </div>
    </div>
  );
}
