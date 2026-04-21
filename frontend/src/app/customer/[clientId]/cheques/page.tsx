"use client";

import { useEffect, useMemo, useState } from "react";
import { chequeApi, type Cheque as ApiCheque, type ChequeStatus as ApiChequeStatus } from "@/lib/api/cheques";
import { mailApi, type MailItem } from "@/lib/api/mail";

type ChequeStatus = "Pending" | "Deposit Requested" | "Pickup Requested" | "Deposited" | "Picked Up";

interface Cheque {
  id: string;
  mailItemId: string;
  chequeNo: string;
  amount: string;
  from: string;
  bank: string;
  date: string;
  timeShort: string;
  status: ChequeStatus;
  memo: string;
  thumbnail: string;
  starred: boolean;
  read: boolean;
  tag: string;
  tagColor: string;
  aiSummary: string;
}

const BANK_ACCOUNTS = [
  { id: "ba1", bankName: "Bank of Commerce", accountName: "Acme Corp Operating", accountNo: "****4521", type: "Checking" },
  { id: "ba2", bankName: "First National Bank", accountName: "Acme Corp Savings", accountNo: "****8834", type: "Savings" },
];

function mapApiChequeStatusToUi(status: ApiChequeStatus): ChequeStatus {
  switch (status) {
    case "flagged":
      return "Pending";
    case "deposited":
      return "Deposited";
    case "cleared":
      return "Picked Up";
    case "approved":
    case "validated":
    default:
      return "Deposit Requested";
  }
}

const statusColors: Record<ChequeStatus, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "Deposit Requested": "bg-[#0A3D8F]/10 text-[#0A3D8F]",
  "Pickup Requested": "bg-[#0A3D8F]/10 text-[#0A3D8F]",
  Deposited: "bg-green-100 text-[#2F8F3A]",
  "Picked Up": "bg-slate-100 text-slate-600",
};

type ModalType = "deposit" | "pickup" | null;

