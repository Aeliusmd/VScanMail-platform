'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { depositsApi, type DepositDto } from '@/lib/api/deposits';
import { mailApi, type MailItem } from '@/lib/api/mail';
import { useSuperAdminToolbarOptional } from '../../superadmin/components/SuperAdminToolbarContext';
import { useAdminProfile } from '../components/useAdminProfile';
import NotificationBell from '../components/NotificationBell';

type DepositRequest = {
  id: string; // UI id like DEP-xxxxxx
  chequeId: string; // real cheque id used for API actions
  mailItemId: string;
  slipUrl?: string | null;
  company: string;
  companyEmail: string;
  bankName: string;
  chequeNumber: string;
  amount: string;
  requestedAt: string;
  timeShort: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Deposited';
  emailSent: boolean;
  aiSummary: string;
  thumbnail: string;
  starred: boolean;
  read: boolean;
  tag?: string;
  tagColor?: string;
  requestedBy: string;
  notes?: string;
  depositDate?: string;
  destinationBankLast4: string | null;
  destinationBankAccountId: string | null;
  slipAiResult?: any | null;
};

const statusColors: Record<DepositRequest['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-[#2F8F3A]',
  Rejected: 'bg-red-100 text-red-700',
  Deposited: 'bg-teal-100 text-teal-700',
};

type StatusTab = 'All' | DepositRequest['status'];

const STATUS_TABS: StatusTab[] = ['All', 'Pending', 'Approved', 'Rejected', 'Deposited'];

