'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  initialDepositRequests,
  type DepositRequest,
} from '../../../mocks/depositRequests';
import { useSuperAdminToolbarOptional } from '../../superadmin/components/SuperAdminToolbarContext';

const statusColors: Record<DepositRequest['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-[#2F8F3A]',
  Rejected: 'bg-red-100 text-red-700',
  Deposited: 'bg-teal-100 text-teal-700',
};

type StatusTab = 'All' | DepositRequest['status'];

const STATUS_TABS: StatusTab[] = ['All', 'Pending', 'Approved', 'Rejected', 'Deposited'];

export default function DepositsPage() {
  return (
    <Suspense fallback={null}>
      <DepositsPageContent />
    </Suspense>
  );
}

function DepositsPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const statusFilter = useMemo((): StatusTab => {
    if (!tabFromUrl) return 'All';
    const match = STATUS_TABS.find((t) => t === tabFromUrl);
    return match ?? 'All';
  }, [tabFromUrl]);

  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin' : '/admin';
  const scanPath = `${basePath}/scan`;
  const profilePath = isSuperadminRoute
    ? '/superadmin/settings/profile'
    : '/admin/settings/profile';
  const settingsPath = isSuperadminRoute
    ? '/superadmin/settings'
    : '/admin/settings';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const superToolbar = useSuperAdminToolbarOptional();
  const search = isSuperadminRoute && superToolbar ? superToolbar.search : localSearch;
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [requests, setRequests] = useState<DepositRequest[]>(initialDepositRequests);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const [showApproveDateInput, setShowApproveDateInput] = useState(false);
  const [depositDateInput, setDepositDateInput] = useState('');
  const [depositDateError, setDepositDateError] = useState('');

  const [showSendSlipModal, setShowSendSlipModal] = useState(false);
  const [slipScanning, setSlipScanning] = useState(false);
  const [slipScanned, setSlipScanned] = useState(false);
  const [slipSending, setSlipSending] = useState(false);
  const [slipSent, setSlipSent] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setTab = (tab: StatusTab) => {
    router.replace(`${pathname}?tab=${encodeURIComponent(tab)}`);
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.company.toLowerCase().includes(search.toLowerCase()) ||
      r.bankName.toLowerCase().includes(search.toLowerCase()) ||
      r.chequeNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStar = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r))
    );
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
      setCheckedIds(new Set(filtered.map((r) => r.id)));
      setAllChecked(true);
    }
  };

  const openRequest = (request: DepositRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, read: true } : r))
    );
    setSelectedRequest({ ...request, read: true });
    setShowApproveDateInput(false);
    setDepositDateInput('');
    setDepositDateError('');
    setShowSendSlipModal(false);
    setSlipScanned(false);
    setSlipScanning(false);
    setSlipSent(false);
    setScanProgress(0);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setShowApproveDateInput(false);
    setDepositDateInput('');
    setDepositDateError('');
    setShowSendSlipModal(false);
    setSlipScanned(false);
    setSlipScanning(false);
    setSlipSent(false);
    setScanProgress(0);
  };

  const handleClickApprove = () => {
    setShowApproveDateInput(true);
    setDepositDateInput('');
    setDepositDateError('');
  };

  const handleConfirmApprove = (id: string) => {
    if (!depositDateInput.trim()) {
      setDepositDateError('Please enter a deposit date.');
      return;
    }
    const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(depositDateInput.trim())) {
      setDepositDateError('Please use format YYYY/MM/DD (e.g. 2026/03/28).');
      return;
    }
    setDepositDateError('');
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Approved' as const,
              depositDate: depositDateInput.trim(),
              tag: 'Approved',
              tagColor: 'bg-green-100 text-[#2F8F3A]',
            }
          : r
      )
    );
    setSelectedRequest((prev) =>
      prev ? { ...prev, status: 'Approved', depositDate: depositDateInput.trim() } : null
    );
    setShowApproveDateInput(false);
    setDepositDateInput('');
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Rejected' as const,
              tag: 'Rejected',
              tagColor: 'bg-red-100 text-red-700',
            }
          : r
      )
    );
    setSelectedRequest((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
    setShowApproveDateInput(false);
  };

  const openSendSlipModal = () => {
    setShowSendSlipModal(true);
    setSlipScanned(false);
    setSlipScanning(false);
    setSlipSent(false);
    setScanProgress(0);
  };

  const closeSendSlipModal = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setShowSendSlipModal(false);
    setSlipScanned(false);
    setSlipScanning(false);
    setSlipSent(false);
    setScanProgress(0);
  };

  const handleStartScan = () => {
    setSlipScanning(true);
    setSlipScanned(false);
    setScanProgress(0);
    let progress = 0;
    scanTimerRef.current = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      if (progress >= 100) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        setSlipScanning(false);
        setSlipScanned(true);
      }
    }, 40);
  };

  const handleRescan = () => {
    setSlipScanned(false);
    setSlipScanning(false);
    setScanProgress(0);
  };

  const handleSendSlip = (id: string) => {
    setSlipSending(true);
    setTimeout(() => {
      setSlipSending(false);
      setSlipSent(true);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'Deposited' as const,
                emailSent: true,
                tag: 'Deposited',
                tagColor: 'bg-teal-100 text-teal-700',
              }
            : r
        )
      );
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'Deposited' } : null));
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  const totalAmount = requests.reduce(
    (sum, r) => sum + parseFloat(r.amount.replace(/[$,]/g, '')),
    0
  );
  const pendingAmount = requests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + parseFloat(r.amount.replace(/[$,]/g, '')), 0);

  const countForStatus = (s: StatusTab) =>
    s === 'All' ? requests.length : requests.filter((r) => r.status === s).length;

  const notifications = [
    { id: 1, text: 'Deposit approved for Tech Solutions Inc', time: '5 mins ago', unread: true },
    { id: 2, text: 'Pending deposit review for Summit LLC', time: '12 mins ago', unread: true },
    { id: 3, text: 'Rejected deposit requires action', time: '25 mins ago', unread: false },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {!isSuperadminRoute && (
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl min-w-0">
            <Icon
              icon="ri:search-line"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search deposit requests..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-0 outline-none text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href={scanPath}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#0A3D8F] text-white text-sm font-semibold rounded-full hover:bg-[#083170] transition-colors whitespace-nowrap"
            >
              <Icon icon="ri:scan-2-line" className="text-sm" />
              <span className="hidden sm:inline">New Scan</span>
            </Link>

              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <Icon icon="ri:notification-3-line" className="text-slate-600 text-xl" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                        <button
                          type="button"
                          className="text-xs text-[#0A3D8F] font-medium whitespace-nowrap cursor-pointer"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-slate-50 flex gap-3 ${
                              n.unread ? 'bg-[#EFF6FF]/40' : ''
                            }`}
                          >
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] shrink-0">
                              <Icon icon="ri:mail-line" className="text-[#1E40AF] text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700 leading-5">{n.text}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                            </div>
                            {n.unread && (
                              <span className="w-2 h-2 bg-[#1E40AF] rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-1 py-1 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white font-semibold text-xs">
                      AD
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-slate-900 leading-none">Admin User</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <Icon icon="ri:arrow-down-s-line" className="text-slate-400 text-base hidden lg:block" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 w-[200px] bg-white rounded-2xl shadow-lg border border-slate-200 z-50 py-1 overflow-hidden">
                      <Link
                        href={profilePath}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Icon icon="ri:user-line" className="text-sm" />
                        My Profile
                      </Link>
                      <Link
                        href={settingsPath}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Icon icon="ri:settings-3-line" className="text-sm" />
                        Settings
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <a
                        href="/login"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Icon icon="ri:logout-box-r-line" className="text-sm" />
                        Sign Out
                      </a>
                    </div>
                  )}
                </div>
              </>
          </div>
        </div>
      </header>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAllCheck}
              className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
            />
            <button type="button" className="p-1.5 hover:bg-slate-100 rounded cursor-pointer">
              <Icon icon="ri:arrow-down-s-line" className="text-slate-500 text-sm" />
            </button>
          </div>
          {checkedIds.size > 0 && (
            <div className="flex items-center gap-1 ml-1 sm:ml-2">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Archive"
              >
                <Icon icon="ri:archive-line" className="text-slate-500 text-base" />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Delete"
              >
                <Icon icon="ri:delete-bin-line" className="text-slate-500 text-base" />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Mark as read"
              >
                <Icon icon="ri:mail-open-line" className="text-slate-500 text-base" />
              </button>
              <span className="text-xs text-slate-500 ml-1">{checkedIds.size} selected</span>
            </div>
          )}
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
            <Icon icon="ri:refresh-line" className="text-slate-500 text-base" />
          </button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="More options">
            <Icon icon="ri:more-2-line" className="text-slate-500 text-base" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Total:{' '}
            <span className="text-slate-700 font-semibold">${totalAmount.toLocaleString()}</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500 font-medium">
            Pending:{' '}
            <span className="text-amber-600 font-semibold">${pendingAmount.toLocaleString()}</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500">
            1–{filtered.length} of {requests.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <Icon icon="ri:arrow-left-s-line" className="text-slate-500 text-base" />
            </button>
            <button type="button" className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <Icon icon="ri:arrow-right-s-line" className="text-slate-500 text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto shrink-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              statusFilter === tab
                ? 'border-[#0A3D8F] text-[#0A3D8F]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab}
            {tab !== 'All' && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab
                    ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {countForStatus(tab)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <main className="flex-1 min-h-0 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Icon icon="ri:exchange-dollar-line" className="text-slate-400 text-3xl" />
            </div>
            <p className="text-slate-500 font-medium">No deposit requests found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((request) => (
              <div
                key={request.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openRequest(request);
                }}
                className="flex items-center group px-3 sm:px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => openRequest(request)}
              >
                <div
                  className="flex items-center gap-2 mr-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(request.id)}
                    onChange={() => toggleCheck(request.id)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                  />
                </div>

                <div
                  className="mr-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(request.id);
                  }}
                >
                  <Icon
                    icon={request.starred ? 'ri:star-fill' : 'ri:star-line'}
                    className={`text-lg cursor-pointer transition-colors ${
                      request.starred ? 'text-amber-400' : 'text-slate-300 group-hover:text-slate-400'
                    }`}
                  />
                </div>

                <div className="mr-3 shrink-0">
                  <Icon
                    icon="ri:bookmark-fill"
                    className={`text-sm ${!request.read ? 'text-amber-400' : 'text-slate-200'}`}
                  />
                </div>

                <div className="w-36 sm:w-44 shrink-0 mr-3 sm:mr-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {request.company.charAt(0)}
                    </div>
                    <span
                      className={`text-sm truncate ${
                        !request.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
                      }`}
                    >
                      {request.company}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2 mr-3 sm:mr-4">
                  {request.tag && (
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${request.tagColor}`}
                    >
                      {request.tag}
                    </span>
                  )}
                  <span
                    className={`text-sm truncate ${
                      !request.read ? 'font-bold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {request.bankName} – #{request.chequeNumber}
                  </span>
                  <span className="text-sm text-slate-400 truncate hidden xl:inline">
                    – Requested by {request.requestedBy}
                  </span>
                </div>

                <div className="flex items-center mr-3 sm:mr-4 shrink-0">
                  <span
                    className={`text-sm font-bold ${
                      !request.read ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {request.amount}
                  </span>
                </div>

                <div className="flex items-center mr-3 sm:mr-4 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[request.status]}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="w-24 sm:w-28 shrink-0 mr-3 sm:mr-4 hidden lg:block">
                  <span className="text-xs text-slate-500 truncate block">{request.requestedBy}</span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`text-xs ${!request.read ? 'font-bold text-slate-900' : 'text-slate-500'}`}
                  >
                    {request.timeShort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
                  <Icon icon="ri:exchange-dollar-line" className="text-[#0A3D8F] text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Deposit Request</h2>
                  <p className="text-xs text-slate-500">
                    {selectedRequest.id} • {selectedRequest.requestedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Icon icon="ri:close-line" className="text-slate-600 text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedRequest.thumbnail}
                  alt="Cheque document"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Requesting Company</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {selectedRequest.company.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedRequest.company}</p>
                      <p className="text-xs text-slate-500">{selectedRequest.companyEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Deposit Amount</p>
                  <p className="text-2xl font-bold text-[#0A3D8F]">{selectedRequest.amount}</p>
                  <span
                    className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[selectedRequest.status]}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Bank Details</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedRequest.bankName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cheque No. #{selectedRequest.chequeNumber}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Requested By</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedRequest.requestedBy}</p>
                  {selectedRequest.depositDate ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Icon icon="ri:calendar-check-line" className="text-teal-600 text-xs" />
                      <p className="text-xs text-teal-700 font-medium">
                        Deposit Date: {selectedRequest.depositDate}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedRequest.requestedAt}</p>
                  )}
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="ri:information-line" className="text-amber-600 text-base" />
                    <h3 className="text-sm font-bold text-amber-900">Notes</h3>
                  </div>
                  <p className="text-sm text-amber-800">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="ri:sparkling-line" className="text-amber-500 text-lg" />
                  <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.aiSummary}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Icon icon="ri:robot-line" className="text-[#0A3D8F] text-sm" />
                  <span className="text-xs text-slate-400">Generated by VScan AI</span>
                </div>
              </div>

              {showApproveDateInput && selectedRequest.status === 'Pending' && (
                <div className="p-4 bg-[#0A3D8F]/5 rounded-xl border border-[#0A3D8F]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="ri:calendar-line" className="text-[#0A3D8F] text-base" />
                    <p className="text-sm font-semibold text-[#0A3D8F]">Enter Deposit Date</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="YYYY/MM/DD  e.g. 2026/03/28"
                        value={depositDateInput}
                        onChange={(e) => {
                          setDepositDateInput(e.target.value);
                          setDepositDateError('');
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm text-black placeholder:text-slate-400 outline-none transition-all ${
                          depositDateError
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-300 bg-white focus:border-[#0A3D8F]'
                        }`}
                      />
                      {depositDateError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <Icon icon="ri:error-warning-line" />
                          <span>{depositDateError}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmApprove(selectedRequest.id)}
                        className="px-5 py-2.5 bg-[#2F8F3A] text-white text-sm font-semibold rounded-lg hover:bg-[#267a30] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Icon icon="ri:check-line" className="inline mr-1.5" />
                        Confirm Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowApproveDateInput(false);
                          setDepositDateError('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showApproveDateInput && (
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
                  {selectedRequest.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={handleClickApprove}
                        className="flex-1 min-w-[140px] py-3 bg-[#2F8F3A] text-white font-semibold rounded-lg hover:bg-[#267a30] transition-colors text-sm whitespace-nowrap cursor-pointer"
                      >
                        <Icon icon="ri:check-line" className="inline mr-2" />
                        Approve Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(selectedRequest.id)}
                        className="flex-1 min-w-[140px] py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap cursor-pointer"
                      >
                        <Icon icon="ri:close-line" className="inline mr-2" />
                        Reject Request
                      </button>
                    </>
                  )}

                  {selectedRequest.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={openSendSlipModal}
                      className="flex-1 min-w-[140px] py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm whitespace-nowrap cursor-pointer"
                    >
                      <Icon icon="ri:scan-2-line" className="inline mr-2" />
                      Send Slip
                    </button>
                  )}

                  {selectedRequest.status === 'Deposited' && (
                    <div className="flex-1 py-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center gap-2">
                      <Icon icon="ri:checkbox-circle-fill" className="text-teal-600 text-base" />
                      <span className="text-teal-700 font-semibold text-sm">Slip Sent — Deposited</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="flex-1 min-w-[120px] py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
                  >
                    <Icon icon="ri:download-line" className="inline mr-2" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send slip modal */}
      {showSendSlipModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Icon icon="ri:scan-2-line" className="text-teal-700 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Scan Deposit Slip</h3>
                  <p className="text-xs text-slate-500">
                    {selectedRequest.company} — {selectedRequest.amount}
                  </p>
                </div>
              </div>
              {!slipSent && (
                <button
                  type="button"
                  onClick={closeSendSlipModal}
                  className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <Icon icon="ri:close-line" className="text-slate-600 text-xl" />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {slipSent && (
                <div className="py-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                    <Icon icon="ri:checkbox-circle-fill" className="text-teal-600 text-4xl" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Slip Sent Successfully!</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Sent to{' '}
                      <span className="font-semibold text-slate-700">{selectedRequest.companyEmail}</span>
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-full flex items-center gap-2">
                    <Icon icon="ri:exchange-dollar-line" className="text-teal-600 text-sm" />
                    <span className="text-sm font-semibold text-teal-700">Status updated to Deposited</span>
                  </div>
                  <button
                    type="button"
                    onClick={closeSendSlipModal}
                    className="mt-2 px-10 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Done
                  </button>
                </div>
              )}

              {!slipSent && !slipScanned && (
                <>
                  <div className="relative w-full h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-sm" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-sm" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-sm" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-sm" />

                    {slipScanning && (
                      <div
                        className="absolute left-4 right-4 h-0.5 bg-teal-400 transition-none"
                        style={{
                          top: `${scanProgress}%`,
                          boxShadow: '0 0 8px 2px rgba(45,212,191,0.7)',
                        }}
                      />
                    )}

                    {!slipScanning && (
                      <div className="flex flex-col items-center gap-3 text-center px-6">
                        <Icon icon="ri:scan-2-line" className="text-teal-400 text-4xl" />
                        <p className="text-slate-400 text-sm">
                          Place the deposit slip in the scanner
                          <br />
                          and press Scan
                        </p>
                      </div>
                    )}

                    {slipScanning && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                          <Icon icon="ri:loader-4-line" className="animate-spin text-teal-400 text-sm" />
                          <span className="text-teal-300 text-xs font-medium">Scanning...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {slipScanning && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-75"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeSendSlipModal}
                      disabled={slipScanning}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartScan}
                      disabled={slipScanning}
                      className="flex-1 py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Icon icon="ri:scan-2-line" className="text-base" />
                      <span>{slipScanning ? 'Scanning...' : 'Scan'}</span>
                    </button>
                  </div>
                </>
              )}

              {!slipSent && slipScanned && (
                <>
                  <div className="relative rounded-xl overflow-hidden border-2 border-teal-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedRequest.thumbnail}
                      alt="Scanned deposit slip"
                      className="w-full h-52 object-cover object-top"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Icon icon="ri:checkbox-circle-fill" className="text-sm" />
                      <span>Scanned</span>
                    </div>
                    <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-teal-400" />
                    <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-teal-400" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-teal-400" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-teal-400" />
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <Icon icon="ri:mail-send-line" className="text-[#0A3D8F] text-xl" />
                    <div>
                      <p className="text-xs text-slate-500">Will be sent to</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedRequest.companyEmail}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    Slip unclear or wrong?
                    <button
                      type="button"
                      onClick={handleRescan}
                      className="ml-1 text-teal-600 font-semibold underline cursor-pointer whitespace-nowrap"
                    >
                      Rescan
                    </button>
                  </p>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleRescan}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <Icon icon="ri:refresh-line" className="text-base" />
                      <span>Rescan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSlip(selectedRequest.id)}
                      disabled={slipSending}
                      className="flex-1 py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {slipSending ? (
                        <>
                          <Icon icon="ri:loader-4-line" className="animate-spin text-base" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="ri:send-plane-fill" className="text-base" />
                          <span>Send Slip</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
