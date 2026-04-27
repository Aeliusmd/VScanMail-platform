"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { depositsApi, type DepositDto } from "@/lib/api/deposits";
import { mailApi, type MailItem } from "@/lib/api/mail";

type DepositStatus = "Open Deposit Request" | "Processing" | "Deposited" | "Rejected";

interface CustomerDepositRequest {
  id: string;
  chequeId: string;
  mailItemId: string;
  bankName: string;
  chequeNumber: string;
  amount: string;
  requestedAt: string;
  timeShort: string;
  status: DepositStatus;
  requestedBy: string;
  depositDate?: string;
  depositSlipUrl?: string;
  notes?: string;
  thumbnail: string;
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mapDepositToRequest(d: DepositDto): CustomerDepositRequest {
  const requested = d.requestedAt ? new Date(d.requestedAt) : null;
  const dateLabel = requested && !Number.isNaN(requested.getTime()) ? requested.toLocaleString() : "—";
  const timeShort =
    requested && !Number.isNaN(requested.getTime())
      ? requested.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";

  const isDeposited = Boolean(d.markedDepositedAt) || d.chequeStatus === "deposited" || d.chequeStatus === "cleared";

  const status: DepositStatus =
    isDeposited ? "Deposited" : d.decision === "rejected" ? "Rejected" : d.decision === "approved" ? "Processing" : "Open Deposit Request";

  const bankLabel = d.destinationBankName
    ? d.destinationBankNickname
      ? `${d.destinationBankName} (${d.destinationBankNickname})`
      : d.destinationBankName
    : "—";

  const depositDate =
    status === "Processing" && d.decidedAt
      ? new Date(d.decidedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : status === "Deposited" && (d.markedDepositedAt || d.decidedAt)
        ? new Date(d.markedDepositedAt || d.decidedAt!).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : undefined;

  return {
    id: `DEP-${d.chequeId.slice(-6)}`,
    chequeId: d.chequeId,
    mailItemId: d.mailItemId,
    bankName: bankLabel,
    chequeNumber: d.chequeId.slice(-6),
    amount: formatMoney(Number(d.amountFigures || 0)),
    requestedAt: dateLabel,
    timeShort,
    status,
    requestedBy: "You",
    depositDate,
    notes: d.rejectReason || undefined,
    thumbnail: "",
  };
}

const statusConfig: Record<DepositStatus, { color: string; icon: string; label: string }> = {
  "Open Deposit Request": { color: "bg-amber-100 text-amber-700", icon: "ri-time-line", label: "Open Deposit Request" },
  Processing: { color: "bg-blue-100 text-blue-700", icon: "ri-loader-3-line", label: "Processing" },
  Deposited: { color: "bg-teal-100 text-teal-700", icon: "ri-bank-line", label: "Deposited" },
  Rejected: { color: "bg-red-100 text-red-700", icon: "ri-close-circle-line", label: "Rejected" },
};

export default function CustomerDepositRequestsPage() {
  const params = useParams<{ clientId?: string }>();
  const clientId = params?.clientId;
  const router = useRouter();
  const [requests, setRequests] = useState<CustomerDepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<CustomerDepositRequest | null>(null);
  const [selectedRequestMail, setSelectedRequestMail] = useState<MailItem | null>(null);
  const [selectedRequestMailLoading, setSelectedRequestMailLoading] = useState(false);
  const [selectedRequestMailError, setSelectedRequestMailError] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [chequeViewerOpen, setChequeViewerOpen] = useState(false);
  const [chequeViewerUrl, setChequeViewerUrl] = useState<string | null>(null);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const resetCancelState = () => {
    setCancelConfirming(false);
    setCancelError(null);
    setCancelling(false);
  };

  const handleCancelDeposit = async () => {
    if (!selectedRequest) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await depositsApi.cancelRequest(selectedRequest.chequeId);
      setRequests((prev) => prev.filter((r) => r.chequeId !== selectedRequest.chequeId));
      resetCancelState();
      setSelectedRequest(null);
      setShowSlipModal(false);
      router.push(`/customer/${clientId}/cheques`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel. Try again.";
      setCancelError(msg);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await depositsApi.listMine();
        if (cancelled) return;
        setRequests(data.map(mapDepositToRequest));
      } catch (e) {
        console.error("Failed to load deposit requests:", e);
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedRequest?.mailItemId) {
        setSelectedRequestMail(null);
        setSelectedRequestMailLoading(false);
        setSelectedRequestMailError(null);
        return;
      }

      try {
        setSelectedRequestMailLoading(true);
        setSelectedRequestMailError(null);
        const mail = await mailApi.getById(selectedRequest.mailItemId);
        if (cancelled) return;
        setSelectedRequestMail(mail);
      } catch (e) {
        console.error("Failed to load deposit request mail item:", e);
        if (cancelled) return;
        setSelectedRequestMail(null);
        setSelectedRequestMailError("Failed to load cheque images/details.");
      } finally {
        if (!cancelled) setSelectedRequestMailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedRequest?.mailItemId]);

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        const matchSearch =
          r.bankName.toLowerCase().includes(search.toLowerCase()) ||
          r.chequeNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase()) ||
          r.amount.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || r.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [requests, search, statusFilter]
  );