function formatMoney(amount: number) {
  return `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toYyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function mapDepositToRequest(d: DepositDto): DepositRequest {
  const requested = d.requestedAt ? new Date(d.requestedAt) : null;
  const requestedAt = requested && !Number.isNaN(requested.getTime()) ? requested.toLocaleString() : '—';
  const timeShort =
    requested && !Number.isNaN(requested.getTime())
      ? requested.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '—';

  const deposited = Boolean(d.markedDepositedAt) || d.chequeStatus === 'deposited' || d.chequeStatus === 'cleared';
  const status: DepositRequest['status'] =
    deposited ? 'Deposited' : d.decision === 'approved' ? 'Approved' : d.decision === 'rejected' ? 'Rejected' : 'Pending';

  const bankName = d.destinationBankName
    ? d.destinationBankNickname
      ? `${d.destinationBankName} (${d.destinationBankNickname})`
      : d.destinationBankName
    : '—';

  const depositDate =
    status === 'Approved' && d.decidedAt
      ? toYyyyMmDd(new Date(d.decidedAt))
      : status === 'Deposited' && (d.markedDepositedAt || d.decidedAt)
        ? toYyyyMmDd(new Date(d.markedDepositedAt || d.decidedAt!))
        : undefined;

  const tag =
    status === 'Pending' ? 'Pending' : status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Deposited';
  const tagColor =
    status === 'Pending'
      ? 'bg-amber-100 text-amber-700'
      : status === 'Approved'
        ? 'bg-green-100 text-[#2F8F3A]'
        : status === 'Rejected'
          ? 'bg-red-100 text-red-700'
          : 'bg-teal-100 text-teal-700';

  return {
    id: `DEP-${d.chequeId.slice(-6)}`,
    chequeId: d.chequeId,
    mailItemId: d.mailItemId,
    slipUrl: d.slipUrl ?? null,
    company: d.clientName || 'Client',
    companyEmail: d.clientEmail || '—',
    bankName,
    chequeNumber: d.chequeId.slice(-6),
    amount: formatMoney(d.amountFigures),
    requestedAt,
    timeShort,
    status,
    emailSent: deposited,
    aiSummary: d.aiSummary || '',
    thumbnail: '',
    starred: false,
    read: false,
    tag,
    tagColor,
    requestedBy: d.clientName || 'Client',
    notes: d.rejectReason || undefined,
    depositDate,
    destinationBankLast4: d.destinationBankLast4 ?? null,
    destinationBankAccountId: d.destinationBankAccountId ?? null,
    slipAiResult: d.slipAiResult ?? null,
  };
}

export default function DepositsPage() {
  return (
    <Suspense fallback={null}>
      <DepositsPageContent />
    </Suspense>
  );
}

function DepositsPageContent() {
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const highlightId = searchParams.get('highlight');

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

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const superToolbar = useSuperAdminToolbarOptional();
  const search = isSuperadminRoute && superToolbar ? superToolbar.search : localSearch;
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightHandledRef = useRef(false);

  const [showApproveDateInput, setShowApproveDateInput] = useState(false);
  const [depositDateInput, setDepositDateInput] = useState('');
  const [depositDateError, setDepositDateError] = useState('');
  const approveDateInputRef = useRef<HTMLInputElement | null>(null);
  const [revealedAccount, setRevealedAccount] = useState<{ number: string; expiresAt: number } | null>(null);
  const [revealingAccount, setRevealingAccount] = useState(false);
  const [revealAccountError, setRevealAccountError] = useState('');

  const [showSendSlipModal, setShowSendSlipModal] = useState(false);
  const [slipUploading, setSlipUploading] = useState(false);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipSending, setSlipSending] = useState(false);
  const [slipSent, setSlipSent] = useState(false);
  const [slipUploadError, setSlipUploadError] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [slipResult, setSlipResult] = useState<any | null>(null);
  const slipFileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedMailItem, setSelectedMailItem] = useState<MailItem | null>(null);
  const [selectedMailLoading, setSelectedMailLoading] = useState(false);
  const [selectedMailError, setSelectedMailError] = useState('');
  const [chequeViewerOpen, setChequeViewerOpen] = useState(false);
  const [chequeViewerUrl, setChequeViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await depositsApi.adminList();
        if (cancelled) return;
        setRequests(list.map(mapDepositToRequest));
      } catch (e) {
        console.error('Failed to load admin deposits:', e);
        if (!cancelled) setRequests([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!highlightId || highlightHandledRef.current) return;
    if (requests.length === 0) return;
    const target = requests.find((r) => r.chequeId === highlightId);
    if (!target) return;

    highlightHandledRef.current = true;
    openRequest(target);
    setHighlightedId(highlightId);
    const timer = window.setTimeout(() => setHighlightedId(null), 3000);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('highlight');
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);

    return () => window.clearTimeout(timer);
  }, [highlightId, requests, pathname, router, searchParams]);

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

  const handleBulkDeleteDeposits = async () => {
    if (!confirm(`Delete ${checkedIds.size} deposit record(s)? This cannot be undone.`)) return;
    const toDelete = requests.filter((r) => checkedIds.has(r.id));
    try {
      await Promise.all(
        toDelete.map((r) => fetch(`/api/records/cheques/${r.chequeId}`, { method: 'DELETE' }))
      );
      setCheckedIds(new Set());
      setAllChecked(false);
      const list = await depositsApi.adminList();
      setRequests(list.map(mapDepositToRequest));
    } catch (err) {
      console.error('Bulk delete failed:', err);
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
    setRevealedAccount(null);
    setRevealingAccount(false);
    setRevealAccountError('');
    setShowSendSlipModal(false);
    const existingAi = request.slipAiResult ?? null;
    setSlipUploaded(!!existingAi);
    setSlipUploading(false);
    setSlipSent(false);
    setSlipUploadError('');
    setSlipFile(null);
    setSlipPreviewUrl(null);
    setSlipResult(existingAi);

    setSelectedMailItem(null);
    setSelectedMailError('');

    if (!request.mailItemId) {
      setSelectedMailLoading(false);
      setSelectedMailError('Missing mailItemId for this deposit. Refresh the page and try again.');
      return;
    }

    setSelectedMailLoading(true);
    (async () => {
      try {
        const mail = await mailApi.getById(request.mailItemId);
        setSelectedMailItem(mail);
      } catch (e: any) {
        setSelectedMailError(e?.message || 'Failed to load cheque images');
      } finally {
        setSelectedMailLoading(false);
      }
    })();
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setShowApproveDateInput(false);
    setDepositDateInput('');
    setDepositDateError('');
    setRevealedAccount(null);
    setRevealingAccount(false);
    setRevealAccountError('');
    setShowSendSlipModal(false);
    setSlipUploaded(false);
    setSlipUploading(false);
    setSlipSent(false);
    setSlipUploadError('');
    setSlipFile(null);
    setSlipPreviewUrl(null);
    setSlipResult(null);

    setSelectedMailItem(null);
    setSelectedMailLoading(false);
    setSelectedMailError('');
    setChequeViewerOpen(false);
    setChequeViewerUrl(null);
  };

  const handleRevealAccount = async () => {
    if (!selectedRequest) return;

    setRevealingAccount(true);
    setRevealAccountError('');
    try {
      const result = await depositsApi.revealAccount(selectedRequest.chequeId);
      setRevealedAccount({
        number: result.accountNumber,
        expiresAt: Date.now() + 30_000,
      });
    } catch (error: any) {
      setRevealAccountError(error?.message || 'Could not load account number. Try again.');
    } finally {
      setRevealingAccount(false);
    }
  };

  const handleClickApprove = () => {
    setShowApproveDateInput(true);
    const today = new Date().toISOString().split('T')[0];
    setDepositDateInput(today);
    setDepositDateError('');
  };

  const handleConfirmApprove = async (id: string) => {
    if (!depositDateInput.trim()) {
      setDepositDateError('Please enter a deposit date.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(depositDateInput.trim())) {
      setDepositDateError('Please select a valid deposit date.');
      return;
    }
    setDepositDateError('');
    const target = requests.find((r) => r.id === id);
    if (!target) return;

    try {
      await depositsApi.adminApprove(target.chequeId, depositDateInput.trim());
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
    } catch (e) {
      console.error('Failed to approve deposit:', e);
    }
  };

  const handleReject = async (id: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target) return;
    const reason = window.prompt('Reject reason (required):', target.notes || '');
    if (!reason || !reason.trim()) return;

    try {
      await depositsApi.adminReject(target.chequeId, reason.trim());
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'Rejected' as const,
                notes: reason.trim(),
                tag: 'Rejected',
                tagColor: 'bg-red-100 text-red-700',
              }
            : r
        )
      );
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'Rejected', notes: reason.trim() } : null));
      setShowApproveDateInput(false);
    } catch (e) {
      console.error('Failed to reject deposit:', e);
    }
  };

  const openSendSlipModal = () => {
    setShowSendSlipModal(true);
    setSlipUploaded(false);
    setSlipUploading(false);
    setSlipSent(false);
    setSlipUploadError('');
    setSlipFile(null);
    setSlipPreviewUrl(null);
    setSlipResult(null);
  };

  const closeSendSlipModal = () => {
    setShowSendSlipModal(false);
    setSlipUploaded(false);
    setSlipUploading(false);
    setSlipSent(false);
    setSlipUploadError('');
    setSlipFile(null);
    setSlipPreviewUrl(null);
    setSlipResult(null);
  };

  const handlePickSlipFile = () => {
    slipFileInputRef.current?.click();
  };

  const handleRescan = () => {
    setSlipUploaded(false);
    setSlipUploading(false);
    setSlipUploadError('');
    setSlipFile(null);
    setSlipPreviewUrl(null);
    setSlipResult(null);
  };

  const handleSendSlip = async (id: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target) return;
    setSlipSending(true);
    try {
      await depositsApi.adminMarkDeposited(target.chequeId);
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
    } catch (e) {
      console.error('Failed to mark deposited:', e);
      setSlipSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (slipPreviewUrl) URL.revokeObjectURL(slipPreviewUrl);
    };
  }, [slipPreviewUrl]);

  useEffect(() => {
    if (!revealedAccount) return;
    const ms = revealedAccount.expiresAt - Date.now();
    if (ms <= 0) {
      setRevealedAccount(null);
      return;
    }

    const timer = window.setTimeout(() => setRevealedAccount(null), ms);
    return () => window.clearTimeout(timer);
  }, [revealedAccount]);

  const totalAmount = requests.reduce(
    (sum, r) => sum + parseFloat(r.amount.replace(/[$,]/g, '')),
    0
  );
  const pendingAmount = requests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + parseFloat(r.amount.replace(/[$,]/g, '')), 0);

  const countForStatus = (s: StatusTab) =>
    s === 'All' ? requests.length : requests.filter((r) => r.status === s).length;

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
                <NotificationBell />

                <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-1 py-1 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white font-semibold text-xs overflow-hidden flex-shrink-0">
                      {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-slate-900 leading-none">{displayName}</p>
                      <p className="text-xs text-slate-500 uppercase">{displayRole}</p>
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
                onClick={handleBulkDeleteDeposits}
                className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                title="Delete selected"
              >
                <Icon icon="ri:delete-bin-line" className="text-red-500 text-base" />
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
                className={`flex items-center group px-3 sm:px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                  highlightedId === request.chequeId ? 'ring-2 ring-blue-400 animate-pulse' : ''
                }`}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Cheque images</h3>
                  {selectedMailLoading && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Icon icon="ri:loader-4-line" className="animate-spin" /> Loading…
                    </span>
                  )}
                </div>

                {selectedMailError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    {selectedMailError}
                  </div>
                )}

                {!selectedMailLoading && selectedMailItem && (
                  (() => {
                    const scans = (Array.isArray(selectedMailItem.content_scan_urls) ? selectedMailItem.content_scan_urls : []).filter(Boolean).slice(0, 6);
                    const main = scans[0] || null;
                    const rest = scans.slice(1);
                    return (
                      <div className="space-y-3">
                        <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          {main ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={main}
                              alt="Cheque image"
                              className="w-full h-full object-contain bg-white cursor-zoom-in"
                              onClick={() => {
                                setChequeViewerUrl(main);
                                setChequeViewerOpen(true);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Icon icon="ri:image-line" className="text-3xl" />
                            </div>
                          )}
                        </div>

                        {rest.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {rest.map((url, idx) => (
                              <div key={`${url}-${idx}`} className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Cheque image ${idx + 2}`}
                                  className="w-full h-full object-cover object-top cursor-zoom-in"
                                  onClick={() => {
                                    setChequeViewerUrl(url);
                                    setChequeViewerOpen(true);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {!selectedMailLoading && !selectedMailItem && !selectedMailError && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                    <Icon icon="ri:image-line" className="text-3xl" />
                  </div>
                )}
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
                  <p className="text-xs text-slate-500 mb-2">Bank Details</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedRequest.bankName.split(' (')[0]}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">
                    {selectedRequest.bankName.includes('(')
                      ? `Account: ${selectedRequest.bankName.split('(')[1]?.replace(')', '')}`
                      : null}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                      Account Number
                    </p>

                    {!revealedAccount ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-500 tracking-widest">
                          •••• •••• {selectedRequest.destinationBankLast4 ?? '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={handleRevealAccount}
                          disabled={revealingAccount}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0A3D8F]/8 hover:bg-[#0A3D8F]/15 text-[#0A3D8F] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {revealingAccount ? (
                            <Icon icon="ri:loader-4-line" className="animate-spin text-xs" />
                          ) : (
                            <Icon icon="ri:eye-line" className="text-xs" />
                          )}
                          {revealingAccount ? 'Loading…' : 'View'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-slate-900 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 tracking-wider">
                          {revealedAccount.number}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(revealedAccount.number)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Icon icon="ri:file-copy-line" className="text-xs" />
                          Copy
                        </button>
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5 w-full mt-0.5">
                          <Icon icon="ri:time-line" className="text-[10px]" />
                          Hides in 30s
                        </span>
                      </div>
                    )}

                    {revealAccountError && (
                      <p className="text-xs text-red-500 mt-1">{revealAccountError}</p>
                    )}
                  </div>
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

              {!isSuperadminRoute && showApproveDateInput && selectedRequest.status === 'Pending' && (
                <div className="p-4 bg-[#0A3D8F]/5 rounded-xl border border-[#0A3D8F]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="ri:calendar-check-line" className="text-[#0A3D8F] text-base" />
                    <p className="text-sm font-semibold text-[#0A3D8F]">Select Deposit Date</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 relative">
                      <button
                        type="button"
                        onClick={() => {
                          const input = approveDateInputRef.current;
                          if (!input) return;
                          if (typeof input.showPicker === 'function') {
                            input.showPicker();
                          } else {
                            input.focus();
                            input.click();
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm text-left flex items-center justify-between transition-all ${
                          depositDateError
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-300 bg-white hover:border-[#0A3D8F] focus:border-[#0A3D8F]'
                        }`}
                      >
                        <span className={depositDateInput ? 'text-slate-900' : 'text-slate-400'}>
                          {depositDateInput
                            ? new Date(`${depositDateInput}T00:00:00`).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Select date'}
                        </span>
                        <Icon icon="ri:calendar-line" className="text-[#0A3D8F] text-base shrink-0 ml-2" />
                      </button>
                      <input
                        ref={approveDateInputRef}
                        type="date"
                        value={depositDateInput}
                        onChange={(e) => {
                          setDepositDateInput(e.target.value);
                          setDepositDateError('');
                        }}
                        className="sr-only"
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
                  {!isSuperadminRoute && selectedRequest.status === 'Pending' && (
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

                  {!isSuperadminRoute && selectedRequest.status === 'Approved' && (
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
                    onClick={() => {
                      const url = selectedRequest?.slipUrl;
                      if (!url) return;
                      const resolved = url.startsWith('/')
                        ? `${process.env.NEXT_PUBLIC_API_URL ?? ''}${url}`
                        : url;
                      window.open(resolved, '_blank', 'noreferrer');
                    }}
                    disabled={!selectedRequest?.slipUrl}
                    className="flex-1 min-w-[120px] py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

              <input
                ref={slipFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSlipUploadError('');
                  setSlipUploaded(false);
                  setSlipResult(null);
                  setSlipFile(f);
                  if (slipPreviewUrl) URL.revokeObjectURL(slipPreviewUrl);
                  setSlipPreviewUrl(f ? URL.createObjectURL(f) : null);
                }}
              />

              {!slipSent && !slipUploaded && (
                <>
                  <div className="relative w-full h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-sm" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-sm" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-sm" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-sm" />

                    {slipPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slipPreviewUrl} alt="Selected deposit slip" className="w-full h-full object-cover object-top opacity-90" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-center px-6">
                        <Icon icon="ri:upload-cloud-2-line" className="text-teal-400 text-4xl" />
                        <p className="text-slate-400 text-sm">
                          Upload a deposit slip image
                          <br />
                          from your computer
                        </p>
                      </div>
                    )}
                  </div>

                  {slipUploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {slipUploadError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeSendSlipModal}
                      disabled={slipUploading}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePickSlipFile}
                      disabled={slipUploading}
                      className="flex-1 py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Icon icon="ri:folder-upload-line" className="text-base" />
                      <span>{slipPreviewUrl ? 'Choose another image' : 'Upload image'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!slipFile || slipUploading}
                    onClick={async () => {
                      if (!slipFile) return;
                      setSlipUploading(true);
                      setSlipUploadError('');
                      try {
                        const res = await depositsApi.adminUploadSlip(selectedRequest.chequeId, slipFile);
                        setSlipResult(res.aiResult);
                        setSlipUploaded(true);
                        const slipUrl = res.slipUrl;
                        setSelectedRequest((prev) => (prev ? { ...prev, slipUrl } : null));
                        setRequests((prev) =>
                          prev.map((r) => (r.id === selectedRequest.id ? { ...r, slipUrl } : r))
                        );
                      } catch (e: any) {
                        setSlipUploadError(e?.message || 'Failed to upload/analyze slip');
                      } finally {
                        setSlipUploading(false);
                      }
                    }}
                    className="w-full py-3 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {slipUploading ? (
                      <>
                        <Icon icon="ri:loader-4-line" className="animate-spin text-base" />
                        <span>Analyzing…</span>
                      </>
                    ) : (
                      <>
                        <Icon icon="ri:robot-2-line" className="text-base" />
                        <span>Analyze</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {!slipSent && slipUploaded && (
                <>
                  <div className="relative rounded-xl overflow-hidden border-2 border-teal-400">
                    {slipPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slipPreviewUrl}
                        alt="Uploaded deposit slip"
                        className="w-full h-52 object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-52 flex items-center justify-center bg-slate-50 text-slate-400">
                        <Icon icon="ri:image-line" className="text-3xl" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Icon icon="ri:checkbox-circle-fill" className="text-sm" />
                      <span>Uploaded</span>
                    </div>
                    <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-teal-400" />
                    <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-teal-400" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-teal-400" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-teal-400" />
                  </div>

                  {slipResult && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon icon="ri:sparkling-line" className="text-amber-500 text-base" />
                        <h4 className="text-sm font-bold text-slate-900">AI Detected</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Deposit date</p>
                          <p className="font-semibold text-slate-900">{slipResult.deposit_date || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-900">
                            {typeof slipResult.amount === 'number' ? formatMoney(slipResult.amount) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Reference</p>
                          <p className="font-semibold text-slate-900 truncate" title={slipResult.reference || ''}>
                            {slipResult.reference || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Bank / Last4</p>
                          <p className="font-semibold text-slate-900 truncate" title={`${slipResult.bank_name || ''} ${slipResult.account_last4 || ''}`}>
                            {(slipResult.bank_name || '—') + (slipResult.account_last4 ? ` • ${slipResult.account_last4}` : '')}
                          </p>
                        </div>
                      </div>

                      {slipResult.validation && (
                        <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                          <p className="text-xs text-slate-500 mb-1">Validation</p>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon={slipResult.validation.amount_matches ? 'ri:checkbox-circle-fill' : 'ri:error-warning-fill'}
                              className={slipResult.validation.amount_matches ? 'text-teal-600' : 'text-amber-600'}
                            />
                            <p className="text-sm font-semibold text-slate-900">
                              {slipResult.validation.amount_matches ? 'Amount matches cheque' : 'Amount mismatch'}
                            </p>
                          </div>
                          {Array.isArray(slipResult.validation.issues) && slipResult.validation.issues.length > 0 && (
                            <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-1">
                              {slipResult.validation.issues.slice(0, 4).map((x: any, i: number) => (
                                <li key={i}>{String(x)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSlip(selectedRequest.id)}
                      disabled={slipSending || !slipUploaded}
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
              <Icon icon="ri:close-line" className="text-xl" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