export default function CustomerChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [selectedChequeMail, setSelectedChequeMail] = useState<MailItem | null>(null);
  const [selectedChequeMailLoading, setSelectedChequeMailLoading] = useState(false);
  const [selectedChequeMailError, setSelectedChequeMailError] = useState<string | null>(null);
  const [selectedChequeFull, setSelectedChequeFull] = useState<any | null>(null);
  const [selectedChequeFullLoading, setSelectedChequeFullLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalCheque, setModalCheque] = useState<Cheque | null>(null);
  const [selectedBank, setSelectedBank] = useState(BANK_ACCOUNTS[0].id);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await chequeApi.list({ limit: 200 });
        if (cancelled) return;

        const mapped = data.cheques.map((c: ApiCheque) => {
          const created = c.created_at ? new Date(c.created_at) : null;
          const date = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString() : "—";
          const timeShort =
            created && !Number.isNaN(created.getTime())
              ? created.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "—";

          const uiStatus = mapApiChequeStatusToUi(c.status);
          const tag =
            uiStatus === "Pending"
              ? "Pending"
              : uiStatus === "Deposited"
                ? "Deposited"
                : uiStatus === "Picked Up"
                  ? "Picked Up"
                  : "In Process";

          const tagColor =
            uiStatus === "Pending"
              ? "bg-amber-100 text-amber-700"
              : uiStatus === "Deposited"
                ? "bg-green-100 text-[#2F8F3A]"
                : uiStatus === "Picked Up"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-[#0A3D8F]/10 text-[#0A3D8F]";

          return {
            id: c.id,
            mailItemId: c.mail_item_id,
            chequeNo: c.id.slice(-6),
            amount: `$${Number(c.amount_figures || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            from: c.beneficiary || "Beneficiary",
            bank: "Bank",
            date,
            timeShort,
            status: uiStatus,
            memo: "",
            thumbnail: "",
            starred: false,
            read: false,
            tag,
            tagColor,
            aiSummary: c.ai_raw_result ? JSON.stringify(c.ai_raw_result) : "",
          } satisfies Cheque;
        });

        setCheques(mapped);
      } catch (e) {
        console.error("Failed to load cheques:", e);
        if (!cancelled) setCheques([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!zoomUrl) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomUrl(null);
        setZoomScale(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomUrl]);

  const filtered = useMemo(
    () =>
      cheques.filter((c) => {
        const matchSearch =
          c.from.toLowerCase().includes(search.toLowerCase()) ||
          c.bank.toLowerCase().includes(search.toLowerCase()) ||
          c.chequeNo.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || c.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [cheques, search, statusFilter]
  );

  const pendingCount = cheques.filter((c) => c.status === "Pending").length;
  const totalAmount = cheques.reduce((s, c) => s + parseFloat(c.amount.replace(/[$,]/g, "")), 0);

  const toggleStar = (id: string) => {
    setCheques((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));
    if (selectedCheque?.id === id) setSelectedCheque((prev) => (prev ? { ...prev, starred: !prev.starred } : null));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAllCheck = () => {
    if (allChecked) {
      setCheckedIds(new Set());
      setAllChecked(false);
    } else {
      setCheckedIds(new Set(filtered.map((c) => c.id)));
      setAllChecked(true);
    }
  };

  const openCheque = (cheque: Cheque) => {
    setCheques((prev) => prev.map((c) => (c.id === cheque.id ? { ...c, read: true } : c)));
    setSelectedCheque({ ...cheque, read: true });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedCheque?.mailItemId) {
        setSelectedChequeMail(null);
        setSelectedChequeMailLoading(false);
        setSelectedChequeMailError(null);
        setSelectedChequeFull(null);
        setSelectedChequeFullLoading(false);
        return;
      }

      try {
        setSelectedChequeMailLoading(true);
        setSelectedChequeFullLoading(true);
        setSelectedChequeMailError(null);
        const [mail, cheque] = await Promise.all([
          mailApi.getById(selectedCheque.mailItemId),
          chequeApi.getById(selectedCheque.id),
        ]);
        if (cancelled) return;
        setSelectedChequeMail(mail);
        setSelectedChequeFull(cheque);
      } catch (e) {
        console.error("Failed to load cheque mail item:", e);
        if (cancelled) return;
        setSelectedChequeMail(null);
        setSelectedChequeFull(null);
        setSelectedChequeMailError("Failed to load cheque images/details.");
      } finally {
        if (!cancelled) {
          setSelectedChequeMailLoading(false);
          setSelectedChequeFullLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCheque?.mailItemId]);

  const openModal = (cheque: Cheque, type: ModalType) => {
    setModalCheque(cheque);
    setModalType(type);
  };

  const handleDeposit = () => {
    if (!modalCheque) return;
    setCheques((prev) =>
      prev.map((c) =>
        c.id === modalCheque.id
          ? { ...c, status: "Deposit Requested", tag: "In Process", tagColor: "bg-[#0A3D8F]/10 text-[#0A3D8F]", read: true }
          : c
      )
    );
    if (selectedCheque?.id === modalCheque.id) setSelectedCheque(null);
    setModalType(null);
    setModalCheque(null);
    setSuccessMsg("Deposit request submitted successfully!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handlePickup = () => {
    if (!modalCheque) return;
    setCheques((prev) =>
      prev.map((c) =>
        c.id === modalCheque.id
          ? { ...c, status: "Pickup Requested", tag: "In Process", tagColor: "bg-[#0A3D8F]/10 text-[#0A3D8F]", read: true }
          : c
      )
    );
    if (selectedCheque?.id === modalCheque.id) setSelectedCheque(null);
    setModalType(null);
    setModalCheque(null);
    setPickupDate("");
    setPickupNotes("");
    setSuccessMsg("Pickup request submitted successfully!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const tabs = ["All", "Pending", "Deposit Requested", "Pickup Requested", "Deposited", "Picked Up"];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Success Toast */}
        {successMsg && (
          <div className="mx-3 mt-3 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl sm:mx-6">
            <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-lg"></i>
            <span className="text-[#2F8F3A] font-medium text-sm">{successMsg}</span>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-3 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:flex-1 sm:max-w-xl">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"></i>
              <input
                type="text"
                placeholder="Search cheques..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-0 outline-none text-sm transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 sm:text-sm shrink-0">
              <span>
                Total: <span className="font-semibold text-slate-800">${totalAmount.toLocaleString()}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="font-semibold text-amber-600">{pendingCount} pending</span>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
                <span className="text-xs text-slate-500 ml-1">{checkedIds.size} selected</span>
              </div>
            )}
            <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
              <i className="ri-refresh-line text-slate-500 text-base"></i>
            </button>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              1–{filtered.length} of {cheques.length}
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
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center gap-1 overflow-x-auto [scrollbar-width:thin]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 ${
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
                  {cheques.filter((c) => c.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cheque List */}
        <main className="flex-1 overflow-y-auto bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <i className="ri-bank-card-line text-slate-400 text-3xl"></i>
              </div>
              <p className="text-slate-500 font-medium">No cheques found</p>
              <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((cheque) => (
                <div
                  key={cheque.id}
                  className="group flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openCheque(cheque)}
                >
                  <div className="flex items-center gap-2 sm:mr-2">
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(cheque.id)}
                        onChange={() => toggleCheck(cheque.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                      />
                    </div>
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(cheque.id);
                      }}
                    >
                      <i
                        className={`${
                          cheque.starred
                            ? "ri-star-fill text-amber-400"
                            : "ri-star-line text-slate-300 group-hover:text-slate-400"
                        } text-lg cursor-pointer transition-colors`}
                      ></i>
                    </div>
                    <div className="flex-shrink-0">
                      <i className={`ri-bookmark-fill text-sm ${!cheque.read ? "text-amber-400" : "text-slate-200"}`}></i>
                    </div>
                    <span className={`sm:hidden ml-auto text-xs font-medium ${!cheque.read ? "text-slate-900" : "text-slate-500"}`}>
                      {cheque.amount}
                    </span>
                    <span className={`sm:hidden text-xs ${!cheque.read ? "font-bold text-slate-900" : "text-slate-500"}`}>
                      {cheque.timeShort}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-2 sm:w-40 sm:flex-shrink-0">
                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold">
                        {cheque.from.charAt(0)}
                      </div>
                      <span className={`min-w-0 truncate text-sm ${!cheque.read ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                        {cheque.from}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                      <span className={`inline-flex w-fit shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cheque.tagColor}`}>
                        {cheque.tag}
                      </span>
                      <span className={`text-sm sm:truncate ${!cheque.read ? "font-bold text-slate-900" : "text-slate-700"}`}>
                        {cheque.bank} – #{cheque.chequeNo}
                      </span>
                      <span className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-1 sm:text-sm xl:max-w-xs xl:truncate">{cheque.memo}</span>
                    </div>

                    <div className="hidden text-sm font-bold sm:block sm:w-24 sm:flex-shrink-0 sm:text-right">
                      <span className={!cheque.read ? "text-slate-900" : "text-slate-600"}>{cheque.amount}</span>
                    </div>

                    {cheque.status === "Pending" && (
                      <div className="flex w-full gap-2 sm:w-auto sm:flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openModal(cheque, "deposit")}
                          className="min-h-[44px] flex-1 px-3 py-2 bg-[#2F8F3A] text-white rounded-full text-xs font-semibold hover:bg-[#267a30] transition-colors cursor-pointer sm:flex-initial sm:px-2.5 sm:py-1"
                        >
                          Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(cheque, "pickup")}
                          className="min-h-[44px] flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer sm:flex-initial sm:px-2.5 sm:py-1"
                        >
                          Pickup
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 sm:flex-shrink-0 sm:justify-start">
                      <i className="ri-bank-line text-slate-300 text-base group-hover:text-slate-400 transition-colors hidden sm:block"></i>
                      <span className={`hidden text-xs sm:inline sm:w-14 sm:text-right ${!cheque.read ? "font-bold text-slate-900" : "text-slate-500"}`}>
                        {cheque.timeShort}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Cheque Detail Modal */}
      {selectedCheque && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 md:p-6"
          onClick={() => setSelectedCheque(null)}
        >
          <div
            className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="hidden w-10 h-10 shrink-0 bg-[#0A3D8F]/10 rounded-lg sm:flex items-center justify-center">
                  <i className="ri-bank-card-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">{selectedCheque.bank} Cheque</h2>
                  <p className="text-xs text-slate-500 break-words">
                    {selectedCheque.id} • #{selectedCheque.chequeNo} • {selectedCheque.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCheque(null)}
                className="self-end p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer sm:self-auto"
              >
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="space-y-3">
                {selectedChequeMailLoading && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    Loading cheque details…
                  </div>
                )}
                {selectedChequeMailError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    {selectedChequeMailError}
                  </div>
                )}

                {(() => {
                  if (!selectedChequeMail) return null;

                  const riskRaw = (selectedChequeMail as any)?.ai_risk_level;
                  const risk = typeof riskRaw === "string" && riskRaw.length ? riskRaw : "none";
                  const tamperDetected = (selectedChequeMail as any)?.tamper_detected === true;
                  const findings = Array.isArray((selectedChequeMail as any)?.tamper_annotations?.findings)
                    ? ((selectedChequeMail as any).tamper_annotations.findings as any[])
                    : [];
                  const topFinding = findings[0]?.description || findings[0]?.message || findings[0]?.type || null;

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
                        }
                      : severity === "warn"
                        ? {
                            wrap: "bg-amber-50 border-amber-200",
                            icon: "ri-shield-line",
                            iconColor: "text-amber-600",
                            title: "Security Analysis: Review recommended",
                            titleColor: "text-amber-900",
                            meta: "text-amber-800",
                          }
                        : {
                            wrap: "bg-emerald-50 border-emerald-200",
                            icon: "ri-shield-check-line",
                            iconColor: "text-emerald-700",
                            title: "Security Analysis: Looks good",
                            titleColor: "text-emerald-900",
                            meta: "text-emerald-800",
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
                            {topFinding ? (
                              <div className="text-xs text-slate-700 mt-2 line-clamp-2">
                                <span className="font-semibold text-slate-800">Top finding:</span> {String(topFinding)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            severity === "danger"
                              ? "bg-rose-100 text-rose-800"
                              : severity === "warn"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {tamperDetected ? "TAMPER" : String(risk).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const scans = (selectedChequeMail?.content_scan_urls || []).filter(Boolean);
                  const chequeUrl = scans[0];
                  const thumbs = scans.slice(1);

                  return (
                    <div className="space-y-3">
                      <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        {chequeUrl ? (
                          <button
                            type="button"
                            className="group relative block w-full cursor-zoom-in"
                            onClick={() => {
                              setZoomUrl(chequeUrl);
                              setZoomScale(1);
                            }}
                            title="Zoom"
                          >
                            <img src={chequeUrl} alt="Cheque image" className="w-full max-h-[60vh] object-contain bg-white" />
                            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                                <i className="ri-zoom-in-line text-base"></i>
                                Zoom
                              </div>
                            </div>
                          </button>
                        ) : (
                          <div className="h-44 sm:h-56 flex items-center justify-center text-slate-500 text-xs">
                            Cheque image not available
                          </div>
                        )}
                      </div>

                      {thumbs.length ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                          {thumbs.map((u, idx) => (
                            <button
                              key={u || idx}
                              type="button"
                              className="h-20 rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-zoom-in"
                              onClick={() => {
                                setZoomUrl(u);
                                setZoomScale(1);
                              }}
                              title="Zoom"
                            >
                              <img src={u} alt={`Additional scan ${idx + 2}`} className="w-full h-full object-cover object-top" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Issued By</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {selectedCheque.from.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedCheque.from}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-[#0A3D8F]">{selectedCheque.amount}</p>
                  <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selectedCheque.status]}`}>
                    {selectedCheque.status}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Issuing Bank</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCheque.bank}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cheque No. #{selectedCheque.chequeNo}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Memo</p>
                  <p className="text-sm text-slate-700 leading-snug">{selectedCheque.memo}</p>
                  <p className="text-xs text-slate-500 mt-1">Dated: {selectedCheque.date}</p>
                </div>
              </div>

              {(() => {
                if (selectedChequeFullLoading) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                      Loading cheque validation…
                    </div>
                  );
                }

                if (!selectedChequeFull) return null;

                const raw = (selectedChequeFull as any)?.ai_raw_result || {};
                const confidenceRaw = (selectedChequeFull as any)?.ai_confidence;
                const confidence =
                  typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw) ? confidenceRaw : null;

                const checksArr: any[] = Array.isArray(raw?.validation?.checks)
                  ? raw.validation.checks
                  : Array.isArray(raw?.checks)
                    ? raw.checks
                    : [];

                const findCheck = (key: string) =>
                  checksArr.find((c) => c?.check === key || c?.id === key || c?.name === key);

                const getPassed = (key: string): boolean | null => {
                  const c = findCheck(key);
                  if (!c) return null;
                  if (typeof c.passed === "boolean") return c.passed;
                  if (typeof c.pass === "boolean") return c.pass;
                  return null;
                };

                const beneficiary = raw?.cheque_beneficiary || (selectedChequeFull as any)?.beneficiary || "—";
                const amountFigures = raw?.cheque_amount_figures || (selectedChequeFull as any)?.amount_figures || "—";
                const amountWordsMatch = getPassed("amount_match");
                const dateOnCheque = raw?.cheque_date_on_cheque || (selectedChequeFull as any)?.date_on_cheque || "—";
                const dateValidRaw =
                  typeof raw?.cheque_date_valid === "boolean"
                    ? raw.cheque_date_valid
                    : typeof (selectedChequeFull as any)?.cheque_date_valid === "boolean"
                      ? (selectedChequeFull as any).cheque_date_valid
                      : getPassed("date_valid");
                const dateValid = typeof dateValidRaw === "boolean" ? dateValidRaw : null;
                const signaturePresentRaw =
                  typeof raw?.cheque_signature_present === "boolean"
                    ? raw.cheque_signature_present
                    : getPassed("signature_present");
                const signaturePresent =
                  typeof signaturePresentRaw === "boolean" ? signaturePresentRaw : null;
                const alterationDetectedRaw =
                  typeof raw?.cheque_alteration_detected === "boolean" ? raw.cheque_alteration_detected : null;
                const alterationSafe =
                  typeof alterationDetectedRaw === "boolean" ? !alterationDetectedRaw : null;

                const items: Array<{ label: string; value: string; passed: boolean | null }> = [
                  { label: "Beneficiary", value: String(beneficiary), passed: null },
                  { label: "Amount (Figures)", value: String(amountFigures), passed: null },
                  { label: "Amount Words Match", value: amountWordsMatch === null ? "—" : amountWordsMatch ? "Match" : "Mismatch", passed: amountWordsMatch },
                  {
                    label: "Date",
                    value: dateValid === null ? String(dateOnCheque) : `${String(dateOnCheque)} • ${dateValid ? "Valid" : "Invalid"}`,
                    passed: dateValid,
                  },
                  {
                    label: "Signature Present",
                    value: signaturePresent === null ? "—" : signaturePresent ? "Present" : "Missing",
                    passed: signaturePresent,
                  },
                  {
                    label: "Alteration / Tamper",
                    value: alterationSafe === null ? "—" : alterationSafe ? "Not detected" : "Detected",
                    passed: alterationSafe,
                  },
                ];

                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <i className="ri-verified-badge-line text-[#0A3D8F]"></i>
                        <h3 className="text-sm font-bold text-slate-800">Cheque Validation (6-point)</h3>
                      </div>
                      {confidence !== null ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#0A3D8F]/10 px-3 py-1 text-xs font-semibold text-[#0A3D8F]">
                          <i className="ri-bar-chart-2-line"></i>
                          AI Confidence: {Math.round(confidence * 100)}%
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((it) => {
                        const icon =
                          it.passed === null
                            ? "ri-question-line text-slate-400"
                            : it.passed
                              ? "ri-checkbox-circle-fill text-emerald-600"
                              : "ri-close-circle-fill text-rose-600";
                        const border =
                          it.passed === null
                            ? "border-slate-200"
                            : it.passed
                              ? "border-emerald-200"
                              : "border-rose-200";
                        const bg =
                          it.passed === null
                            ? "bg-slate-50"
                            : it.passed
                              ? "bg-emerald-50"
                              : "bg-rose-50";

                        return (
                          <div key={it.label} className={`relative rounded-xl border p-3 ${border} ${bg}`}>
                            <i className={`absolute right-3 top-3 ${icon}`}></i>
                            <div className="text-[11px] font-semibold text-slate-600">{it.label}</div>
                            <div className="mt-2 text-xs font-semibold text-slate-900 break-words line-clamp-3">
                              {it.value || "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
                <div className="flex items-center space-x-2 mb-3">
                  <i className="ri-sparkling-line text-amber-500 text-lg"></i>
                  <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedChequeMail?.ai_summary || selectedCheque.aiSummary || "—"}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <i className="ri-robot-line text-[#0A3D8F] text-sm"></i>
                  <span className="text-xs text-slate-400">Generated by VScan AI</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-file-text-line text-slate-600"></i>
                  <h3 className="text-sm font-bold text-slate-800">OCR Text</h3>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedChequeMail?.ocr_text || "—"}</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                {selectedCheque.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCheque(null);
                        openModal(selectedCheque, "deposit");
                      }}
                      className="w-full py-3 bg-[#2F8F3A] text-white font-semibold rounded-lg hover:bg-[#267a30] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                    >
                      <i className="ri-bank-line mr-2"></i>Deposit to Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCheque(null);
                        openModal(selectedCheque, "pickup");
                      }}
                      className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                    >
                      <i className="ri-hand-coin-line mr-2"></i>Request Pickup
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="w-full py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                >
                  <i className="ri-download-line mr-2"></i>Download
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCheque(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm cursor-pointer sm:w-auto sm:px-5 sm:flex-shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Image Zoom Lightbox */}
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

          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-2xl bg-white/10 p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoomScale((s) => Math.max(1, Math.round((s - 0.25) * 100) / 100))}
              title="Zoom out"
            >
              <i className="ri-zoom-out-line text-lg"></i>
            </button>
            <div className="px-2 text-xs font-semibold text-white/90 min-w-14 text-center select-none">{zoomScale.toFixed(2)}x</div>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoomScale((s) => Math.min(4, Math.round((s + 0.25) * 100) / 100))}
              title="Zoom in"
            >
              <i className="ri-zoom-in-line text-lg"></i>
            </button>
            <button type="button" className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors" onClick={() => setZoomScale(1)} title="Reset">
              Reset
            </button>
          </div>

          <div className="absolute inset-0 pt-16 pb-8 px-4">
            <div className="h-full w-full overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="min-h-full min-w-full flex items-center justify-center py-6">
                <img
                  src={zoomUrl}
                  alt="Cheque zoom"
                  className="max-w-none select-none cursor-grab active:cursor-grabbing transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {modalType === "deposit" && modalCheque && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#2F8F3A]/10 rounded-lg flex items-center justify-center">
                  <i className="ri-bank-line text-[#2F8F3A] text-lg"></i>
                </div>
                <h2 className="text-base font-bold text-slate-900">Deposit Cheque</h2>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-slate-500 text-lg"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">{modalCheque.id}</p>
                <p className="text-2xl font-bold text-slate-900">{modalCheque.amount}</p>
                <p className="text-sm text-slate-600 mt-1">
                  From: {modalCheque.from} — {modalCheque.bank}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Destination Bank Account</label>
                <div className="space-y-2">
                  {BANK_ACCOUNTS.map((ba) => (
                    <label
                      key={ba.id}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedBank === ba.id ? "border-[#0A3D8F] bg-[#0A3D8F]/5" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bank"
                        value={ba.id}
                        checked={selectedBank === ba.id}
                        onChange={() => setSelectedBank(ba.id)}
                        className="accent-[#0A3D8F]"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ba.accountName}</p>
                        <p className="text-xs text-slate-500">
                          {ba.bankName} • {ba.accountNo} • {ba.type}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  className="flex-1 py-3 bg-[#2F8F3A] text-white rounded-lg text-sm font-semibold hover:bg-[#267a30] cursor-pointer whitespace-nowrap"
                >
                  Submit Deposit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Modal */}
      {modalType === "pickup" && modalCheque && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
                  <i className="ri-hand-coin-line text-[#0A3D8F] text-lg"></i>
                </div>
                <h2 className="text-base font-bold text-slate-900">Request Physical Pickup</h2>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-slate-500 text-lg"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-slate-900">{modalCheque.amount}</p>
                <p className="text-sm text-slate-600 mt-1">
                  From: {modalCheque.from} — {modalCheque.bank}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address / Notes</label>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value.slice(0, 500))}
                  placeholder="Enter your office address or any special instructions..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30 resize-none"
                />
                <p className="text-xs text-slate-400 text-right mt-1">{pickupNotes.length}/500</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700">
                  <i className="ri-information-line mr-1"></i>
                  Our team will confirm your pickup within 24 hours. Please have a valid ID ready.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePickup}
                  className="flex-1 py-3 bg-[#0A3D8F] text-white rounded-lg text-sm font-semibold hover:bg-[#083170] cursor-pointer whitespace-nowrap"
                >
                  Submit Pickup Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