  const counts = {
    All: requests.length,
    "Open Deposit Request": requests.filter((r) => r.status === "Open Deposit Request").length,
    Processing: requests.filter((r) => r.status === "Processing").length,
    Deposited: requests.filter((r) => r.status === "Deposited").length,
    Rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deposit Requests</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track the status of your cheque deposit requests</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                  {counts["Open Deposit Request"]} Open
                </span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {counts.Processing} Processing
                </span>
                <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                  {counts.Deposited} Deposited
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-5">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by bank, cheque number, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0A3D8F] transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center px-4 overflow-x-auto">
            {(["All", "Open Deposit Request", "Processing", "Deposited", "Rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? "border-[#0A3D8F] text-[#0A3D8F]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab ? "bg-[#0A3D8F]/10 text-[#0A3D8F]" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab === "All" ? counts.All : counts[tab] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="ri-exchange-dollar-line text-gray-400 text-3xl"></i>
            </div>
            <p className="text-gray-500 font-medium">No deposit requests found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const cfg = statusConfig[req.status];
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {
                    resetCancelState();
                    setSelectedRequest(req);
                  }}
                >
                  <div className="flex items-center p-5 gap-5">
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      {req.thumbnail ? (
                        <img src={req.thumbnail} alt="cheque" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <i className="ri-image-line text-lg"></i>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{req.id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                          <i className={`${cfg.icon} mr-1 text-xs`}></i>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{req.bankName}</p>
                      <p className="text-xs text-gray-500">
                        Cheque No. <span className="font-medium text-gray-700">#{req.chequeNumber}</span> - Requested by {req.requestedBy}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">{req.amount}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{req.timeShort}</p>
                    </div>

                    {req.depositDate && (
                      <div className="flex-shrink-0 hidden md:block">
                        <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                          <i className="ri-calendar-check-line"></i>
                          <span className="font-medium">{req.depositDate}</span>
                        </div>
                      </div>
                    )}

                    {req.status === "Deposited" && req.depositSlipUrl && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
                          <i className="ri-file-text-line"></i>
                          <span>Slip Available</span>
                        </div>
                      </div>
                    )}

                    <i className="ri-arrow-right-s-line text-gray-300 text-xl flex-shrink-0"></i>
                  </div>

                  {req.status === "Processing" && (
                    <div className="mx-5 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <i className="ri-information-line text-blue-600 text-sm flex-shrink-0"></i>
                      <p className="text-xs text-blue-700 font-medium">
                        Your deposit request has been approved and is now being processed. Deposit date: <strong>{req.depositDate}</strong>
                      </p>
                    </div>
                  )}

                  {req.status === "Rejected" && req.notes && (
                    <div className="mx-5 mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <i className="ri-error-warning-line text-red-600 text-sm flex-shrink-0"></i>
                      <p className="text-xs text-red-700">{req.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          onClick={() => {
            resetCancelState();
            setSelectedRequest(null);
            setShowSlipModal(false);
            setChequeViewerOpen(false);
            setChequeViewerUrl(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <i className="ri-exchange-dollar-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Deposit Request</h2>
                  <p className="text-xs text-gray-400">
                    {selectedRequest.id} - {selectedRequest.requestedAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetCancelState();
                  setSelectedRequest(null);
                  setShowSlipModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-gray-600 text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-3">
                {selectedRequestMailLoading && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    Loading cheque details…
                  </div>
                )}
                {selectedRequestMailError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    {selectedRequestMailError}
                  </div>
                )}

                {(() => {
                  const scans = (selectedRequestMail?.content_scan_urls || []).filter(Boolean).slice(0, 6);
                  const main = scans[0] || null;
                  const rest = scans.slice(1);
                  if (!main) {
                    return (
                      <div className="w-full h-52 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-xs">
                        Cheque image not available
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img
                          src={main}
                          alt="Cheque image"
                          className="w-full h-full object-contain cursor-zoom-in"
                          onClick={() => {
                            setChequeViewerUrl(main);
                            setChequeViewerOpen(true);
                          }}
                        />
                      </div>
                      {rest.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {rest.map((u, idx) => (
                            <div key={u || idx} className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                              <img
                                src={u}
                                alt={`Cheque image ${idx + 2}`}
                                className="w-full h-full object-cover object-top cursor-zoom-in"
                                onClick={() => {
                                  setChequeViewerUrl(u);
                                  setChequeViewerOpen(true);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  selectedRequest.status === "Open Deposit Request"
                    ? "bg-amber-50 border-amber-200"
                    : selectedRequest.status === "Processing"
                      ? "bg-blue-50 border-blue-200"
                      : selectedRequest.status === "Deposited"
                        ? "bg-teal-50 border-teal-200"
                        : "bg-red-50 border-red-200"
                }`}
              >
                <i
                  className={`${statusConfig[selectedRequest.status].icon} text-xl ${
                    selectedRequest.status === "Open Deposit Request"
                      ? "text-amber-600"
                      : selectedRequest.status === "Processing"
                        ? "text-blue-600"
                        : selectedRequest.status === "Deposited"
                          ? "text-teal-600"
                          : "text-red-600"
                  }`}
                ></i>
                <div>
                  <p
                    className={`text-sm font-bold ${
                      selectedRequest.status === "Open Deposit Request"
                        ? "text-amber-800"
                        : selectedRequest.status === "Processing"
                          ? "text-blue-800"
                          : selectedRequest.status === "Deposited"
                            ? "text-teal-800"
                            : "text-red-800"
                    }`}
                  >
                    {selectedRequest.status === "Open Deposit Request" && "Awaiting Admin Action"}
                    {selectedRequest.status === "Processing" && "Deposit Approved - Currently Processing"}
                    {selectedRequest.status === "Deposited" && "Successfully Deposited"}
                    {selectedRequest.status === "Rejected" && "Request Rejected"}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      selectedRequest.status === "Open Deposit Request"
                        ? "text-amber-600"
                        : selectedRequest.status === "Processing"
                          ? "text-blue-600"
                          : selectedRequest.status === "Deposited"
                            ? "text-teal-600"
                            : "text-red-600"
                    }`}
                  >
                    {selectedRequest.status === "Open Deposit Request" &&
                      "Your request has been submitted and is awaiting review."}
                    {selectedRequest.status === "Processing" && `Deposit date: ${selectedRequest.depositDate}`}
                    {selectedRequest.status === "Deposited" &&
                      `Deposited on ${selectedRequest.depositDate}. Deposit slip has been sent to your email.`}
                    {selectedRequest.status === "Rejected" &&
                      (selectedRequest.notes || "Please contact support for more information.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.bankName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-xl font-bold text-[#0A3D8F]">{selectedRequest.amount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Cheque Number</p>
                  <p className="text-sm font-bold text-gray-900">#{selectedRequest.chequeNumber}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Requested By</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.requestedBy}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedRequest.requestedAt}</p>
                </div>
                {selectedRequest.depositDate && (
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 col-span-2">
                    <div className="flex items-center gap-2">
                      <i className="ri-calendar-check-line text-teal-600 text-base"></i>
                      <div>
                        <p className="text-xs text-teal-600">Deposit Date</p>
                        <p className="text-sm font-bold text-teal-800">{selectedRequest.depositDate}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "Deposited" && selectedRequest.depositSlipUrl && (
                <div className="p-5 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <i className="ri-file-text-fill text-teal-700 text-base"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-teal-900">Deposit Slip</p>
                        <p className="text-xs text-teal-600">Received via email - Available to view</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSlipModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-eye-line"></i>
                      View Slip
                    </button>
                  </div>
                  <div
                    className="w-full h-32 rounded-lg overflow-hidden border border-teal-300 cursor-pointer"
                    onClick={() => setShowSlipModal(true)}
                  >
                    <img src={selectedRequest.depositSlipUrl} alt="Deposit slip" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1">
                {cancelConfirming ? (
                  <div className="w-full space-y-3">
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-semibold text-red-800">Cancel this deposit request?</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        The request will be withdrawn and the cheque returned to your inbox. You can re-request later.
                      </p>
                    </div>
                    {cancelError && <p className="text-xs text-red-600 px-1">{cancelError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCancelConfirming(false);
                          setCancelError(null);
                        }}
                        disabled={cancelling}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        Keep Request
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDeposit}
                        disabled={cancelling}
                        className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {cancelling ? "Cancelling…" : "Yes, Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {selectedRequest.status === "Open Deposit Request" && (
                      <button
                        type="button"
                        onClick={() => setCancelConfirming(true)}
                        className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg hover:bg-red-100 transition-colors text-sm cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-close-circle-line mr-1.5"></i>
                        Cancel Deposit Request
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        resetCancelState();
                        setSelectedRequest(null);
                        setShowSlipModal(false);
                      }}
                      className={`py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm cursor-pointer whitespace-nowrap ${
                        selectedRequest.status === "Open Deposit Request" ? "flex-1" : "w-full"
                      }`}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSlipModal && selectedRequest?.depositSlipUrl && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6" onClick={() => setShowSlipModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <i className="ri-file-text-fill text-teal-600 text-lg"></i>
                <h3 className="text-base font-bold text-gray-900">Deposit Slip</h3>
                <span className="text-xs text-gray-400">- {selectedRequest.id}</span>
              </div>
              <button onClick={() => setShowSlipModal(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                <i className="ri-close-line text-gray-600 text-xl"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img src={selectedRequest.depositSlipUrl} alt="Deposit slip" className="w-full object-cover" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 rounded-xl border border-teal-200">
                <i className="ri-calendar-check-line text-teal-600"></i>
                <div>
                  <p className="text-xs text-teal-600">Deposited on</p>
                  <p className="text-sm font-bold text-teal-800">{selectedRequest.depositDate}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-full">{selectedRequest.amount}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheque image viewer */}
      {chequeViewerOpen && chequeViewerUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
          onClick={() => {
            setChequeViewerOpen(false);
            setChequeViewerUrl(null);
          }}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setChequeViewerOpen(false);
                setChequeViewerUrl(null);
              }}
              className="absolute -top-2 -right-2 sm:top-2 sm:right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            <img
              src={chequeViewerUrl}
              alt="Cheque full view"
              className="w-full max-h-[85vh] object-contain rounded-xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

