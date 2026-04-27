"use client";

import { useState } from "react";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";

interface ClickedDeliveryProps {
  request: DeliveryDto;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  readOnly?: boolean;
}

function statusMeta(status: DeliveryDto["status"]): { label: string; className: string } {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
    case "approved":
      return { label: "Approved", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" };
    case "in_transit":
      return { label: "In Transit", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" };
    case "delivered":
      return { label: "Delivered", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
    case "rejected":
      return { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" };
    default:
      return { label: "—", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" };
  }
}

function sourceMeta(sourceType: DeliveryDto["sourceType"]): { label: string; className: string } {
  if (sourceType === "cheque") return { label: "Cheque", className: "bg-[#0A3D8F]/10 text-[#0A3D8F]" };
  return { label: "Mail", className: "bg-slate-100 text-slate-700" };
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? "font-mono text-[12px]" : ""}`}>{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <div className="mb-1 text-[11px] font-medium text-slate-500">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/15"
      />
    </label>
  );
}

export default function ClickedDelivery({ request, onClose, onUpdated, readOnly }: ClickedDeliveryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(request.trackingNumber || "");
  const [submissionId, setSubmissionId] = useState(request.vSendDocsSubmissionId || "");
  const [submissionNumber, setSubmissionNumber] = useState(request.vSendDocsSubmissionNumber || "");
  const [proofOfServiceUrl, setProofOfServiceUrl] = useState(request.proofOfServiceUrl || "");

  const run = async (fn: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      await fn();
      await onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const s = statusMeta(request.status);
  const src = sourceMeta(request.sourceType);
  const addressLine = [
    request.addressLine1,
    request.addressLine2,
    request.addressCity,
    [request.addressState, request.addressZip].filter(Boolean).join(" "),
    request.addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>{s.label}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${src.className}`}>{src.label}</span>
              <span className="text-[11px] font-mono text-slate-400 truncate">{request.id}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#0A3D8F] to-[#083170] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(request.clientName || request.clientId || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">{request.clientName || request.clientId}</h2>
                <div className="mt-0.5 text-xs text-slate-500 truncate">
                  {request.irn ? `IRN ${request.irn}` : "IRN —"}
                  {request.requestedAt ? ` · Requested ${new Date(request.requestedAt).toLocaleString()}` : ""}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0" aria-label="Close">
            <i className="ri-close-line text-lg text-slate-600" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/60">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Client" value={request.clientName || request.clientId} />
            <Field label="Source" value={src.label} />
            <Field label="Status" value={s.label} />
            <div className="md:col-span-3">
              <Field label="Recipient" value={request.addressName || "—"} />
            </div>
            <div className="md:col-span-3">
              <Field label="Address" value={addressLine || "—"} />
            </div>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" value={request.addressPhone || "—"} />
              <Field label="Email" value={request.addressEmail || "—"} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Fulfillment</div>
                <div className="mt-0.5 text-xs text-slate-500">Enter tracking and optional vSendDocs details. Provide proof URL when delivered.</div>
              </div>
              <div className="text-[11px] text-slate-500">{request.trackingNumber ? "Tracking set" : "No tracking"}</div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="vSendDocs Submission ID" value={submissionId} onChange={setSubmissionId} placeholder="Optional" />
              <Input label="vSendDocs Submission Number" value={submissionNumber} onChange={setSubmissionNumber} placeholder="Optional" />
              <Input label="Tracking Number" value={trackingNumber} onChange={setTrackingNumber} placeholder="Required for In Transit" />
              <Input label="Proof of Service URL" value={proofOfServiceUrl} onChange={setProofOfServiceUrl} placeholder="Required for Delivered" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Decision</div>
            <div className="mt-0.5 text-xs text-slate-500">Reject requires a reason. Approve does not.</div>
            <div className="mt-3">
              <label className="block">
                <div className="mb-1 text-[11px] font-medium text-slate-500">Reject reason</div>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Required to reject this request"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/15"
                />
              </label>
            </div>
          </div>
        </div>

        {readOnly ? (
          <div className="p-5 border-t border-slate-200 bg-white">
            <p className="text-xs text-slate-400 text-center">
              Status: <span className="font-semibold text-slate-700">{s.label}</span> — view only
            </p>
          </div>
        ) : (
          <div className="p-5 border-t border-slate-200 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={loading}
                onClick={() => run(() => deliveriesApi.adminApprove(request.id))}
                className="px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-blue-700 transition"
              >
                Approve
              </button>
              <button
                disabled={loading || !rejectReason.trim()}
                onClick={() => run(() => deliveriesApi.adminReject(request.id, rejectReason))}
                className="px-3 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-rose-700 transition"
              >
                Reject
              </button>
              <button
                disabled={loading || !trackingNumber.trim()}
                onClick={() =>
                  run(() =>
                    deliveriesApi.adminMarkInTransit(request.id, {
                      trackingNumber,
                      submissionId: submissionId || undefined,
                      submissionNumber: submissionNumber || undefined,
                    })
                  )
                }
                className="px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-indigo-700 transition"
              >
                Mark In Transit
              </button>
              <button
                disabled={loading || !proofOfServiceUrl.trim()}
                onClick={() => run(() => deliveriesApi.adminMarkDelivered(request.id, proofOfServiceUrl))}
                className="px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-emerald-700 transition"
              >
                Mark Delivered
              </button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              Actions will refresh the list and close this panel on success.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
