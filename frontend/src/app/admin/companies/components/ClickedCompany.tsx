"use client";

import { Icon } from '@iconify/react';
import type { Company } from '@/types/company';
import { usePathname } from 'next/navigation';

interface ClickedCompanyProps {
  company: Company;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDeliveries?: () => void;
  onViewDeposits?: () => void;
}

export default function ClickedCompany({ company, onClose, onEdit, onDelete, onViewDeliveries, onViewDeposits }: ClickedCompanyProps) {
  const pathname = usePathname();
  const canManageOrganizations = pathname.startsWith('/superadmin');
  const planType = company.clientType === 'subscription' ? 'Subscription' : 'Manual';
  const isSubscription = company.clientType === 'subscription';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3" onClick={onClose}>
      <div className="w-full max-w-[640px] max-h-[90vh] bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto flex-1 min-h-0">
        <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-[#E2E8F0] sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${company.avatarColor} text-white font-bold flex items-center justify-center`}>
                {company.initial}
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold leading-6 text-[#0F172A]">{company.name}</h2>
                <p className="text-xs text-[#64748B] mt-1">CMP-{company.id} • Joined {company.joined}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#334155] hover:bg-slate-100 rounded-full transition">
              <Icon icon="ri:close-line" className="text-lg" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className={`rounded-xl p-4 border flex items-center gap-3 ${isSubscription ? 'bg-[#EEF4FF] border-[#C7D7F7]' : 'bg-[#FFF8E7] border-[#F0E0B8]'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSubscription ? 'bg-[#0A3D8F] text-white' : 'bg-[#B45309] text-white'}`}>
                <Icon icon={isSubscription ? 'ri:vip-crown-line' : 'ri:user-add-line'} className="text-lg" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Plan Type</p>
                <p className={`text-base font-semibold leading-5 ${isSubscription ? 'text-[#0A3D8F]' : 'text-[#B45309]'}`}>{planType}</p>
              </div>
            </div>
            <div className="bg-[#EDF7F0] rounded-xl p-4 border border-[#CDE7D2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2F8F3A] text-white flex items-center justify-center">
                <Icon icon="ri:building-line" className="text-lg" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Industry</p>
                <span className={`inline-flex mt-0.5 text-sm px-2 py-0.5 rounded-md font-semibold ${company.industryBadge}`}>{company.industry}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="bg-[#EEF2F7] rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-1">Contact Person</p>
              <p className="text-base font-semibold text-[#1E293B] leading-5">{company.contact}</p>
              <p className="text-xs text-[#64748B] mt-1">{company.email}</p>
            </div>
            <div className="bg-[#EEF2F7] rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-1">Phone</p>
              <p className="text-base font-semibold text-[#1E293B] leading-5">{company.phone}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{company.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#EEF2F7] rounded-xl p-4 border border-[#E2E8F0] mb-3">
            <p className="text-xs text-[#64748B] mb-1">Address</p>
            <p className="text-base font-semibold text-[#1E293B] leading-5">{company.address}</p>
          </div>

          <div className="bg-[#DCE7F7] rounded-xl p-4 border border-[#C8D8F2] mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="ri:sticky-note-line" className="text-[#0A3D8F]" />
              <p className="text-sm font-semibold text-[#334155]">Notes</p>
            </div>
            <p className="text-sm text-[#475569] leading-6">{company.notes}</p>
          </div>

          <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-5">
            <Icon icon="ri:time-line" className="text-xs" />
            <span>Last activity: {company.lastActivity}</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={onViewDeliveries} className="h-11 rounded-lg bg-[#0A3D8F] hover:bg-[#083170] text-white text-sm font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap">
                <Icon icon="ri:truck-line" className="text-base" />
                View Deliveries
              </button>
              <button onClick={onViewDeposits} className="h-11 rounded-lg bg-[#2F8F3A] hover:bg-[#267531] text-white text-sm font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap">
                <Icon icon="ri:exchange-dollar-line" className="text-base" />
                View Deposits
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              {canManageOrganizations && (
                <>
                  <button onClick={onEdit} className="w-full sm:flex-1 h-11 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] text-sm font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap">
                    <Icon icon="ri:edit-line" className="text-sm" />
                    Edit
                  </button>
                  <button onClick={onDelete} className="w-full sm:flex-1 h-11 rounded-lg border border-[#FCA5A5] hover:bg-red-50 text-[#B91C1C] text-sm font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap">
                    <Icon icon="ri:delete-bin-line" className="text-sm" />
                    Delete
                  </button>
                </>
              )}
              <button onClick={onClose} className="w-full sm:flex-1 h-11 rounded-lg bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#475569] text-sm font-semibold transition whitespace-nowrap">
                Close
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
