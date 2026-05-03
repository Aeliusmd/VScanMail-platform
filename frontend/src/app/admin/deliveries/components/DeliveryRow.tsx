"use client";

import { Icon } from '@iconify/react';
import { useMemo } from 'react';

type DeliveryRequest = {
  id: string;
  starred: boolean;
  read: boolean;
  company: string;
  tag?: string;
  tagColor?: string;
  mailSubject: string;
  addressShort: string;
  courier: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Failed';
  requestedBy: string;
  timeShort: string;
};

interface DeliveryRowProps {
  request: DeliveryRequest;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpen: () => void;
}

export default function DeliveryRow({
  request,
  selected,
  onSelect,
  onToggleStar,
  onOpen,
}: DeliveryRowProps) {
  const statusStyles = useMemo(() => {
    const map: Record<DeliveryRequest['status'], string> = {
      Pending: 'bg-amber-100 text-amber-700',
      'In Transit': 'bg-blue-100 text-blue-700',
      Delivered: 'bg-green-100 text-[#2F8F3A]',
      Failed: 'bg-red-100 text-red-700',
    };
    return map;
  }, []);

  return (
    <div
      onClick={onOpen}
      className={`w-full min-w-0 flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group ${
        selected ? 'bg-[#EFF6FF]' : ''
      }`}
    >
      {/* Checkbox + star + important */}
      <div className="flex items-center gap-1.5 w-[78px] flex-shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(request.id)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(request.id);
          }}
          className={`w-4 h-4 flex items-center justify-center cursor-pointer transition ${
            request.starred ? 'text-[#FBBF24]' : 'text-gray-300 hover:text-[#FBBF24]'
          }`}
        >
          <Icon icon={request.starred ? 'ri:star-fill' : 'ri:star-line'} className="text-sm" />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 flex items-center justify-center cursor-pointer transition text-gray-300 hover:text-gray-500"
          aria-label="Important"
        >
          <Icon
            icon="ri:bookmark-fill"
            className={`text-sm ${
              request.read ? 'text-slate-300' : 'text-amber-400'
            }`}
          />
        </button>
      </div>

      {/* Company avatar */}
      <div className="w-[180px] mr-4 flex-shrink-0 min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {request.company.charAt(0)}
          </div>
          <span className={`text-sm truncate ${request.read ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>
            {request.company}
          </span>
        </div>
      </div>

      {/* Tag + Subject + Address preview */}
      <div className="flex-1 min-w-0 mr-4 flex items-center gap-2">
        {request.tag && request.tagColor && (
          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${request.tagColor}`}>
            {request.tag}
          </span>
        )}
        <span className={`text-sm truncate ${request.read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>
          {request.mailSubject}
        </span>
        <span className="text-sm text-slate-400 truncate hidden xl:block">– {request.addressShort}</span>
      </div>

      {/* Courier badge */}
      <div className="flex items-center mr-4 flex-shrink-0 w-[140px]">
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium whitespace-nowrap truncate max-w-[140px]">
          {request.courier}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center mr-4 flex-shrink-0 w-[120px]">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap truncate max-w-[120px] ${
            statusStyles[request.status]
          }`}
        >
          {request.status}
        </span>
      </div>

      {/* Requested by */}
      <div className="w-[110px] flex-shrink-0 mr-4 hidden lg:block">
        <span className="text-xs text-slate-500 truncate block">{request.requestedBy}</span>
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-right w-[90px]">
        <span
          className={`text-xs truncate block ${
            request.read ? 'text-slate-500' : 'font-bold text-slate-900'
          }`}
        >
          {request.timeShort}
        </span>
      </div>
    </div>
  );
}

