"use client";

import { useState } from "react";

type DeliveryStatus = "Pending" | "On the Way" | "Delivered" | "Confirmed" | "Failed";

interface CustomerDeliveryRequest {
  id: string;
  mailSubject: string;
  deliveryAddress: string;
  courier: string;
  trackingNumber: string;
  requestedAt: string;
  timeShort: string;
  status: DeliveryStatus;
  requestedBy: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  thumbnail: string;
  aiSummary: string;
}

const mockDeliveries: CustomerDeliveryRequest[] = [
  {
    id: "DEL-001",
    mailSubject: "Bank Statement - January 2025",
    deliveryAddress: "1234 Market Street, Suite 500, San Francisco, CA 94103",
    courier: "FedEx Express",
    trackingNumber: "FDX8821445672",
    requestedAt: "Today, 11:05 AM",
    timeShort: "11:05 AM",
    status: "Pending",
    requestedBy: "John Smith",
    recipientName: "Sarah Johnson",
    recipientPhone: "+1 (415) 555-0123",
    notes: "Signature required upon delivery",
    thumbnail:
      "https://readdy.ai/api/search-image?query=business%20envelope%20with%20bank%20statement%20document%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=600&height=360&seq=cdel-1&orientation=landscape",
    aiSummary:
      "Delivery request for bank statement mail. Standard priority delivery. Recipient confirmed available for signature. No special handling required.",
  },
  {
    id: "DEL-002",
    mailSubject: "Legal Documents - Contract Amendment",
    deliveryAddress: "789 Business Park Drive, Building C, Austin, TX 78701",
    courier: "UPS Next Day Air",
    trackingNumber: "UPS9934521087",
    requestedAt: "Today, 09:48 AM",
    timeShort: "9:48 AM",
    status: "On the Way",
    requestedBy: "Sarah Johnson",
    recipientName: "Michael Chen",
    recipientPhone: "+1 (512) 555-0198",
    thumbnail:
      "https://readdy.ai/api/search-image?query=legal%20document%20envelope%20with%20contract%20papers%20on%20white%20background%20professional%20mail%20package%20scanned&width=600&height=360&seq=cdel-2&orientation=landscape",
    aiSummary:
      "Legal documents in transit. Next day air delivery scheduled. Package scanned at distribution center at 8:30 AM. Expected delivery by 3:00 PM today.",
  },
  {
    id: "DEL-003",
    mailSubject: "Tax Documents - Q4 2024",
    deliveryAddress: "456 Innovation Way, Floor 12, Seattle, WA 98101",
    courier: "USPS Priority Mail",
    trackingNumber: "USPS7712334556",
    requestedAt: "Yesterday, 3:30 PM",
    timeShort: "Yesterday",
    status: "Delivered",
    requestedBy: "Michael Chen",
    recipientName: "Emily Davis",
    recipientPhone: "+1 (206) 555-0167",
    thumbnail:
      "https://readdy.ai/api/search-image?query=tax%20document%20envelope%20with%20financial%20papers%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=600&height=360&seq=cdel-3&orientation=landscape",
    aiSummary:
      "Tax documents delivered to Seattle office. Package signed for by Emily Davis at 2:45 PM yesterday. Delivery confirmation sent to company email.",
  },
  {
    id: "DEL-005",
    mailSubject: "Vendor Invoices - Multiple Documents",
    deliveryAddress: "555 Commerce Street, Floor 8, Dallas, TX 75201",
    courier: "FedEx Ground",
    trackingNumber: "FDX2234567890",
    requestedAt: "Yesterday, 10:00 AM",
    timeShort: "Yesterday",
    status: "Pending",
    requestedBy: "David Wilson",
    recipientName: "Lisa Anderson",
    recipientPhone: "+1 (214) 555-0189",
    notes: "Multiple documents - handle with care",
    thumbnail:
      "https://readdy.ai/api/search-image?query=business%20invoice%20envelope%20with%20multiple%20documents%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=600&height=360&seq=cdel-5&orientation=landscape",
    aiSummary:
      "Vendor invoice package awaiting courier pickup. Multiple documents inside. Expected delivery within 3-5 business days.",
  },
  {
    id: "DEL-006",
    mailSubject: "Financial Reports - Annual Review",
    deliveryAddress: "888 Financial Plaza, Suite 1500, New York, NY 10004",
    courier: "UPS Ground",
    trackingNumber: "UPS1122334455",
    requestedAt: "Jun 11, 4:20 PM",
    timeShort: "Jun 11",
    status: "Confirmed",
    requestedBy: "Lisa Anderson",
    recipientName: "Robert Taylor",
    recipientPhone: "+1 (212) 555-0134",
    thumbnail:
      "https://readdy.ai/api/search-image?query=financial%20report%20envelope%20with%20annual%20documents%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=600&height=360&seq=cdel-6&orientation=landscape",
    aiSummary: "Annual financial reports delivered and confirmed received by Robert Taylor on June 11.",
  },
  {
    id: "DEL-007",
    mailSubject: "Client Correspondence - Proposal Documents",
    deliveryAddress: "222 Enterprise Avenue, Building B, Boston, MA 02101",
    courier: "FedEx 2Day",
    trackingNumber: "FDX5566778899",
    requestedAt: "Jun 11, 11:45 AM",
    timeShort: "Jun 11",
    status: "On the Way",
    requestedBy: "Robert Taylor",
    recipientName: "Jennifer Martinez",
    recipientPhone: "+1 (617) 555-0176",
    thumbnail:
      "https://readdy.ai/api/search-image?query=business%20proposal%20envelope%20with%20client%20documents%20on%20white%20background%20professional%20mail%20package%20scanned&width=600&height=360&seq=cdel-7&orientation=landscape",
    aiSummary:
      "Client proposal documents in transit to Boston office. Two-day delivery service. Expected delivery tomorrow by end of day.",
  },
  {
    id: "DEL-004",
    mailSubject: "Insurance Policy Documents",
    deliveryAddress: "321 Corporate Blvd, Suite 200, Chicago, IL 60601",
    courier: "DHL Express",
    trackingNumber: "DHL4456778899",
    requestedAt: "Yesterday, 1:15 PM",
    timeShort: "Yesterday",
    status: "Failed",
    requestedBy: "Emily Davis",
    recipientName: "David Wilson",
    recipientPhone: "+1 (312) 555-0145",
    notes: "Recipient unavailable - package held at facility. Please arrange redelivery.",
    thumbnail:
      "https://readdy.ai/api/search-image?query=insurance%20document%20envelope%20with%20policy%20papers%20on%20white%20background%20professional%20mail%20package%20scanned&width=600&height=360&seq=cdel-4&orientation=landscape",
    aiSummary:
      "Delivery attempt failed - recipient not available at delivery address. Package held at local DHL facility.",
  },
];

