"use client";

import { Icon } from '@iconify/react';
import type { DeliveryRequest } from '../../../../mocks/deliveries';

interface ClickedDeliveryProps {
  request: DeliveryRequest;
  actionFeedback: Record<string, string>;
  onClose: () => void;
  onMarkDelivered: (id: string) => void;
  onResend: (id: string) => void;
}

const statusColors: Record<DeliveryRequest['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700',
  'In Transit': 'bg-blue-100 text-blue-700',
  Delivered: 'bg-green-100 text-[#2F8F3A]',
  Failed: 'bg-red-100 text-red-700',
};

export default function ClickedDelivery({
  request,
  actionFeedback,
  onClose,
  onMarkDelivered,
  onResend,
}: ClickedDeliveryProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
                <Icon icon="ri-truck-line" className="text-[#0A3D8F] text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Delivery Request</h2>
                <p className="text-xs text-slate-500">
                  {request.id} • {request.requestedAt}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <Icon icon="ri-close-line" className="text-slate-600 text-xl" />
            </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
            <div className="w-full h-40 sm:h-52 rounded-xl overflow-hidden border border-slate-200">
              <img
                src={request.thumbnail}
                alt="Delivery document"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Requesting Company</p>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {request.company.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{request.company}</p>
                    <p className="text-xs text-slate-500">{request.companyEmail}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Delivery Status</p>
                <span
                  className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[request.status]}`}
                >
                  {request.status}
                </span>
                <p className="text-xs text-slate-500 mt-2">Requested by {request.requestedBy}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Mail Subject</p>
              <p className="text-sm font-semibold text-slate-900">{request.mailSubject}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Icon icon="ri-map-pin-line" className="text-[#0A3D8F] text-base" />
                <p className="text-xs text-slate-500">Delivery Address</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{request.deliveryAddress}</p>

              {request.recipientName && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Recipient Details</p>
                  <p className="text-sm font-medium text-slate-900">{request.recipientName}</p>
                  {request.recipientPhone && (
                    <p className="text-xs text-slate-500 mt-0.5">{request.recipientPhone}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Courier Service</p>
                <p className="text-sm font-semibold text-slate-900">{request.courier}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                <p className="text-sm font-semibold text-slate-900">{request.trackingNumber}</p>
              </div>
            </div>

            {request.notes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon icon="ri-information-line" className="text-amber-600 text-base" />
                  <h3 className="text-sm font-bold text-amber-900">Notes</h3>
                </div>
                <p className="text-sm text-amber-800">{request.notes}</p>
              </div>
            )}

            <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
              <div className="flex items-center space-x-2 mb-3">
                <Icon icon="ri-sparkling-line" className="text-amber-500 text-lg" />
                <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{request.aiSummary}</p>
              <div className="mt-3 flex items-center space-x-2">
                <Icon icon="ri-robot-line" className="text-[#0A3D8F] text-sm" />
                <span className="text-xs text-slate-400">Generated by VScan AI</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              {(request.status === 'Pending' || request.status === 'In Transit') && (
                <button
                  onClick={() => onMarkDelivered(request.id)}
                  className="flex-1 py-3 bg-[#2F8F3A] text-white font-semibold rounded-lg hover:bg-[#267a30] transition-colors text-sm whitespace-nowrap cursor-pointer"
                >
                  <Icon icon="ri-check-line" className="inline-block mr-2" />
                  {actionFeedback[request.id] === 'delivered'
                    ? 'Marked as Delivered!'
                    : 'Mark as Delivered'}
                </button>
              )}

              <button
                onClick={() => onResend(request.id)}
                className="flex-1 py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                <Icon icon="ri-send-plane-line" className="inline-block mr-2" />
                {actionFeedback[request.id] === 'resent' ? 'Sent!' : 'Resend Email'}
              </button>

              <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer">
                <Icon icon="ri-download-line" className="inline-block mr-2" />
                Download
              </button>

              <button
                onClick={onClose}
                className="px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

