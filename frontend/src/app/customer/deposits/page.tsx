"use client";

import { useState } from "react";

type DepositStatus = "Open Deposit Request" | "Processing" | "Deposited" | "Rejected";

interface CustomerDepositRequest {
  id: string;
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

const mockRequests: CustomerDepositRequest[] = [
  {
    id: "DEP-001",
    bankName: "Bank of America",
    chequeNumber: "004821",
    amount: "$12,500.00",
    requestedAt: "Today, 11:05 AM",
    timeShort: "11:05 AM",
    status: "Open Deposit Request",
    requestedBy: "John Smith",
    thumbnail:
      "https://readdy.ai/api/search-image?query=business%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20and%20signature%20lines%20professional%20financial%20instrument%20scanned%20clean&width=600&height=360&seq=cdep-1&orientation=landscape",
    notes: "Client requested expedited processing",
  },
  {
    id: "DEP-002",
    bankName: "Chase Bank",
    chequeNumber: "009134",
    amount: "$47,200.00",
    requestedAt: "Today, 09:48 AM",
    timeShort: "9:48 AM",
    status: "Processing",
    requestedBy: "Sarah Johnson",
    depositDate: "2026/03/25",
    thumbnail:
      "https://readdy.ai/api/search-image?query=bank%20cheque%20financial%20document%20on%20white%20background%20with%20printed%20amount%20payee%20name%20and%20routing%20number%20professional%20scanned%20document&width=600&height=360&seq=cdep-2&orientation=landscape",
  },
  {
    id: "DEP-006",
    bankName: "US Bank",
    chequeNumber: "011042",
    amount: "$65,000.00",
    requestedAt: "Jun 11, 4:20 PM",
    timeShort: "Jun 11",
    status: "Deposited",
    requestedBy: "Lisa Anderson",
    depositDate: "2026/03/20",
    depositSlipUrl:
      "https://readdy.ai/api/search-image?query=scanned%20deposit%20slip%20bank%20receipt%20document%20on%20white%20background%20with%20transaction%20details%20professional%20clean%20scan&width=600&height=400&seq=cdep-slip-1&orientation=portrait",
    thumbnail:
      "https://readdy.ai/api/search-image?query=large%20value%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20payee%20and%20date%20professional%20financial%20instrument%20scanned%20clean&width=600&height=360&seq=cdep-6&orientation=landscape",
  },
  {
    id: "DEP-003",
    bankName: "Wells Fargo",
    chequeNumber: "002267",
    amount: "$8,750.00",
    requestedAt: "Yesterday, 3:30 PM",
    timeShort: "Yesterday",
    status: "Open Deposit Request",
    requestedBy: "Michael Chen",
    thumbnail:
      "https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20paper%20with%20bank%20logo%20amount%20field%20and%20memo%20line%20professional%20financial%20instrument%20clean%20scan&width=600&height=360&seq=cdep-3&orientation=landscape",
  },
  {
    id: "DEP-004",
    bankName: "Citibank",
    chequeNumber: "007755",
    amount: "$3,300.00",
    requestedAt: "Yesterday, 1:15 PM",
    timeShort: "Yesterday",
    status: "Rejected",
    requestedBy: "Emily Davis",
    notes: "Signature verification failed - please resubmit with correct documents",
    thumbnail:
      "https://readdy.ai/api/search-image?query=rejected%20cheque%20document%20on%20white%20background%20with%20bank%20details%20and%20amount%20professional%20financial%20document%20scanned%20with%20visible%20details&width=600&height=360&seq=cdep-4&orientation=landscape",
  },
  {
    id: "DEP-008",
    bankName: "Regions Bank",
    chequeNumber: "008877",
    amount: "$33,400.00",
    requestedAt: "Jun 10, 2:00 PM",
    timeShort: "Jun 10",
    status: "Deposited",
    requestedBy: "Jennifer Martinez",
    depositDate: "2026/03/22",
    depositSlipUrl:
      "https://readdy.ai/api/search-image?query=bank%20deposit%20confirmation%20slip%20receipt%20document%20clean%20white%20background%20with%20transaction%20amount%20date%20and%20reference%20number&width=600&height=400&seq=cdep-slip-2&orientation=portrait",
    thumbnail:
      "https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20background%20with%20regions%20bank%20details%20amount%20and%20signature%20professional%20financial%20instrument%20scanned&width=600&height=360&seq=cdep-8&orientation=landscape",
  },
  {
    id: "DEP-010",
    bankName: "Truist Bank",
    chequeNumber: "013456",
    amount: "$28,900.00",
    requestedAt: "Jun 8, 9:30 AM",
    timeShort: "Jun 8",
    status: "Deposited",
    requestedBy: "Amanda White",
    depositDate: "2026/03/18",
    depositSlipUrl:
      "https://readdy.ai/api/search-image?query=truist%20bank%20deposit%20slip%20scanned%20document%20receipt%20white%20background%20transaction%20confirmation%20professional%20clean&width=600&height=400&seq=cdep-slip-3&orientation=portrait",
    thumbnail:
      "https://readdy.ai/api/search-image?query=truist%20bank%20cheque%20document%20on%20white%20background%20with%20amount%20payee%20routing%20number%20professional%20financial%20instrument%20scanned%20clean&width=600&height=360&seq=cdep-10&orientation=landscape",
  },
];

const statusConfig: Record<DepositStatus, { color: string; icon: string; label: string }> = {
  "Open Deposit Request": { color: "bg-amber-100 text-amber-700", icon: "ri-time-line", label: "Open Deposit Request" },
  Processing: { color: "bg-blue-100 text-blue-700", icon: "ri-loader-3-line", label: "Processing" },
  Deposited: { color: "bg-teal-100 text-teal-700", icon: "ri-bank-line", label: "Deposited" },
  Rejected: { color: "bg-red-100 text-red-700", icon: "ri-close-circle-line", label: "Rejected" },
};

export default function CustomerDepositRequestsPage() {
  const [requests] = useState<CustomerDepositRequest[]>(mockRequests);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<CustomerDepositRequest | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.bankName.toLowerCase().includes(search.toLowerCase()) ||
      r.chequeNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.amount.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="flex items-center p-5 gap-5">
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={req.thumbnail} alt="cheque" className="w-full h-full object-cover object-top" />
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
                        Cheque No. <span className="font-medium text-gray-700">#{req.chequeNumber}</span> - Requested by{" "}
                        {req.requestedBy}
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
                        Your deposit request has been approved and is now being processed. Deposit date:{" "}
                        <strong>{req.depositDate}</strong>
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
            setSelectedRequest(null);
            setShowSlipModal(false);
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
                  setSelectedRequest(null);
                  setShowSlipModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-gray-600 text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="w-full h-52 rounded-xl overflow-hidden border border-gray-200">
                <img src={selectedRequest.thumbnail} alt="cheque" className="w-full h-full object-cover object-top" />
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
                    <img
                      src={selectedRequest.depositSlipUrl}
                      alt="Deposit slip"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setShowSlipModal(false);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm cursor-pointer whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSlipModal && selectedRequest?.depositSlipUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6"
          onClick={() => setShowSlipModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <i className="ri-file-text-fill text-teal-600 text-lg"></i>
                <h3 className="text-base font-bold text-gray-900">Deposit Slip</h3>
                <span className="text-xs text-gray-400">- {selectedRequest.id}</span>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
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
                  <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-full">
                    {selectedRequest.amount}
                  </span>
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
    </div>
  );
}
