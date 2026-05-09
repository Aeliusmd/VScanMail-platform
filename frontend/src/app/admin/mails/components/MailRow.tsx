"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { resolveAvatarUrl } from '@/lib/resolve-avatar-url';

type MailRowData = {
  id: string;
  sender: string;
  senderInitial?: string;
  senderColor?: string;
  company?: string;
  companyAvatarUrl?: string | null;
  subject: string;
  preview: string;
  tag: string;
  time: string;
  rowDetail?: string;
  hasAttachment?: boolean;
  starred?: boolean;
  flagged?: boolean;
  archiveBox?: string;
};

interface MailRowProps {
  mail: MailRowData;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick?: () => void;
  showArchiveMeta?: boolean;
  showUnarchive?: boolean;
  onUnarchive?: () => void;
}

const tagStyles: Record<string, string> = {
  Inbox: 'bg-[#DBEAFE] text-[#1E40AF]',
  Delivered: 'bg-green-100 text-green-700',
  Pending: 'bg-orange-100 text-orange-600',
  Processed: 'bg-[#DBEAFE] text-[#1E40AF]',
  Scanned: 'bg-orange-100 text-orange-600',
  Received: 'bg-gray-100 text-gray-700',
};

export default function MailRow({
  mail,
  selected,
  onSelect,
  onClick,
  showArchiveMeta = false,
  showUnarchive = false,
  onUnarchive,
}: MailRowProps) {
  const [starred, setStarred] = useState(mail.starred || false);
  const [flagged, setFlagged] = useState(mail.flagged || false);
  const avatarSrc = resolveAvatarUrl(mail.companyAvatarUrl);
  const senderInitial = mail.senderInitial || (mail.sender ? mail.sender.charAt(0).toUpperCase() : '?');
  const senderColor = mail.senderColor || 'bg-blue-600';

  return (
    <div
      onClick={onClick}
      className={`flex flex-wrap sm:flex-nowrap items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer group min-w-0 overflow-hidden ${
        selected ? 'bg-[#EFF6FF]' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 w-[78px] flex-shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(mail.id)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setStarred(!starred);
          }}
          className={`w-4 h-4 flex items-center justify-center cursor-pointer transition ${starred ? 'text-[#FBBF24]' : 'text-gray-300 hover:text-[#FBBF24]'}`}
        >
          <Icon icon={starred ? 'ri:star-fill' : 'ri:star-line'} className="text-sm" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFlagged(!flagged);
          }}
          className={`w-4 h-4 flex items-center justify-center cursor-pointer transition ${flagged ? 'text-[#94A3B8]' : 'text-gray-300 hover:text-[#CBD5E1]'}`}
        >
          <Icon icon={flagged ? 'ri:bookmark-fill' : 'ri:bookmark-line'} className="text-sm" />
        </button>
      </div>

      <div className="w-[36px] flex-shrink-0 mr-3">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={mail.sender}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full ${senderColor} flex items-center justify-center text-white font-semibold text-sm`}>
            {senderInitial}
          </div>
        )}
      </div>

      <div className="w-full sm:w-[180px] min-w-0 sm:flex-shrink-0 mr-0 sm:mr-4 mt-2 sm:mt-0">
        <span className="text-sm font-semibold text-gray-700 truncate block">{mail.sender}</span>
      </div>

      <div className="w-auto sm:w-[110px] flex-shrink-0 mr-2 mt-2 sm:mt-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${tagStyles[mail.tag] || tagStyles.Received}`}>
          {mail.tag}
        </span>
      </div>

      <div className="w-full sm:w-[170px] min-w-0 sm:flex-shrink-0 mr-0 sm:mr-2 mt-2 sm:mt-0">
        <span className="text-sm font-medium text-slate-700 truncate block">{mail.subject}</span>
        {showArchiveMeta && mail.archiveBox && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1 inline-flex">
            Box {mail.archiveBox}
          </span>
        )}
      </div>

      <div className="w-full sm:flex-1 min-w-0 mr-0 sm:mr-3 mt-2 sm:mt-0 flex items-center gap-2">
        <span className="text-sm text-slate-400 truncate block">- {mail.preview}</span>
        {mail.hasAttachment && (
          <Icon icon="ri:attachment-2" className="text-sm text-slate-300 flex-shrink-0" />
        )}
      </div>

      <div className="w-auto sm:w-[130px] min-w-0 flex-shrink-0 mr-2 sm:mr-3 mt-2 sm:mt-0">
        <span className="text-xs text-slate-500 truncate block">{mail.rowDetail || mail.company || mail.sender}</span>
      </div>

      <div className="w-auto sm:w-[70px] flex-shrink-0 text-right mt-2 sm:mt-0">
        <span className="text-xs text-slate-500 whitespace-nowrap">{mail.time}</span>
      </div>

      {showUnarchive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnarchive?.();
          }}
          className="text-xs text-slate-500 hover:text-[#0A3D8F] px-2 py-1 rounded hover:bg-[#0A3D8F]/10 transition-colors cursor-pointer whitespace-nowrap ml-2"
        >
          Unarchive
        </button>
      )}
    </div>
  );
}