const statusConfig: Record<
  DeliveryStatus,
  { color: string; icon: string; bgBanner: string; textBanner: string; borderBanner: string }
> = {
  Pending: {
    color: "bg-amber-100 text-amber-700",
    icon: "ri-time-line",
    bgBanner: "bg-amber-50",
    textBanner: "text-amber-800",
    borderBanner: "border-amber-200",
  },
  "On the Way": {
    color: "bg-blue-100 text-blue-700",
    icon: "ri-truck-line",
    bgBanner: "bg-blue-50",
    textBanner: "text-blue-800",
    borderBanner: "border-blue-200",
  },
  Delivered: {
    color: "bg-green-100 text-[#2F8F3A]",
    icon: "ri-checkbox-circle-line",
    bgBanner: "bg-green-50",
    textBanner: "text-green-800",
    borderBanner: "border-green-200",
  },
  Confirmed: {
    color: "bg-teal-100 text-teal-700",
    icon: "ri-verified-badge-line",
    bgBanner: "bg-teal-50",
    textBanner: "text-teal-800",
    borderBanner: "border-teal-200",
  },
  Failed: {
    color: "bg-red-100 text-red-700",
    icon: "ri-close-circle-line",
    bgBanner: "bg-red-50",
    textBanner: "text-red-800",
    borderBanner: "border-red-200",
  },
};

