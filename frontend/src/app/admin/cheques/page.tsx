"use client";

import { Suspense, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import ChequeToolbar from './components/ChequeToolbar';
import ChequeRow, { type UiCheque, type ChequeListStatus } from './components/ChequeRow';
import { useAdminProfile } from '../components/useAdminProfile';
import ClickedCheque from './components/ClickedCheque';
import styles from './page.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { chequeApi, type Cheque as ApiCheque } from '@/lib/api/cheques';
import OrganizationPicker from '../components/OrganizationPicker';
import NotificationBell from '../components/NotificationBell';

type TabType = 'All' | 'Pending Deposit' | 'Deposited' | 'Rejected' | 'On Hold';
type ChequeItem = UiCheque & { archived?: boolean; archiveBox?: string };

const TABS: { label: TabType }[] = [
  { label: 'All' },
  { label: 'Pending Deposit' },
  { label: 'Deposited' },
  { label: 'Rejected' },
  { label: 'On Hold' },
];

const PER_PAGE = 10;

export default function AllChequesPage() {
  return (
    <Suspense fallback={null}>
      <AllChequesPageContent />
    </Suspense>
  );
}

function AllChequesPageContent() {
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const [chequeItems, setChequeItems] = useState<ChequeItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCheque, setOpenedCheque] = useState<UiCheque | null>(null);
  const [loading, setLoading] = useState(true);

  const tabFromUrl = searchParams.get('tab');
  const clientId = searchParams.get('clientId') || '';
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/admin/scan';

  const normalizeStatus = (c: ApiCheque): ChequeListStatus => {
    if (c.client_decision === 'rejected') return 'Rejected';
    if (c.status === 'deposited' || c.status === 'cleared') return 'Deposited';
    if (c.status === 'flagged') return 'On Hold';
    return 'Pending Deposit';
  };

  const COMPANY_COLORS = [
    'bg-[#1E40AF]',
    'bg-[#0F766E]',
    'bg-[#7C3AED]',
    'bg-[#B45309]',
    'bg-[#BE123C]',
    'bg-[#334155]',
  ];

  const hashToIndex = (s: string, max: number) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % max;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toUiCheque = (c: ApiCheque): UiCheque => {
    const company = c.company_name || 'Unknown Company';
    const bankName = c.ai_raw_result?.bank_name || c.ai_raw_result?.bankName || 'Bank';
    const chequeNumber =
      c.ai_raw_result?.cheque_number ||
      c.ai_raw_result?.chequeNumber ||
      c.ai_raw_result?.number ||
      '—';

    return {
      id: c.id,
      mailItemId: c.mail_item_id,
      starred: false,
      flagged: c.status === 'flagged',
      company,
      companyInitial: company.trim().slice(0, 1).toUpperCase() || 'C',
      companyColor: COMPANY_COLORS[hashToIndex(company, COMPANY_COLORS.length)],
      status: normalizeStatus(c),
      bankName,
      chequeNumber: String(chequeNumber),
      amount: Number(c.amount_figures || 0),
      description:
        c.ai_raw_result?.summary ||
        c.ai_raw_result?.notes ||
        `Cheque for ${c.beneficiary || 'beneficiary'} (${normalizeStatus(c)})`,
      recipient: c.beneficiary || company,
      time: formatTime(c.created_at),
      email: undefined,
      raw: c,
    };
  };

  useEffect(() => {
    let alive = true;
    if (!clientId) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    chequeApi
      .list({ archived: false, clientId, limit: 200 })
      .then((res) => {
        if (!alive) return;
        setChequeItems(res.cheques.map((c) => toUiCheque(c)));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = TABS.find((t) => t.label === tabFromUrl)?.label;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  if (!clientId) {
    return (
      <div className="p-6">
        <OrganizationPicker
          title="Cheques"
          subtitle="Select an organization to view its cheques."
          onPick={(c) => {
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('clientId', c.id);
            router.replace(`${pathname}?${qs.toString()}`);
          }}
        />
      </div>
    );
  }

  const visibleCheques = chequeItems;

  const filtered = visibleCheques.filter((c) => {
    const matchTab = activeTab === 'All' || c.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      c.company.toLowerCase().includes(q) ||
      c.bankName.toLowerCase().includes(q) ||
      c.chequeNumber.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const totalAmount = filtered.reduce((sum, c) => sum + c.amount, 0);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((c) => c.id === id)));
      return;
    }
    const ids = filtered.map((c) => c.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const getTabCount = (status: TabType) => {
    if (status === 'All') return visibleCheques.length;
    return visibleCheques.filter((c) => c.status === status).length;
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} cheque record(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(
        selectedIds.map((id) => fetch(`/api/records/cheques/${id}`, { method: 'DELETE' }))
      );
      setSelectedIds([]);
      const res = await chequeApi.list({ archived: false, clientId, limit: 200 });
      setChequeItems(res.cheques.map((c) => toUiCheque(c)));
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search cheques..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.topActions}>
          <Link href={scanPath}>
            <button className={styles.addBtn}>
              <div className={styles.addBtnIcon}>
                <Icon icon="ri:scan-2-line" className="text-sm" />
              </div>
              New Scan
            </button>
          </Link>

          {!isSuperadminRoute && (
          <>
          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">{displayName}</p>
                <p className="text-xs text-gray-500 uppercase">{displayRole}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                <Link href="/admin/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:user-line" className="text-sm" /></div>
                  My Profile
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:settings-3-line" className="text-sm" /></div>
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                  <Icon icon="ri:logout-box-r-line" className="text-sm" />
                  Sign Out
                </a>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <ChequeToolbar
        total={filtered.length}
        totalAmount={totalAmount}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))}
        allChecked={allVisibleSelected}
        onToggleAll={toggleSelectAll}
      />

      {selectedIds.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Icon icon="ri:delete-bin-line" className="text-sm" />
            Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className={styles.tabsBar}>
        {TABS.map((tab) => {
          const count = getTabCount(tab.label);

          return (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(tab.label);
                setPage(1);
                router.replace(`${pathname}?tab=${encodeURIComponent(tab.label)}`);
              }}
              className={activeTab === tab.label ? styles.tabActive : styles.tab}
            >
              {tab.label}
              {tab.label !== 'All' && (
                <span className={activeTab === tab.label ? styles.badgeActive : styles.badge}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cheque List */}
      <div className={styles.listContainer}>
        <div className={styles.listInner}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon icon="ri:loader-4-line" className="text-3xl animate-spin" />
              </div>
              <p className={styles.emptyText}>Loading cheques...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon icon="ri:bank-card-line" className="text-3xl" />
              </div>
              <p className={styles.emptyText}>No cheques found</p>
            </div>
          ) : (
            paginated.map((cheque) => (
              <ChequeRow
                key={cheque.id}
                cheque={cheque}
                selected={selectedIds.includes(cheque.id)}
                onSelect={handleSelect}
                onOpen={() => setOpenedCheque(cheque)}
              />
            ))
          )}
        </div>
      </div>

      {/* Cheque Detail Modal */}
      {openedCheque && (
        <ClickedCheque cheque={openedCheque} onClose={() => setOpenedCheque(null)} />
      )}
    </div>
  );
}
