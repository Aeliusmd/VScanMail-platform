"use client";

import { useState } from "react";
import { deliveriesApi, type DeliveryDto } from "@/lib/api/deliveries";
import { ApiError } from "@/lib/api-client";

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

function flattenVsendocsSuggestions(suggestions: unknown): any[] {
  if (!Array.isArray(suggestions)) return [];
  const out: any[] = [];
  for (const item of suggestions) {
    if (!item) continue;
    if (Array.isArray((item as any).suggestions)) {
      out.push(...(item as any).suggestions);
    } else if ((item as any).addressLine1 || (item as any).city || (item as any).zipCode) {
      out.push(item);
    }
  }
  return out;
}

export default function ClickedDelivery({ request, onClose, onUpdated, readOnly }: ClickedDeliveryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(request.trackingNumber || "");
  const [submissionId, setSubmissionId] = useState(request.vSendDocsSubmissionId || "");
  const [submissionNumber, setSubmissionNumber] = useState(request.vSendDocsSubmissionNumber || "");
  const [proofOfServiceUrl, setProofOfServiceUrl] = useState(request.proofOfServiceUrl || "");

  const [vsendocsFile, setVsendocsFile] = useState<File | null>(null);
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

  const [showSubmissionAddress, setShowSubmissionAddress] = useState(false);
  const [overrideName, setOverrideName] = useState(request.addressName || "");
  const [overrideLine1, setOverrideLine1] = useState(request.addressLine1 || "");
  const [overrideLine2, setOverrideLine2] = useState(request.addressLine2 || "");
  const [overrideCity, setOverrideCity] = useState(request.addressCity || "");
  const [overrideState, setOverrideState] = useState(request.addressState || "");
  const [overrideZip, setOverrideZip] = useState(request.addressZip || "");

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
      setVsendocsMsg(`Submitted to vSendDocs — Submission #${res.submissionNumber}`);
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

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="text-sm font-semibold text-slate-900">Submit to vSendDocs</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Attach a PDF or image and submit for mailing via vSendDocs. Submission ID/Number will be saved to this delivery record.
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSubmissionAddress((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition"
                >
                  <span>Delivery address for submission</span>
                  <i className={`ri-arrow-${showSubmissionAddress ? "up" : "down"}-s-line text-slate-500`} />
                </button>
                {showSubmissionAddress ? (
                  <div className="border-t border-slate-200 bg-white px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      className="sm:col-span-2"
                      label="Recipient name"
                      value={overrideName}
                      onChange={setOverrideName}
                      placeholder="Name on envelope"
                    />
                    <Input
                      className="sm:col-span-2"
                      label="Address line 1"
                      value={overrideLine1}
                      onChange={setOverrideLine1}
                      placeholder="Street address"
                    />
                    <Input
                      className="sm:col-span-2"
                      label="Address line 2 (optional)"
                      value={overrideLine2}
                      onChange={setOverrideLine2}
                      placeholder="Apt, suite, etc."
                    />
                    <Input label="City" value={overrideCity} onChange={setOverrideCity} placeholder="City" />
                    <Input label="State (2 letters)" value={overrideState} onChange={setOverrideState} placeholder="CA" />
                    <Input
                      className="sm:col-span-2"
                      label="ZIP"
                      value={overrideZip}
                      onChange={setOverrideZip}
                      placeholder="12345 or 12345-6789"
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <div className="mb-1 text-[11px] font-medium text-slate-500">Attach document (PDF or image)</div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setVsendocsFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                </label>

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

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={vsendocsExpress}
                      onChange={(e) => setVsendocsExpress(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Express delivery
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={vsendocsDuplex}
                      onChange={(e) => setVsendocsDuplex(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Duplex print
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={!vsendocsFile || vsendocsLoading}
                  onClick={() => void submitToVSendDocs()}
                  className="inline-flex items-center justify-center rounded-lg bg-[#0A3D8F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#083170] transition"
                >
                  {vsendocsLoading ? "Submitting..." : "Submit to vSendDocs"}
                </button>

                {submissionId ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      disabled={vsendocsLoading}
                      onClick={() => void checkVSendDocsStatus()}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Check Status
                    </button>
                    <a
                      href={deliveriesApi.adminVSendDocsPosUrl(request.id)}
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      rel="noreferrer"
                    >
                      Download POS PDF
                    </a>
                  </div>
                ) : null}
              </div>

              {vsendocsMsg && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {vsendocsMsg}
                </div>
              )}

              {vsendocsStatus ? (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold">Status:</span> {vsendocsStatus.status}{" "}
                    <span className="text-slate-400">/</span>{" "}
                    <span className="font-semibold">Delivery:</span> {vsendocsStatus.deliveryStatus}
                  </div>
                </div>
              ) : null}

              {vsendocsErr && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <div className="font-semibold">vSendDocs error details</div>
                  {typeof vsendocsErr?.error === "string" && vsendocsErr.error ? (
                    <p className="mt-1 text-rose-800">{vsendocsErr.error}</p>
                  ) : null}
                  {flattenVsendocsSuggestions(vsendocsErr?.suggestions).map((s: any, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (s.addressLine1) setOverrideLine1(s.addressLine1);
                        if (s.city) setOverrideCity(s.city);
                        if (s.state) setOverrideState(s.state);
                        if (s.zipCode) setOverrideZip(s.zipCode);
                        setVsendocsErr(null);
                        setError(null);
                      }}
                      className="mt-1 w-full text-left rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 transition"
                    >
                      <span className="font-semibold">Use suggested:</span>{" "}
                      {[s.addressLine1, s.city, s.state, s.zipCode].filter(Boolean).join(", ")}
                    </button>
                  ))}
                  {vsendocsErr?.errors != null ? (
                    <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(vsendocsErr.errors, null, 2)}</pre>
                  ) : flattenVsendocsSuggestions(vsendocsErr?.suggestions).length === 0 ? (
                    <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(vsendocsErr, null, 2)}</pre>
                  ) : null}
                </div>
              )}
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
