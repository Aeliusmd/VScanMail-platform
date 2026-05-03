"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { mailApi, type MailItem, type MailStatus as ApiMailStatus } from "@/lib/api/mail";
import { deliveryAddressesApi, type DeliveryAddress } from "@/lib/api/delivery-addresses";
import { deliveriesApi } from "@/lib/api/deliveries";
import { isUspsMailingAddress } from "@/lib/usps-delivery-address";

type MailStatus = "Unread" | "Read" | "Archived";

interface Mail {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  preview: string;
  body: string;
  date: string;
  timeShort: string;
  status: MailStatus;
  category: string;
  hasAttachment: boolean;
  thumbnail: string;
  scannedPages: number;
  aiSummary: string;
  starred: boolean;
  tag: string;
  tagColor: string;
}

function mapApiStatusToUi(status: ApiMailStatus): MailStatus {
  // Backend statuses: received|scanned|processed|delivered
  return status === "received" ? "Unread" : "Read";
}

function mapMailTypeToTag(type: MailItem["type"]) {
  switch (type) {
    case "letter":
      return { tag: "Letter", tagColor: "bg-[#0A3D8F]/10 text-[#0A3D8F]" };
    case "package":
      return { tag: "Package", tagColor: "bg-green-100 text-[#2F8F3A]" };
    case "legal":
      return { tag: "Legal", tagColor: "bg-amber-100 text-amber-700" };
    case "cheque":
      return { tag: "Cheque", tagColor: "bg-amber-100 text-amber-700" };
    default:
      return { tag: "Mail", tagColor: "bg-slate-100 text-slate-600" };
  }
}

const statusColors: Record<MailStatus, string> = {
  Unread: "bg-[#0A3D8F]/10 text-[#0A3D8F]",
  Read: "bg-slate-100 text-slate-600",
  Archived: "bg-amber-100 text-amber-700",
};

