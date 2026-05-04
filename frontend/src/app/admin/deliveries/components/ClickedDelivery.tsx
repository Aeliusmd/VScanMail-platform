"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";

interface ClickedDeliveryProps {
  request: DeliveryDto;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  readOnly?: boolean;
}

function statusMeta(status: DeliveryDto["status"]): {
  label: string;
  className: string;
  step: number;
} {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", step: 1 };
    case "approved":
      return { label: "Approved", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", step: 2 };
    case "in_transit":
      return { label: "In Transit", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", step: 3 };
    case "delivered":
      return { label: "Delivered", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", step: 4 };
    case "rejected":
      return { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", step: 0 };
    case "cancelled":
      return { label: "Cancelled", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", step: 0 };
    default:
      return { label: "—", className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", step: 0 };
  }
}

function sourceMeta(sourceType: DeliveryDto["sourceType"]): { label: string; className: string } {
  if (sourceType === "cheque") return { label: "Cheque", className: "bg-[#0A3D8F]/10 text-[#0A3D8F]" };
  return { label: "Mail", className: "bg-slate-100 text-slate-700" };
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-900 break-all ${mono ? "font-mono text-[12px]" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  optional,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        {label}
        {optional && <span className="text-slate-400 font-normal">(optional)</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/15"
      />
      {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
    </label>
  );
}

function flattenVsendocsSuggestions(suggestions: unknown): any[] {
  if (!Array.isArray(suggestions)) return [];
  const out: any[] = [];
  for (const item of suggestions) {
    if (!item) continue;
    if (Array.isArray((item as any).suggestions)) out.push(...(item as any).suggestions);
    else if ((item as any).addressLine1 || (item as any).city || (item as any).zipCode) out.push(item);
  }
  return out;
}

const WORKFLOW_STEPS = [
  { step: 1, label: "Pending" },
  { step: 2, label: "Approved" },
  { step: 3, label: "In Transit" },
  { step: 4, label: "Delivered" },
];

export default function ClickedDelivery({ request, onClose, onUpdated, readOnly }: ClickedDeliveryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(request.trackingNumber || "");
  const [submissionId, setSubmissionId] = useState(request.vSendDocsSubmissionId || "");
  const [submissionNumber, setSubmissionNumber] = useState(request.vSendDocsSubmissionNumber || "");
  const [proofOfServiceUrl, setProofOfServiceUrl] = useState(request.proofOfServiceUrl || "");

  const [vsendocsFile, setVsendocsFile] = useState<File | null>(null);
  const [vsendocsFilePreview, setVsendocsFilePreview] = useState<string | null>(null);
  const [vsendocsPostType, setVsendocsPostType] = useState<
    "Standard" | "Do not include POS" | "EAMS POS" | "Detailed POS"
  >("Standard");
  const [vsendocsExpress, setVsendocsExpress] = useState(false);
  const [vsendocsDuplex, setVsendocsDuplex] = useState(false);
  const [vsendocsLoading, setVsendocsLoading] = useState(false);
  const [vsendocsMsg, setVsendocsMsg] = useState<string | null>(null);
  const [vsendocsErr, setVsendocsErr] = useState<any>(null);
  const [vsendocsStatus, setVsendocsStatus] = useState<{
    status: string;
    deliveryStatus: string;
    logs: any[];
  } | null>(null);

  const hasAddressData = !!(request.addressLine1 || request.addressName);
  const [showSubmissionAddress, setShowSubmissionAddress] = useState(hasAddressData);
  const [overrideName, setOverrideName] = useState(request.addressName || "");
  const [overrideLine1, setOverrideLine1] = useState(request.addressLine1 || "");
  const [overrideLine2, setOverrideLine2] = useState(request.addressLine2 || "");
  const [overrideCity, setOverrideCity] = useState(request.addressCity || "");
  const [overrideState, setOverrideState] = useState(request.addressState || "");
  const [overrideZip, setOverrideZip] = useState(request.addressZip || "");

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

  const handleFileChange = (file: File | null) => {
    setVsendocsFile(file);
    setVsendocsFilePreview(null);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setVsendocsFilePreview(String(e.target?.result || ""));
      reader.readAsDataURL(file);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => {
        const result = String(reader.result || "");
        const idx = result.indexOf("base64,");
        resolve(idx >= 0 ? result.slice(idx + "base64,".length) : result);
      };
      reader.readAsDataURL(file);
    });

  const submitToVSendDocs = async () => {
    setVsendocsMsg(null);
    setVsendocsErr(null);
    setVsendocsStatus(null);
    if (!vsendocsFile) return;

    setVsendocsLoading(true);
    try {
      const fileContent = await readFileAsBase64(vsendocsFile);
      const res = await deliveriesApi.adminVSendDocsSubmit(request.id, {
        fileContent,
        fileName: vsendocsFile.name || "document.pdf",
        postType: vsendocsPostType,
        expressDelivery: vsendocsExpress,
        duplexPrint: vsendocsDuplex,
        addressName: overrideName,
        addressLine1: overrideLine1,
        addressLine2: overrideLine2 || undefined,
        addressCity: overrideCity,
        addressState: overrideState,
        addressZip: overrideZip,
      });

      setSubmissionId(res.submissionId);
      setSubmissionNumber(res.submissionNumber);
      setVsendocsMsg(`Submitted — Submission #${res.submissionNumber}`);

      // Auto-fill proof URL with the app's POS endpoint so "Mark Delivered" works after vSendDocs processes
      if (!proofOfServiceUrl && typeof window !== "undefined") {
        setProofOfServiceUrl(
          `${window.location.origin}/api/admin/deliveries/${request.id}/vsendocs/pos`
        );
      }

      await onUpdated();
    } catch (err: any) {
      const message = err?.message || "Failed to submit to vSendDocs.";
      setVsendocsMsg(null);
      const details = err instanceof ApiError ? err.details : err?.payload ?? err;
      setVsendocsErr(details);
      setError(message);
    } finally {
      setVsendocsLoading(false);
    }
  };

  const checkVSendDocsStatus = async () => {
    setVsendocsMsg(null);
    setVsendocsErr(null);
    setVsendocsLoading(true);
    try {
      const res = await deliveriesApi.adminVSendDocsStatus(request.id);
      setVsendocsStatus(res);
    } catch (err: any) {
      const details = err instanceof ApiError ? err.details : err?.payload ?? err;
      setVsendocsErr(details);
      setError(err?.message || "Failed to check vSendDocs status.");
    } finally {
      setVsendocsLoading(false);
    }
  };

  // Status-based button permission
  const canApprove = request.status === "pending";
  const canReject = request.status === "pending";
  const canMarkInTransit = request.status === "approved" && trackingNumber.trim().length >= 2;
  const canMarkDelivered =
    (request.status === "approved" || request.status === "in_transit") &&
    proofOfServiceUrl.trim().length > 0;

  const approveDisabledReason = !canApprove
    ? request.status === "approved"
      ? "Already approved"
      : `Cannot approve when status is "${s.label}"`
    : undefined;

  const rejectDisabledReason = !canReject
    ? `Cannot reject when status is "${s.label}"`
    : !rejectReason.trim()
    ? "Enter a reject reason above"
    : undefined;

  const inTransitDisabledReason = !canMarkInTransit
    ? request.status !== "approved"
      ? `Must be Approved first (currently "${s.label}")`
      : "Enter a tracking number above (min 2 chars)"
    : undefined;

  const deliveredDisabledReason = !canMarkDelivered
    ? !["approved", "in_transit"].includes(request.status as string)
      ? `Must be Approved or In Transit (currently "${s.label}")`
      : "Enter a proof of service URL above"
    : undefined;

  const activeStep = s.step;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>
                {s.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${src.className}`}>
                {src.label}
              </span>
              <span className="text-[11px] font-mono text-slate-400 truncate">{request.id}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#0A3D8F] to-[#083170] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(request.clientName || request.clientId || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {request.clientName || request.clientId}
                </h2>
                <div className="mt-0.5 text-xs text-slate-500 truncate">
                  {request.irn ? `IRN ${request.irn}` : "IRN —"}
                  {request.requestedAt
                    ? ` · Requested ${new Date(request.requestedAt).toLocaleString()}`
                    : ""}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
            aria-label="Close"
          >
            <i className="ri-close-line text-lg text-slate-600" />
          </button>
        </div>

        {/* ── Workflow progress bar ── */}
        {activeStep > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-1">
              {WORKFLOW_STEPS.map((ws, i) => (
                <div key={ws.step} className="flex items-center gap-1 flex-1">
                  <div
                    className={`flex items-center gap-1.5 flex-1 ${
                      ws.step <= activeStep ? "text-[#0A3D8F]" : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        ws.step < activeStep
                          ? "bg-[#0A3D8F] text-white"
                          : ws.step === activeStep
                          ? "bg-[#0A3D8F]/10 text-[#0A3D8F] ring-2 ring-[#0A3D8F]/40"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {ws.step < activeStep ? <i className="ri-check-line text-[9px]" /> : ws.step}
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap">{ws.label}</span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 mx-1 ${
                        ws.step < activeStep ? "bg-[#0A3D8F]" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto space-y-4 bg-slate-50/60">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 flex items-start gap-2">
              <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Delivery Details ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-900">Delivery Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoField label="Client" value={request.clientName || request.clientId} />
              <InfoField label="Source" value={src.label} />
              <InfoField label="Status" value={s.label} />
              <div className="md:col-span-3">
                <InfoField label="Recipient" value={request.addressName || "—"} />
              </div>
              <div className="md:col-span-3">
                <InfoField label="Address" value={addressLine || "—"} />
              </div>
              <InfoField label="Phone" value={request.addressPhone || "—"} />
              <div className="md:col-span-2">
                <InfoField label="Email" value={request.addressEmail || "—"} />
              </div>
            </div>
          </div>

          {/* ── Fulfillment ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Fulfillment</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Enter tracking details. After vSendDocs delivery, provide proof URL to mark as delivered.
                </div>
              </div>
              {request.trackingNumber && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">
                  <i className="ri-truck-line mr-1" />
                  {request.trackingNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Tracking Number"
                value={trackingNumber}
                onChange={setTrackingNumber}
                placeholder="Required for In Transit (min 2 chars)"
                hint="Enter carrier tracking number after submitting to vSendDocs."
              />
              <FormInput
                label="Proof of Service URL"
                value={proofOfServiceUrl}
                onChange={setProofOfServiceUrl}
                placeholder="Auto-filled after vSendDocs submit"
                optional
                hint="Auto-filled from vSendDocs POS endpoint after submission."
              />
            </div>

            {(submissionId || submissionNumber) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <FormInput
                  label="vSendDocs Submission ID"
                  value={submissionId}
                  onChange={setSubmissionId}
                  placeholder="Auto-filled after submission"
                  optional
                />
                <FormInput
                  label="vSendDocs Submission Number"
                  value={submissionNumber}
                  onChange={setSubmissionNumber}
                  placeholder="Auto-filled after submission"
                  optional
                />
              </div>
            )}

            {/* ── Submit to vSendDocs ── */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <i className="ri-send-plane-2-line text-[#0A3D8F]" />
                <div className="text-sm font-semibold text-slate-900">Submit to vSendDocs</div>
              </div>
              <p className="text-xs text-slate-500">
                Upload the <strong>letter front photo</strong> or document PDF to be mailed via vSendDocs.
                Submission ID/Number will be saved to this delivery record automatically.
              </p>

              {/* File upload area */}
              <div
                className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-[#0A3D8F]/40 transition group cursor-pointer"
                onClick={() => !vsendocsFile && fileInputRef.current?.click()}
              >
                <div className="flex items-start gap-3">
                  {vsendocsFilePreview ? (
                    <img
                      src={vsendocsFilePreview}
                      alt="Letter front preview"
                      className="w-16 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:border-[#0A3D8F]/30 transition shadow-sm">
                      <i className="ri-file-image-line text-xl text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 mb-0.5">
                      Letter front photo or document
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2">
                      Attach a scan/photo of the letter front or the PDF to be mailed.
                    </div>
                    {vsendocsFile ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-medium max-w-xs truncate">
                          <i className="ri-check-line flex-shrink-0" />
                          <span className="truncate">{vsendocsFile.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVsendocsFile(null);
                            setVsendocsFilePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-[11px] text-slate-500 hover:text-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0A3D8F] hover:text-[#0A3D8F] text-xs font-semibold text-slate-700 transition shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="ri-upload-2-line" />
                        Choose File
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    )}
                    <div className="mt-1.5 text-[10px] text-slate-400">Accepted: PDF · JPG · PNG</div>
                  </div>
                </div>
              </div>

              {/* Post type + options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1 text-[11px] font-medium text-slate-500">Post type</div>
                  <select
                    value={vsendocsPostType}
                    onChange={(e) => setVsendocsPostType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/15"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Do not include POS">Do not include POS</option>
                    <option value="EAMS POS">EAMS POS</option>
                    <option value="Detailed POS">Detailed POS</option>
                  </select>
                </label>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vsendocsExpress}
                      onChange={(e) => setVsendocsExpress(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#0A3D8F]"
                    />
                    Express delivery
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vsendocsDuplex}
                      onChange={(e) => setVsendocsDuplex(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#0A3D8F]"
                    />
                    Duplex print
                  </label>
                </div>
              </div>

              {/* Delivery address for submission */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSubmissionAddress((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-100/80 transition"
                >
                  <div className="flex items-center gap-2">
                    <i className="ri-map-pin-line text-slate-500 text-sm" />
                    <span className="text-xs font-semibold text-slate-700">
                      Delivery address for submission
                    </span>
                    {hasAddressData && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                        Pre-filled
                      </span>
                    )}
                  </div>
                  <i
                    className={`ri-arrow-${showSubmissionAddress ? "up" : "down"}-s-line text-slate-500`}
                  />
                </button>
                {showSubmissionAddress && (
                  <div className="border-t border-slate-200 bg-white px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                      className="sm:col-span-2"
                      label="Recipient name"
                      value={overrideName}
                      onChange={setOverrideName}
                      placeholder="Name on envelope"
                    />
                    <FormInput
                      className="sm:col-span-2"
                      label="Address line 1"
                      value={overrideLine1}
                      onChange={setOverrideLine1}
                      placeholder="Street address"
                    />
                    <FormInput
                      className="sm:col-span-2"
                      label="Address line 2"
                      value={overrideLine2}
                      onChange={setOverrideLine2}
                      placeholder="Apt, suite, etc."
                      optional
                    />
                    <FormInput
                      label="City"
                      value={overrideCity}
                      onChange={setOverrideCity}
                      placeholder="City"
                    />
                    <FormInput
                      label="State (2 letters)"
                      value={overrideState}
                      onChange={setOverrideState}
                      placeholder="CA"
                    />
                    <FormInput
                      className="sm:col-span-2"
                      label="ZIP code"
                      value={overrideZip}
                      onChange={setOverrideZip}
                      placeholder="12345 or 12345-6789"
                    />
                  </div>
                )}
              </div>

              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={!vsendocsFile || vsendocsLoading}
                  onClick={() => void submitToVSendDocs()}
                  className="inline-flex items-center gap-1.5 justify-center rounded-lg bg-[#0A3D8F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#083170] transition"
                >
                  <i className="ri-send-plane-2-line" />
                  {vsendocsLoading ? "Submitting…" : "Submit to vSendDocs"}
                </button>

                {submissionId && (
                  <>
                    <button
                      type="button"
                      disabled={vsendocsLoading}
                      onClick={() => void checkVSendDocsStatus()}
                      className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      <i className="ri-refresh-line" />
                      Check Status
                    </button>
                    <a
                      href={deliveriesApi.adminVSendDocsPosUrl(request.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <i className="ri-file-download-line" />
                      Download POS PDF
                    </a>
                  </>
                )}
              </div>

              {!vsendocsFile && (
                <p className="text-[11px] text-slate-400">
                  Select a letter front photo or PDF document to enable submission.
                </p>
              )}

              {/* vSendDocs success message */}
              {vsendocsMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
                  <i className="ri-check-double-line text-emerald-600 flex-shrink-0" />
                  {vsendocsMsg}
                </div>
              )}

              {/* vSendDocs status panel */}
              {vsendocsStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs space-y-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold text-slate-800">{vsendocsStatus.status}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-300" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Delivery:</span>
                      <span className="font-semibold text-slate-800">
                        {vsendocsStatus.deliveryStatus}
                      </span>
                    </div>
                  </div>
                  {vsendocsStatus.logs?.length > 0 && (
                    <div className="border-t border-slate-200 pt-2 space-y-1.5">
                      {vsendocsStatus.logs.map((log: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="text-slate-400 flex-shrink-0 tabular-nums">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleString()
                              : "—"}
                          </span>
                          <span className="font-semibold text-slate-700 flex-shrink-0">
                            {log.action}
                          </span>
                          <span className="text-slate-600">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* vSendDocs error panel */}
              {vsendocsErr && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <i className="ri-error-warning-line" />
                    vSendDocs error
                  </div>
                  {typeof vsendocsErr?.error === "string" && vsendocsErr.error && (
                    <p className="text-rose-800">{vsendocsErr.error}</p>
                  )}
                  {flattenVsendocsSuggestions(vsendocsErr?.suggestions).map((s: any, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (s.addressLine1) setOverrideLine1(s.addressLine1);
                        if (s.city) setOverrideCity(s.city);
                        if (s.state) setOverrideState(s.state);
                        if (s.zipCode) setOverrideZip(s.zipCode);
                        setShowSubmissionAddress(true);
                        setVsendocsErr(null);
                        setError(null);
                      }}
                      className="w-full text-left rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 transition"
                    >
                      <span className="font-semibold">Use suggested address:</span>{" "}
                      {[s.addressLine1, s.city, s.state, s.zipCode].filter(Boolean).join(", ")}
                    </button>
                  ))}
                  {vsendocsErr?.errors != null ? (
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[10px]">
                      {JSON.stringify(vsendocsErr.errors, null, 2)}
                    </pre>
                  ) : flattenVsendocsSuggestions(vsendocsErr?.suggestions).length === 0 ? (
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[10px]">
                      {JSON.stringify(vsendocsErr, null, 2)}
                    </pre>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ── Decision ── */}
          {!readOnly && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Decision</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Reject requires a reason. Approve does not.
              </div>
              <div className="mt-3">
                <FormInput
                  label="Reject reason"
                  value={rejectReason}
                  onChange={setRejectReason}
                  placeholder="Required to reject this request"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {readOnly ? (
          <div className="p-5 border-t border-slate-200 bg-white">
            <p className="text-xs text-slate-400 text-center">
              Status:{" "}
              <span className="font-semibold text-slate-700">{s.label}</span> — view only
            </p>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Approve */}
              <button
                disabled={loading || !canApprove}
                onClick={() => run(() => deliveriesApi.adminApprove(request.id))}
                title={approveDisabledReason}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition disabled:cursor-not-allowed"
              >
                <i className="ri-checkbox-circle-line" />
                Approve
              </button>

              {/* Reject */}
              <button
                disabled={loading || !canReject || !rejectReason.trim()}
                onClick={() => run(() => deliveriesApi.adminReject(request.id, rejectReason))}
                title={rejectDisabledReason}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-rose-700 transition disabled:cursor-not-allowed"
              >
                <i className="ri-close-circle-line" />
                Reject
              </button>

              {/* Mark In Transit */}
              <button
                disabled={loading || !canMarkInTransit}
                onClick={() =>
                  run(() =>
                    deliveriesApi.adminMarkInTransit(request.id, {
                      trackingNumber,
                      submissionId: submissionId || undefined,
                      submissionNumber: submissionNumber || undefined,
                    })
                  )
                }
                title={inTransitDisabledReason}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition disabled:cursor-not-allowed"
              >
                <i className="ri-truck-line" />
                In Transit
              </button>

              {/* Mark Delivered */}
              <button
                disabled={loading || !canMarkDelivered}
                onClick={() =>
                  run(() => deliveriesApi.adminMarkDelivered(request.id, proofOfServiceUrl))
                }
                title={deliveredDisabledReason}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700 transition disabled:cursor-not-allowed"
              >
                <i className="ri-map-pin-2-line" />
                Delivered
              </button>
            </div>

            {/* Button hint row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              {approveDisabledReason && (
                <span className="flex items-center gap-1 text-slate-400">
                  <i className="ri-information-line" />
                  Approve: {approveDisabledReason}
                </span>
              )}
              {inTransitDisabledReason && (
                <span className="flex items-center gap-1 text-slate-400">
                  <i className="ri-information-line" />
                  In Transit: {inTransitDisabledReason}
                </span>
              )}
              {deliveredDisabledReason && (
                <span className="flex items-center gap-1 text-slate-400">
                  <i className="ri-information-line" />
                  Delivered: {deliveredDisabledReason}
                </span>
              )}
              {!approveDisabledReason && !inTransitDisabledReason && !deliveredDisabledReason && (
                <span className="flex items-center gap-1">
                  <i className="ri-information-line" />
                  Actions will refresh the list and close this panel on success.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
