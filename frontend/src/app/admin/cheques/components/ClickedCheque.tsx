"use client";

import { Icon } from '@iconify/react';
import type { UiCheque } from './ChequeRow';
import { chequeApi } from '@/lib/api/cheques';
import { mailApi, type MailItem } from '@/lib/api/mail';
import { useEffect, useMemo, useState } from 'react';
import { ImageLightbox } from '../../components/ImageLightbox';

interface ClickedChequeProps {
  cheque: UiCheque;
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
  const [mailItem, setMailItem] = useState<MailItem | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setMailItem(null);
    setImgIndex(0);

    if (!cheque.mailItemId) return;

    mailApi
      .getById(cheque.mailItemId)
      .then((res) => {
        if (!alive) return;
        setMailItem(res);
      })
      .catch(() => {
        if (!alive) return;
        setMailItem(null);
      });

    return () => {
      alive = false;
    };
  }, [cheque.mailItemId]);

  const images = useMemo(() => {
    // For the cheques popup, only show cheque scan images (inside content pages),
    // not the envelope images.
    const inside = mailItem?.content_scan_urls?.filter(Boolean) ?? [];
    return inside as string[];
  }, [mailItem]);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cheque.amount);

  const typeClassification =
    cheque.raw?.typeClassification ||
    cheque.raw?.ai_raw_result?.type_classification;

  const rawChequeType: string =
    cheque.chequeType ||
    typeClassification?.type ||
    cheque.raw?.cheque_type ||
    cheque.raw?.chequeType ||
    "unknown";

  // GPT-4o sometimes returns "unknown" conservatively even for clean cheques.
  // If confidence is high and no return indicators were found, treat it as original.
  const chequeType: "original" | "returned" | "unknown" =
    rawChequeType === "returned"
      ? "returned"
      : rawChequeType === "original"
        ? "original"
        : typeClassification?.confidence >= 0.7 && !typeClassification?.indicators?.length
          ? "original"
          : "unknown";

  const scanLabel = `CHQ-${cheque.id.slice(0, 8)} • ${cheque.chequeNumber} • ${cheque.time}`;

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
            {images.length > 0 ? (
              <div className="relative">
                <img
                  src={images[imgIndex]}
                  alt={`Scan ${imgIndex + 1}`}
                  className="w-full h-[140px] sm:h-[180px] object-contain bg-white rounded-lg"
                  onClick={() => setLightboxOpen(true)}
                  style={{ cursor: "zoom-in" }}
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center cursor-pointer"
                  aria-label="Open full image"
                >
                  <Icon icon="ri:fullscreen-line" className="text-lg" />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setImgIndex((p) => (p > 0 ? p - 1 : images.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center cursor-pointer"
                    >
                      <Icon icon="ri:arrow-left-s-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgIndex((p) => (p < images.length - 1 ? p + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center cursor-pointer"
                    >
                      <Icon icon="ri:arrow-right-s-line" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {imgIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-[140px] sm:h-[180px] rounded-lg bg-white flex items-center justify-center text-slate-400 text-sm">
                No scan images available
              </div>
            )}
          </div>
 
          <ImageLightbox
            open={lightboxOpen}
            images={images}
            index={imgIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setImgIndex((p) => (p > 0 ? p - 1 : images.length - 1))}
            onNext={() => setImgIndex((p) => (p < images.length - 1 ? p + 1 : 0))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-[#EEF2F7] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-[#64748B] mb-2">Recipient Company</p>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${cheque.companyColor} flex items-center justify-center text-white text-xs font-bold`}>
                  {cheque.companyInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B] leading-4">{cheque.recipient}</p>
                  {cheque.email ? <p className="text-xs text-[#64748B] mt-1">{cheque.email}</p> : null}
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
            <p className="text-sm text-[#475569] leading-7">
              {cheque.description}
            </p>
            <div className="mt-4 pt-4 border-t border-[#C8D8F2]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2">Cheque Type</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {chequeType === "original" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-600 text-green-700 bg-white">
                    <Icon icon="ri:file-check-line" className="text-sm" /> Original Cheque
                  </span>
                ) : chequeType === "returned" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600 text-white">
                    <Icon icon="ri:arrow-go-back-line" className="text-sm" /> Returned Cheque
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                    <Icon icon="ri:question-line" className="text-sm" /> Not Classified
                  </span>
                )}
                {typeClassification?.confidence != null && (
                  <span className="text-xs text-[#64748B]">
                    {Math.round(typeClassification.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              {typeClassification?.reasoning && (
                <p className="text-sm text-[#475569] leading-6">{typeClassification.reasoning}</p>
              )}
              {chequeType === "returned" && Array.isArray(typeClassification?.indicators) && typeClassification.indicators.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {typeClassification.indicators.map((indicator: string, i: number) => (
                    <li key={i} className="text-xs text-[#64748B] flex items-start gap-1.5">
                      <span className="text-[#94A3B8]">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[#94A3B8]">
              <Icon icon="ri:shield-check-line" className="text-xs" />
              <span className="text-xs">Generated by VScan AI</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={async () => {
                try {
                  await chequeApi.resend(cheque.id);
                } catch {
                  // swallow — UI already has notifications elsewhere
                }
              }}
              className="w-full sm:flex-1 h-11 rounded-lg bg-[#0A3D8F] hover:bg-[#083170] text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Icon icon="ri:send-plane-line" className="text-sm" />
              Resend Email
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto sm:min-w-[6.5rem] h-11 px-5 rounded-lg bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#475569] text-sm font-semibold transition cursor-pointer"
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