export default function CustomerMailsPage() {
  const params = useParams<{ clientId?: string }>();
  const clientId = params?.clientId;
  const deliveryAddressHref = clientId
    ? `/customer/${clientId}/account?tab=delivery-addresses`
    : "/customer/account?tab=delivery-addresses";
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [selectedMailItem, setSelectedMailItem] = useState<MailItem | null>(null);
  const [selectedMailItemLoading, setSelectedMailItemLoading] = useState(false);
  const [selectedMailItemError, setSelectedMailItemError] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [pickupModalMail, setPickupModalMail] = useState<Mail | null>(null);
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupSubmitting, setPickupSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const archived = statusFilter === "Archived" ? true : undefined;

        const data = await mailApi.list({
          limit: 100,
          archived,
        });

        if (cancelled) return;

        const mapped = data.items.map((m) => {
          const { tag, tagColor } = mapMailTypeToTag(m.type);
          const created = m.created_at ? new Date(m.created_at) : null;
          const date = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString() : "—";
          const timeShort =
            created && !Number.isNaN(created.getTime())
              ? created.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "—";
          const preview = (m.ocr_text || m.ai_summary || "").slice(0, 160);

          return {
            id: m.id,
            subject: m.ai_summary || m.irn || "Mail item",
            sender: m.irn || "VScan Mail",
            senderEmail: "",
            preview,
            body: m.ocr_text || "",
            date,
            timeShort,
            status: mapApiStatusToUi(m.status),
            category: m.type,
            hasAttachment: (m.content_scan_urls || []).length > 0,
            thumbnail: m.envelope_front_url || "",
            scannedPages: (m.content_scan_urls || []).length,
            aiSummary: m.ai_summary || "",
            starred: false,
            tag,
            tagColor,
          } satisfies Mail;
        });

        setMails(mapped);
      } catch (e) {
        console.error("Failed to load mails:", e);
        if (!cancelled) setMails([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await deliveryAddressesApi.list();
        if (cancelled) return;
        setDeliveryAddresses(list);
      } catch (e) {
        console.error("Failed to load delivery addresses:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const uspsAddresses = useMemo(
    () => deliveryAddresses.filter((a) => isUspsMailingAddress(a)),
    [deliveryAddresses]
  );

  useEffect(() => {
    if (uspsAddresses.length === 0) return;
    if (!selectedDeliveryAddress || !uspsAddresses.some((a) => a.id === selectedDeliveryAddress)) {
      setSelectedDeliveryAddress(uspsAddresses[0].id);
    }
  }, [deliveryAddresses, uspsAddresses, selectedDeliveryAddress]);

  const filtered = useMemo(
    () =>
      mails.filter((m) => {
        const matchSearch =
          m.subject.toLowerCase().includes(search.toLowerCase()) ||
          m.sender.toLowerCase().includes(search.toLowerCase()) ||
          m.preview.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || m.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [mails, search, statusFilter]
  );

  const unreadCount = mails.filter((m) => m.status === "Unread").length;

  const toggleStar = (id: string) => {
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));
    if (selectedMail?.id === id) setSelectedMail((prev) => (prev ? { ...prev, starred: !prev.starred } : null));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCheck = () => {
    if (allChecked) {
      setCheckedIds(new Set());
      setAllChecked(false);
    } else {
      setCheckedIds(new Set(filtered.map((m) => m.id)));
      setAllChecked(true);
    }
  };

  const openMail = (mail: Mail) => {
    setMails((prev) => prev.map((m) => (m.id === mail.id ? { ...m, status: m.status === "Unread" ? "Read" : m.status } : m)));
    setSelectedMail({ ...mail, status: mail.status === "Unread" ? "Read" : mail.status });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedMail?.id) {
        setSelectedMailItem(null);
        setSelectedMailItemLoading(false);
        setSelectedMailItemError(null);
        return;
      }

      try {
        setSelectedMailItem(null);
        setSelectedMailItemError(null);
        setSelectedMailItemLoading(true);

        const item = await mailApi.getById(selectedMail.id);
        if (cancelled) return;

        setSelectedMailItem(item);
        const preview = (item.ocr_text || item.ai_summary || "").slice(0, 160);
        setSelectedMail((prev) =>
          prev && prev.id === item.id
            ? {
                ...prev,
                thumbnail: item.envelope_front_url || "",
                body: item.ocr_text || "",
                scannedPages: (item.content_scan_urls || []).length,
                aiSummary: item.ai_summary || "",
                preview,
              }
            : prev
        );
      } catch (e) {
        console.error("Failed to load mail details:", e);
        if (cancelled) return;
        setSelectedMailItem(null);
        setSelectedMailItemError("Failed to load mail images/details.");
      } finally {
        if (!cancelled) setSelectedMailItemLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMail?.id]);

  useEffect(() => {
    if (!zoomUrl) return;

    const getImages = () => {
      return [
        selectedMailItem?.envelope_front_url || selectedMail?.thumbnail || null,
        selectedMailItem?.envelope_back_url || null,
        ...((selectedMailItem?.content_scan_urls || []).filter(Boolean) as string[]),
      ].filter(Boolean) as string[];
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomUrl(null);
        setZoomScale(1);
        return;
      }

      const images = getImages();
      if (images.length <= 1) return;

      if (e.key === "ArrowLeft") {
        setImgIndex((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setImgIndex((i) => (i + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomUrl, selectedMailItem, selectedMail?.thumbnail]);

  const archiveMail = (id: string) => {
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, status: "Archived" } : m)));
    if (selectedMail?.id === id) setSelectedMail((prev) => (prev ? { ...prev, status: "Archived" } : null));
  };

  const handleMailPickup = async () => {
    if (!pickupModalMail) return;
    if (!selectedDeliveryAddress) {
      setPickupError("Please select a delivery address.");
      return;
    }
    const addr = deliveryAddresses.find((a) => a.id === selectedDeliveryAddress);
    if (!addr || !isUspsMailingAddress(addr)) {
      setPickupError(
        "Choose a USPS-compatible US address (2-letter state, ZIP 12345 or ZIP+4). Update your addresses under Account → Delivery addresses."
      );
      return;
    }
    try {
      setPickupSubmitting(true);
      setPickupError(null);
      await deliveriesApi.requestMailDelivery(pickupModalMail.id, {
        addressId: selectedDeliveryAddress,
        preferredDate: pickupDate || undefined,
        notes: pickupNotes || undefined,
      });
      setPickupModalMail(null);
      setPickupDate("");
      setPickupNotes("");
    } catch (e: any) {
      setPickupError(e?.message || "Failed to submit pickup request.");
    } finally {
      setPickupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-3 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:flex-1 sm:max-w-xl">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"></i>
              <input
                type="text"
                placeholder="Search mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-0 outline-none text-sm transition-all"
              />
            </div>
            <div className="flex items-center text-xs sm:text-sm text-slate-500 shrink-0">
              <span className="font-semibold text-slate-800">{mails.length}</span>
              <span className="mx-1.5 hidden sm:inline">&nbsp;•&nbsp;</span>
              <span className="font-semibold text-[#0A3D8F]">{unreadCount} unread</span>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAllCheck}
                className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
              />
              <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer">
                <i className="ri-arrow-down-s-line text-slate-500 text-sm"></i>
              </button>
            </div>
            {checkedIds.size > 0 && (
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => {
                    checkedIds.forEach((id) => archiveMail(id));
                    setCheckedIds(new Set());
                    setAllChecked(false);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Archive"
                >
                  <i className="ri-archive-line text-slate-500 text-base"></i>
                </button>
                <button
                  className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Mark as read"
                  onClick={() => {
                    setMails((prev) => prev.map((m) => (checkedIds.has(m.id) ? { ...m, status: "Read" } : m)));
                    setCheckedIds(new Set());
                    setAllChecked(false);
                  }}
                >
                  <i className="ri-mail-open-line text-slate-500 text-base"></i>
                </button>
                <button
                  className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                  title="Delete selected"
                  onClick={async () => {
                    if (!confirm(`Remove ${checkedIds.size} mail item(s) from your view? This only affects your portal.`)) return;
                    const ids = Array.from(checkedIds);
                    await Promise.all(ids.map((id) => fetch(`/api/records/mail/${id}`, { method: "DELETE" })));
                    setMails((prev) => prev.filter((m) => !checkedIds.has(m.id)));
                    setCheckedIds(new Set());
                    setAllChecked(false);
                  }}
                >
                  <i className="ri-delete-bin-line text-red-500 text-base"></i>
                </button>
                <span className="text-xs text-slate-500 ml-1">{checkedIds.size} selected</span>
              </div>
            )}
            <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
              <i className="ri-refresh-line text-slate-500 text-base"></i>
            </button>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              1–{filtered.length} of {mails.length}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <i className="ri-arrow-left-s-line text-slate-500 text-base"></i>
              </button>
              <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <i className="ri-arrow-right-s-line text-slate-500 text-base"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-thin [scrollbar-width:thin]">
          {["All", "Unread", "Read", "Archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? "border-[#0A3D8F] text-[#0A3D8F]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
              {tab !== "All" && (
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab ? "bg-[#0A3D8F]/10 text-[#0A3D8F]" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {mails.filter((m) => m.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mail List */}
        <main className="flex-1 overflow-y-auto bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <i className="ri-mail-line text-slate-400 text-3xl"></i>
              </div>
              <p className="text-slate-500 font-medium">No mails found</p>
              <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((mail) => (
                <div
                  key={mail.id}
                  className="group flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openMail(mail)}
                >
                  <div className="flex items-center gap-2 sm:mr-2">
                    <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(mail.id)}
                        onChange={() => toggleCheck(mail.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                      />
                    </div>
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(mail.id);
                      }}
                    >
                      <i
                        className={`${
                          mail.starred
                            ? "ri-star-fill text-amber-400"
                            : "ri-star-line text-slate-300 group-hover:text-slate-400"
                        } text-lg cursor-pointer transition-colors`}
                      ></i>
                    </div>
                    <div className="flex-shrink-0">
                      <i
                        className={`ri-bookmark-fill text-sm ${
                          mail.status === "Unread" ? "text-amber-400" : "text-slate-200"
                        }`}
                      ></i>
                    </div>
                    <span
                      className={`sm:hidden ml-auto text-xs shrink-0 ${
                        mail.status === "Unread" ? "font-bold text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {mail.timeShort}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-2 sm:w-44 sm:flex-shrink-0">
                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold">
                        {(mail.sender.split("-").pop() || mail.sender).charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`min-w-0 truncate text-sm ${
                          mail.status === "Unread" ? "font-bold text-slate-900" : "font-medium text-slate-600"
                        }`}
                      >
                        {mail.sender}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:mr-4">
                      <span className={`inline-flex shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${mail.tagColor}`}>
                        {mail.tag}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-sm sm:truncate ${
                          mail.status === "Unread" ? "font-bold text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {mail.subject}
                      </span>
                      <span className="w-full text-sm text-slate-400 line-clamp-2 sm:line-clamp-1 lg:max-w-md lg:truncate">
                        {mail.preview}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 sm:flex-shrink-0 sm:justify-start">
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setPickupError(null);
                            setPickupModalMail(mail);
                            const first = uspsAddresses[0]?.id;
                            if (first) setSelectedDeliveryAddress(first);
                          }}
                          className="min-h-[44px] px-3 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer sm:px-2.5 sm:py-1"
                        >
                          Pickup
                        </button>
                      </div>
                      {mail.hasAttachment && <i className="ri-attachment-2 text-slate-400 text-base"></i>}
                      <span className="hidden text-right text-xs text-slate-400 lg:inline lg:w-12">{mail.scannedPages}p</span>
                      <span
                        className={`hidden text-right text-xs sm:inline sm:w-14 ${
                          mail.status === "Unread" ? "font-bold text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {mail.timeShort}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mail Detail Modal */}
      {selectedMail && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 md:p-6"
          onClick={() => setSelectedMail(null)}
        >
          <div
            className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="hidden w-10 h-10 shrink-0 bg-[#0A3D8F]/10 rounded-lg sm:flex items-center justify-center">
                  <i className="ri-mail-open-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">{selectedMail.subject}</h2>
                  <p className="text-xs text-slate-500 break-words">
                    {(selectedMailItem as any)?.irn || selectedMail.sender} • {selectedMail.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMail(null)}
                className="self-end p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer sm:self-auto"
              >
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="space-y-3">
                {selectedMailItemLoading && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    Loading mail details…
                  </div>
                )}
                {selectedMailItemError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    {selectedMailItemError}
                  </div>
                )}

                {(() => {
                  const images = [
                    selectedMailItem?.envelope_front_url || selectedMail.thumbnail || null,
                    selectedMailItem?.envelope_back_url || null,
                    ...((selectedMailItem?.content_scan_urls || []).filter(Boolean) as string[]),
                  ].filter(Boolean) as string[];

                  const clampedIndex =
                    images.length === 0 ? 0 : Math.min(Math.max(imgIndex, 0), images.length - 1);
                  const activeUrl = images[clampedIndex];

                  const label =
                    clampedIndex === 0
                      ? "Envelope front"
                      : clampedIndex === 1
                        ? "Envelope back"
                        : `Scan ${clampedIndex - 1}`;

                  if (images.length === 0) {
                    return (
                      <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
                        Image not available
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-slate-200 bg-black/5">
                        <img
                          src={activeUrl}
                          alt={label}
                          className="w-full h-full object-contain bg-white"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setZoomUrl(activeUrl);
                            setZoomScale(1);
                          }}
                          className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors"
                          title="Zoom"
                        >
                          <i className="ri-zoom-in-line text-base"></i>
                          Zoom
                        </button>

                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              aria-label="Previous image"
                              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:bg-white transition-colors flex items-center justify-center"
                            >
                              <i className="ri-arrow-left-s-line text-slate-800 text-xl"></i>
                            </button>
                            <button
                              type="button"
                              aria-label="Next image"
                              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:bg-white transition-colors flex items-center justify-center"
                            >
                              <i className="ri-arrow-right-s-line text-slate-800 text-xl"></i>
                            </button>
                          </>
                        )}

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-white flex items-center gap-2">
                          <span className="tabular-nums">
                            {clampedIndex + 1} / {images.length}
                          </span>
                          <span className="opacity-90">{label}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((u, idx) => {
                          const isActive = idx === clampedIndex;
                          const thumbLabel =
                            idx === 0 ? "Front" : idx === 1 ? "Back" : `S${idx - 1}`;
                          return (
                            <button
                              key={`${u}-${idx}`}
                              type="button"
                              onClick={() => setImgIndex(idx)}
                              className={`relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-white ${
                                isActive ? "border-[#0A3D8F] ring-2 ring-[#0A3D8F]/30" : "border-slate-200"
                              }`}
                              aria-label={`View ${thumbLabel}`}
                            >
                              <img src={u} alt={thumbLabel} className="h-full w-full object-cover object-top" />
                              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5">
                                {thumbLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                if (!selectedMailItem) return null;

                const riskRaw = (selectedMailItem as any)?.ai_risk_level;
                const risk = typeof riskRaw === "string" && riskRaw.length ? riskRaw : "none";
                const tamperDetected = (selectedMailItem as any)?.tamper_detected === true;
                const findings = Array.isArray((selectedMailItem as any)?.tamper_annotations?.findings)
                  ? ((selectedMailItem as any).tamper_annotations.findings as any[])
                  : [];

                const severity =
                  tamperDetected || risk === "critical" || risk === "high"
                    ? "danger"
                    : risk === "medium"
                      ? "warn"
                      : "safe";

                const ui =
                  severity === "danger"
                    ? {
                        wrap: "bg-rose-50 border-rose-200",
                        icon: "ri-shield-keyhole-line",
                        iconColor: "text-rose-600",
                        title: "Security Analysis: Attention required",
                        titleColor: "text-rose-900",
                        meta: "text-rose-800",
                        chip: "bg-rose-100 text-rose-800",
                      }
                    : severity === "warn"
                      ? {
                          wrap: "bg-amber-50 border-amber-200",
                          icon: "ri-shield-line",
                          iconColor: "text-amber-600",
                          title: "Security Analysis: Review recommended",
                          titleColor: "text-amber-900",
                          meta: "text-amber-800",
                          chip: "bg-amber-100 text-amber-800",
                        }
                      : {
                          wrap: "bg-emerald-50 border-emerald-200",
                          icon: "ri-shield-check-line",
                          iconColor: "text-emerald-700",
                          title: "Security Analysis: Looks good",
                          titleColor: "text-emerald-900",
                          meta: "text-emerald-800",
                          chip: "bg-emerald-100 text-emerald-800",
                        };

                return (
                  <div className={`rounded-xl border p-4 ${ui.wrap}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/60 border border-white ${ui.iconColor}`}>
                          <i className={`${ui.icon} text-xl`}></i>
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-bold ${ui.titleColor}`}>{ui.title}</div>
                          <div className={`text-xs mt-1 ${ui.meta}`}>
                            <span className="font-semibold">Risk:</span> {String(risk).toUpperCase()} •{" "}
                            <span className="font-semibold">Tamper:</span> {tamperDetected ? "Detected" : "Not detected"}
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ui.chip}`}>
                        {tamperDetected ? "TAMPER" : String(risk).toUpperCase()}
                      </span>
                    </div>

                    {findings.length ? (
                      <div className="mt-3 rounded-xl bg-white/60 border border-white p-3">
                        <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <i className="ri-radar-line text-slate-600"></i>
                          Findings
                        </div>
                        <div className="space-y-2">
                          {findings.slice(0, 6).map((f, idx) => {
                            const desc = f?.description || f?.message || f?.type || "Finding";
                            const conf =
                              typeof f?.confidence === "number" && Number.isFinite(f.confidence)
                                ? `${Math.round(f.confidence * 100)}%`
                                : null;

                            return (
                              <div key={`${idx}-${String(desc)}`} className="flex items-start gap-2 text-xs text-slate-700">
                                <span
                                  className={`mt-1 inline-flex h-2 w-2 rounded-full ${
                                    severity === "danger"
                                      ? "bg-rose-500"
                                      : severity === "warn"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                  }`}
                                ></span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-800 break-words">{String(desc)}</div>
                                  {conf && <div className="text-[11px] text-slate-500 mt-0.5">Conf: {conf}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">From</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {selectedMail.sender.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedMail.sender}</p>
                      <p className="text-xs text-slate-500">{selectedMail.senderEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Status & Category</p>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selectedMail.status]}`}>
                      {selectedMail.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${selectedMail.tagColor}`}>
                      {selectedMail.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{selectedMail.scannedPages} scanned pages</p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
                <div className="flex items-center space-x-2 mb-3">
                  <i className="ri-sparkling-line text-amber-500 text-lg"></i>
                  <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMailItem?.ai_summary || selectedMail.aiSummary || "—"}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <i className="ri-robot-line text-[#0A3D8F] text-sm"></i>
                  <span className="text-xs text-slate-400">Generated by VScan AI</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Document Content</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{selectedMailItem?.ocr_text || selectedMail.body || "—"}</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-stretch">
                <button
                  type="button"
                  className="w-full py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                >
                  <i className="ri-download-line mr-2"></i>Download PDF
                </button>
                {selectedMail.status !== "Archived" && (
                  <button
                    type="button"
                    onClick={() => {
                      archiveMail(selectedMail.id);
                      setSelectedMail(null);
                    }}
                    className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                  >
                    <i className="ri-archive-line mr-2"></i>Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMail(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm cursor-pointer sm:w-auto sm:px-5 sm:flex-shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pickupModalMail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPickupModalMail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Request Pickup Delivery</h2>
              <button onClick={() => setPickupModalMail(null)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-slate-500 text-lg"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900">{pickupModalMail.subject}</p>
                <p className="text-xs text-slate-600 mt-1">IRN: {pickupModalMail.sender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Address</label>
                {deliveryAddresses.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                    <i className="ri-map-pin-add-line text-2xl text-slate-400"></i>
                    <p className="text-sm text-slate-600">No delivery addresses saved yet.</p>
                    <Link
                      href={deliveryAddressHref}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A3D8F] text-white text-sm font-medium rounded-lg hover:bg-[#083170]"
                    >
                      <i className="ri-add-line"></i>
                      Add New Address
                    </Link>
                  </div>
                ) : uspsAddresses.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-sm text-amber-900">
                    <p>
                      None of your saved addresses meet USPS rules for physical mail (country US, 2-letter state, ZIP
                      12345 or ZIP+4). Edit or add an address to continue.
                    </p>
                    <Link
                      href={deliveryAddressHref}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#0A3D8F] hover:underline"
                    >
                      Open delivery addresses
                      <i className="ri-arrow-right-line"></i>
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedDeliveryAddress}
                    onChange={(e) => setSelectedDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30"
                  >
                    {uspsAddresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label} - {addr.recipientName}, {addr.city}, {addr.state} {addr.zip}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value.slice(0, 500))}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30 resize-none"
                />
              </div>
              {pickupError && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{pickupError}</div>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setPickupModalMail(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMailPickup}
                  disabled={pickupSubmitting || !selectedDeliveryAddress || uspsAddresses.length === 0}
                  className="flex-1 py-3 bg-[#0A3D8F] text-white rounded-lg text-sm font-semibold hover:bg-[#083170] cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pickupSubmitting ? "Submitting..." : "Submit Pickup Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mail Image Zoom Lightbox */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setZoomUrl(null);
            setZoomScale(1);
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={zoomUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open / Download"
            >
              <i className="ri-download-2-line text-base"></i>
              Download
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2 text-white hover:bg-white/15 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setZoomUrl(null);
                setZoomScale(1);
              }}
              title="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div
            className="absolute top-4 left-4 flex items-center gap-2 rounded-2xl bg-white/10 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoomScale((s) => Math.max(1, Math.round((s - 0.25) * 100) / 100))}
              title="Zoom out"
            >
              <i className="ri-zoom-out-line text-lg"></i>
            </button>
            <div className="px-2 text-xs font-semibold text-white/90 min-w-14 text-center select-none">
              {zoomScale.toFixed(2)}x
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoomScale((s) => Math.min(4, Math.round((s + 0.25) * 100) / 100))}
              title="Zoom in"
            >
              <i className="ri-zoom-in-line text-lg"></i>
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoomScale(1)}
              title="Reset"
            >
              Reset
            </button>
          </div>

          <div className="absolute inset-0 pt-16 pb-8 px-4">
            <div className="h-full w-full overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="min-h-full min-w-full flex items-center justify-center py-6">
                <img
                  src={zoomUrl}
                  alt="Mail zoom"
                  className="max-w-none select-none cursor-grab active:cursor-grabbing transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