export default function CustomerDeliveryRequestsPage() {
  const [requests, setRequests] = useState<CustomerDeliveryRequest[]>(mockDeliveries);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<CustomerDeliveryRequest | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.mailSubject.toLowerCase().includes(search.toLowerCase()) ||
      r.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.courier.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const allStatuses: DeliveryStatus[] = ["Pending", "On the Way", "Delivered", "Confirmed", "Failed"];

  const counts: Record<string, number> = {
    All: requests.length,
    ...Object.fromEntries(allStatuses.map((s) => [s, requests.filter((r) => r.status === s).length])),
  };

  const handleConfirmReceived = (id: string) => {
    setConfirmingId(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Confirmed" as const } : r)));
      setSelectedRequest((prev) => (prev && prev.id === id ? { ...prev, status: "Confirmed" } : prev));
      setConfirmingId(null);
      setShowConfirmSuccess(true);
      setTimeout(() => setShowConfirmSuccess(false), 3000);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Requests</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track the delivery status of your mail packages</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                {counts.Pending} Pending
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {counts["On the Way"]} On the Way
              </span>
              <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                {counts.Delivered} Delivered
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-5">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-md">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by subject, tracking number, courier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0A3D8F] transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center px-4 overflow-x-auto">
            {(["All", ...allStatuses] as const).map((tab) => (
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
                  {counts[tab] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 mb-5 flex items-start gap-3">
          <i className="ri-mail-check-line text-blue-500 text-lg mt-0.5 flex-shrink-0"></i>
          <div>
            <p className="text-sm font-semibold text-blue-800">Package Confirmation Email</p>
            <p className="text-xs text-blue-600 mt-0.5">
              When your package is delivered, you will receive an email with a <strong>Got the Package</strong>{" "}
              confirmation button. You can also confirm directly from this page by clicking on any delivered request.
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="ri-truck-line text-gray-400 text-3xl"></i>
            </div>
            <p className="text-gray-500 font-medium">No delivery requests found</p>
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
                      <img src={req.thumbnail} alt="mail" className="w-full h-full object-cover object-top" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{req.id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                          <i className={`${cfg.icon} mr-1 text-xs`}></i>
                          {req.status}
                        </span>
                        {req.status === "Delivered" && (
                          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full animate-pulse">
                            <i className="ri-hand-heart-line mr-1 text-xs"></i>Tap to confirm receipt
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-gray-900 mt-0.5 truncate">{req.mailSubject}</p>
                      <p className="text-xs text-gray-500 truncate">
                        <i className="ri-map-pin-line mr-1 text-gray-400"></i>
                        {req.deliveryAddress}
                      </p>
                    </div>

                    <div className="flex-shrink-0 hidden md:block">
                      <p className="text-xs text-gray-400">Courier</p>
                      <p className="text-sm font-semibold text-gray-700">{req.courier}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{req.trackingNumber}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400">{req.timeShort}</p>
                    </div>

                    <i className="ri-arrow-right-s-line text-gray-300 text-xl flex-shrink-0"></i>
                  </div>

                  {req.status === "On the Way" && (
                    <div className="mx-5 mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>In transit</span>
                        <span className="font-medium text-blue-600">On the Way</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>Picked up</span>
                        <span>In Transit</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}

                  {req.status === "Failed" && req.notes && (
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
            setShowConfirmSuccess(false);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <i className="ri-truck-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delivery Request</h2>
                  <p className="text-xs text-gray-400">
                    {selectedRequest.id} - {selectedRequest.requestedAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setShowConfirmSuccess(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-gray-600 text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="w-full h-52 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={selectedRequest.thumbnail}
                  alt="mail package"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {(() => {
                const cfg = statusConfig[selectedRequest.status];
                return (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.bgBanner} ${cfg.borderBanner}`}>
                    <i
                      className={`${cfg.icon} text-xl ${
                        selectedRequest.status === "Pending"
                          ? "text-amber-600"
                          : selectedRequest.status === "On the Way"
                            ? "text-blue-600"
                            : selectedRequest.status === "Delivered"
                              ? "text-green-600"
                              : selectedRequest.status === "Confirmed"
                                ? "text-teal-600"
                                : "text-red-600"
                      }`}
                    ></i>
                    <div>
                      <p className={`text-sm font-bold ${cfg.textBanner}`}>
                        {selectedRequest.status === "Pending" && "Awaiting Dispatch"}
                        {selectedRequest.status === "On the Way" && "Package is On the Way"}
                        {selectedRequest.status === "Delivered" && "Package Delivered - Please Confirm Receipt"}
                        {selectedRequest.status === "Confirmed" && "Package Confirmed Received"}
                        {selectedRequest.status === "Failed" && "Delivery Failed"}
                      </p>
                      <p className={`text-xs mt-0.5 ${cfg.textBanner} opacity-80`}>
                        {selectedRequest.status === "Pending" &&
                          "Your delivery request is queued and will be dispatched soon."}
                        {selectedRequest.status === "On the Way" &&
                          "Your package is currently in transit and on its way to you."}
                        {selectedRequest.status === "Delivered" &&
                          "Please confirm you have received the package using the button below, or via the email we sent you."}
                        {selectedRequest.status === "Confirmed" &&
                          "Thank you for confirming. Delivery is marked as completed."}
                        {selectedRequest.status === "Failed" &&
                          (selectedRequest.notes || "Delivery could not be completed. Please contact support.")}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Mail Subject</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.mailSubject}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Delivery Address</p>
                  <div className="flex items-start gap-2">
                    <i className="ri-map-pin-line text-[#0A3D8F] text-base flex-shrink-0 mt-0.5"></i>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.deliveryAddress}</p>
                  </div>
                  {selectedRequest.recipientName && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#0A3D8F]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-user-line text-[#0A3D8F] text-sm"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.recipientName}</p>
                        {selectedRequest.recipientPhone && (
                          <p className="text-xs text-gray-400">{selectedRequest.recipientPhone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Courier</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.courier}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">{selectedRequest.trackingNumber}</p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-gray-50 rounded-xl border border-[#0A3D8F]/10">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-sparkling-line text-amber-500 text-lg"></i>
                  <h3 className="text-sm font-bold text-gray-800">Summary</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedRequest.aiSummary}</p>
              </div>

              {selectedRequest.status === "Delivered" && (
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="ri-mail-check-line text-green-600 text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-800">Confirm Package Receipt</p>
                      <p className="text-xs text-green-600 mt-1">
                        Click the button below (or use the link in your email) to confirm you have received this package.
                        This will mark the delivery as completed.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmReceived(selectedRequest.id);
                        }}
                        disabled={confirmingId === selectedRequest.id}
                        className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#2F8F3A] text-white text-sm font-bold rounded-lg hover:bg-[#267a30] transition-colors cursor-pointer disabled:opacity-70 whitespace-nowrap"
                      >
                        {confirmingId === selectedRequest.id ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-base"></i>
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-checkbox-circle-fill text-base"></i>
                            <span>Got the Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.status === "Confirmed" && (
                <div className="flex items-center gap-3 px-5 py-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-verified-badge-fill text-teal-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-teal-800">Package Receipt Confirmed</p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      You have confirmed receipt of this package. Delivery is now fully completed.
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.status === "On the Way" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-truck-line text-blue-600 text-lg"></i>
                    <p className="text-sm font-bold text-blue-800">Shipment Progress</p>
                  </div>
                  <div className="relative">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Picked Up</span>
                      <span className="font-semibold text-blue-600">In Transit</span>
                      <span>Delivered</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setShowConfirmSuccess(false);
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

      {showConfirmSuccess && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 bg-teal-600 text-white rounded-xl shadow-lg">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <div>
            <p className="text-sm font-bold">Package Confirmed!</p>
            <p className="text-xs opacity-80">Delivery has been marked as completed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
