"use client";

import { useState } from 'react';

type ChequeStatus = 'Pending' | 'Deposit Requested' | 'Pickup Requested' | 'Deposited' | 'Picked Up';

interface Cheque {
  id: string;
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
  { id: 'ba1', bankName: 'Bank of Commerce', accountName: 'Acme Corp Operating', accountNo: '****4521', type: 'Checking' },
  { id: 'ba2', bankName: 'First National Bank', accountName: 'Acme Corp Savings', accountNo: '****8834', type: 'Savings' },
];

const INITIAL_CHEQUES: Cheque[] = [
  {
    id: 'CH-2024-015', chequeNo: '0045821', amount: '$5,000.00', from: 'Global Tech Inc',
    bank: 'Wells Fargo', date: 'Jan 22, 2024', timeShort: 'Jan 22', status: 'Pending', starred: true, read: false,
    memo: 'Project milestone payment – Phase 2 completion',
    tag: 'Pending', tagColor: 'bg-amber-100 text-amber-700',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20cheque%20check%20document%20professional%20financial%20instrument%20with%20amount%20and%20signature%20lines%20clean%20white%20background%20banking%20document&width=160&height=100&seq=cch1&orientation=landscape',
    aiSummary: 'Cheque from Global Tech Inc via Wells Fargo for $5,000.00. Cheque number 0045821. Issued January 22, 2024. Awaiting your action – deposit or pickup.',
  },
  {
    id: 'CH-2024-014', chequeNo: '0092341', amount: '$2,500.00', from: 'Metro Solutions',
    bank: 'Chase Bank', date: 'Jan 20, 2024', timeShort: 'Jan 20', status: 'Pending', starred: false, read: false,
    memo: 'Consulting fees – Q4 2023',
    tag: 'Pending', tagColor: 'bg-amber-100 text-amber-700',
    thumbnail: 'https://readdy.ai/api/search-image?query=business%20cheque%20payment%20document%20with%20handwritten%20amount%20formal%20banking%20instrument%20white%20background%20professional%20financial%20paper&width=160&height=100&seq=cch2&orientation=landscape',
    aiSummary: 'Cheque from Metro Solutions via Chase Bank for $2,500.00. Cheque number 0092341. Consulting fee for Q4 2023. Awaiting your action.',
  },
  {
    id: 'CH-2024-013', chequeNo: '0031908', amount: '$1,200.00', from: 'Sunrise Enterprises',
    bank: 'Bank of America', date: 'Jan 17, 2024', timeShort: 'Jan 17', status: 'Pending', starred: false, read: true,
    memo: 'Monthly retainer – January 2024',
    tag: 'Pending', tagColor: 'bg-amber-100 text-amber-700',
    thumbnail: 'https://readdy.ai/api/search-image?query=official%20cheque%20document%20corporate%20payment%20instrument%20with%20bank%20routing%20number%20and%20account%20details%20clean%20white%20background&width=160&height=100&seq=cch3&orientation=landscape',
    aiSummary: 'Cheque from Sunrise Enterprises via Bank of America for $1,200.00. Monthly retainer for January 2024. Awaiting action.',
  },
  {
    id: 'CH-2024-012', chequeNo: '0078432', amount: '$8,750.00', from: 'Pacific Distributors',
    bank: 'Citibank', date: 'Jan 12, 2024', timeShort: 'Jan 12', status: 'Deposit Requested', starred: true, read: true,
    memo: 'Invoice #1045 – Annual supply contract',
    tag: 'In Process', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20cheque%20with%20dollar%20amount%20corporate%20business%20payment%20formal%20document%20white%20background%20clean%20financial%20instrument%20professional&width=160&height=100&seq=cch4&orientation=landscape',
    aiSummary: 'Cheque from Pacific Distributors via Citibank for $8,750.00. Annual supply contract payment. Deposit request submitted – being processed.',
  },
  {
    id: 'CH-2024-011', chequeNo: '0055123', amount: '$3,300.00', from: 'Apex Industries LLC',
    bank: 'US Bank', date: 'Jan 10, 2024', timeShort: 'Jan 10', status: 'Pickup Requested', starred: false, read: true,
    memo: 'Equipment rental fee Q4',
    tag: 'In Process', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
    thumbnail: 'https://readdy.ai/api/search-image?query=cheque%20document%20with%20corporate%20letterhead%20professional%20financial%20payment%20instrument%20formal%20white%20background%20business&width=160&height=100&seq=cch5&orientation=landscape',
    aiSummary: 'Cheque from Apex Industries LLC via US Bank for $3,300.00. Equipment rental Q4 fee. Pickup has been scheduled.',
  },
  {
    id: 'CH-2024-010', chequeNo: '0044891', amount: '$12,500.00', from: 'Northern Logistics',
    bank: 'Wells Fargo', date: 'Jan 7, 2024', timeShort: 'Jan 7', status: 'Deposited', starred: true, read: true,
    memo: 'Logistics services – Dec 2023',
    tag: 'Deposited', tagColor: 'bg-green-100 text-[#2F8F3A]',
    thumbnail: 'https://readdy.ai/api/search-image?query=processed%20bank%20cheque%20document%20with%20deposit%20stamp%20formal%20financial%20payment%20instrument%20professional%20white%20background%20banking&width=160&height=100&seq=cch6&orientation=landscape',
    aiSummary: 'Cheque from Northern Logistics via Wells Fargo for $12,500.00. Successfully deposited on January 8, 2024. Transaction reference: TXN-2024-11021.',
  },
  {
    id: 'CH-2024-009', chequeNo: '0039044', amount: '$6,800.00', from: 'Summit Retail Group',
    bank: 'Chase Bank', date: 'Dec 30, 2023', timeShort: 'Dec 30', status: 'Deposited', starred: false, read: true,
    memo: 'Vendor partnership payment',
    tag: 'Deposited', tagColor: 'bg-green-100 text-[#2F8F3A]',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20cheque%20payment%20document%20endorsed%20formal%20corporate%20financial%20instrument%20clean%20white%20background%20professional%20banking%20paper&width=160&height=100&seq=cch7&orientation=landscape',
    aiSummary: 'Cheque from Summit Retail Group via Chase Bank for $6,800.00. Deposited December 31, 2023. Transaction reference: TXN-2023-98744.',
  },
  {
    id: 'CH-2024-008', chequeNo: '0027612', amount: '$2,000.00', from: 'Lakeside Properties',
    bank: 'Regions Bank', date: 'Dec 22, 2023', timeShort: 'Dec 22', status: 'Picked Up', starred: false, read: true,
    memo: 'Office lease deposit refund',
    tag: 'Picked Up', tagColor: 'bg-slate-100 text-slate-600',
    thumbnail: 'https://readdy.ai/api/search-image?query=cheque%20document%20with%20official%20corporate%20stamp%20and%20signature%20formal%20financial%20instrument%20banking%20paper%20white%20background%20professional&width=160&height=100&seq=cch8&orientation=landscape',
    aiSummary: 'Cheque from Lakeside Properties via Regions Bank for $2,000.00. Picked up on December 23, 2023. Office lease deposit refund.',
  },
];

const statusColors: Record<ChequeStatus, string> = {
  'Pending': 'bg-amber-100 text-amber-700',
  'Deposit Requested': 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  'Pickup Requested': 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  'Deposited': 'bg-green-100 text-[#2F8F3A]',
  'Picked Up': 'bg-slate-100 text-slate-600',
};

type ModalType = 'deposit' | 'pickup' | null;

export default function CustomerChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>(INITIAL_CHEQUES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalCheque, setModalCheque] = useState<Cheque | null>(null);
  const [selectedBank, setSelectedBank] = useState(BANK_ACCOUNTS[0].id);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = cheques.filter(c => {
    const matchSearch =
      c.from.toLowerCase().includes(search.toLowerCase()) ||
      c.bank.toLowerCase().includes(search.toLowerCase()) ||
      c.chequeNo.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = cheques.filter(c => c.status === 'Pending').length;
  const totalAmount = cheques.reduce((s, c) => s + parseFloat(c.amount.replace(/[$,]/g, '')), 0);

  const toggleStar = (id: string) => {
    setCheques(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
    if (selectedCheque?.id === id) setSelectedCheque(prev => prev ? { ...prev, starred: !prev.starred } : null);
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
    if (allChecked) { setCheckedIds(new Set()); setAllChecked(false); }
    else { setCheckedIds(new Set(filtered.map(c => c.id))); setAllChecked(true); }
  };

  const openCheque = (cheque: Cheque) => {
    setCheques(prev => prev.map(c => c.id === cheque.id ? { ...c, read: true } : c));
    setSelectedCheque({ ...cheque, read: true });
  };

  const openModal = (cheque: Cheque, type: ModalType) => {
    setModalCheque(cheque);
    setModalType(type);
  };

  const handleDeposit = () => {
    if (!modalCheque) return;
    setCheques(prev => prev.map(c => c.id === modalCheque.id ? { ...c, status: 'Deposit Requested', tag: 'In Process', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]', read: true } : c));
    if (selectedCheque?.id === modalCheque.id) setSelectedCheque(null);
    setModalType(null); setModalCheque(null);
    setSuccessMsg('Deposit request submitted successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handlePickup = () => {
    if (!modalCheque) return;
    setCheques(prev => prev.map(c => c.id === modalCheque.id ? { ...c, status: 'Pickup Requested', tag: 'In Process', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]', read: true } : c));
    if (selectedCheque?.id === modalCheque.id) setSelectedCheque(null);
    setModalType(null); setModalCheque(null); setPickupDate(''); setPickupNotes('');
    setSuccessMsg('Pickup request submitted successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const tabs = ['All', 'Pending', 'Deposit Requested', 'Pickup Requested', 'Deposited', 'Picked Up'];

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
                onChange={e => setSearch(e.target.value)}
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
            <span className="text-xs text-slate-500 whitespace-nowrap">1–{filtered.length} of {cheques.length}</span>
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
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 ${
                statusFilter === tab ? 'border-[#0A3D8F] text-[#0A3D8F]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-500'}`}>
                  {cheques.filter(c => c.status === tab).length}
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
              {filtered.map(cheque => (
                <div
                  key={cheque.id}
                  className="group flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openCheque(cheque)}
                >
                  <div className="flex items-center gap-2 sm:mr-2">
                    <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(cheque.id)}
                        onChange={() => toggleCheck(cheque.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                      />
                    </div>
                    <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); toggleStar(cheque.id); }}>
                      <i className={`${cheque.starred ? 'ri-star-fill text-amber-400' : 'ri-star-line text-slate-300 group-hover:text-slate-400'} text-lg cursor-pointer transition-colors`}></i>
                    </div>
                    <div className="flex-shrink-0">
                      <i className={`ri-bookmark-fill text-sm ${!cheque.read ? 'text-amber-400' : 'text-slate-200'}`}></i>
                    </div>
                    <span className={`sm:hidden ml-auto text-xs font-medium ${!cheque.read ? 'text-slate-900' : 'text-slate-500'}`}>
                      {cheque.amount}
                    </span>
                    <span className={`sm:hidden text-xs ${!cheque.read ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {cheque.timeShort}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-2 sm:w-40 sm:flex-shrink-0">
                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold">
                        {cheque.from.charAt(0)}
                      </div>
                      <span className={`min-w-0 truncate text-sm ${!cheque.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {cheque.from}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                      <span className={`inline-flex w-fit shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cheque.tagColor}`}>
                        {cheque.tag}
                      </span>
                      <span className={`text-sm sm:truncate ${!cheque.read ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {cheque.bank} – #{cheque.chequeNo}
                      </span>
                      <span className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-1 sm:text-sm xl:max-w-xs xl:truncate">
                        {cheque.memo}
                      </span>
                    </div>

                    <div className="hidden text-sm font-bold sm:block sm:w-24 sm:flex-shrink-0 sm:text-right">
                      <span className={!cheque.read ? 'text-slate-900' : 'text-slate-600'}>{cheque.amount}</span>
                    </div>

                    {cheque.status === 'Pending' && (
                      <div className="flex w-full gap-2 sm:w-auto sm:flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openModal(cheque, 'deposit')}
                          className="min-h-[44px] flex-1 px-3 py-2 bg-[#2F8F3A] text-white rounded-full text-xs font-semibold hover:bg-[#267a30] transition-colors cursor-pointer sm:flex-initial sm:px-2.5 sm:py-1"
                        >
                          Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(cheque, 'pickup')}
                          className="min-h-[44px] flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer sm:flex-initial sm:px-2.5 sm:py-1"
                        >
                          Pickup
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 sm:flex-shrink-0 sm:justify-start">
                      <i className="ri-bank-line text-slate-300 text-base group-hover:text-slate-400 transition-colors hidden sm:block"></i>
                      <span className={`hidden text-xs sm:inline sm:w-14 sm:text-right ${!cheque.read ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 md:p-6" onClick={() => setSelectedCheque(null)}>
          <div className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="hidden w-10 h-10 shrink-0 bg-[#0A3D8F]/10 rounded-lg sm:flex items-center justify-center">
                  <i className="ri-bank-card-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">{selectedCheque.bank} Cheque</h2>
                  <p className="text-xs text-slate-500 break-words">{selectedCheque.id} • #{selectedCheque.chequeNo} • {selectedCheque.date}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCheque(null)} className="self-end p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer sm:self-auto">
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-200 sm:h-52">
                <img src={selectedCheque.thumbnail} alt="Cheque document" className="w-full h-full object-cover object-top" />
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

              <div className="p-5 bg-gradient-to-br from-[#0A3D8F]/5 to-slate-50 rounded-xl border border-[#0A3D8F]/10">
                <div className="flex items-center space-x-2 mb-3">
                  <i className="ri-sparkling-line text-amber-500 text-lg"></i>
                  <h3 className="text-sm font-bold text-slate-800">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedCheque.aiSummary}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <i className="ri-robot-line text-[#0A3D8F] text-sm"></i>
                  <span className="text-xs text-slate-400">Generated by VScan AI</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                {selectedCheque.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setSelectedCheque(null); openModal(selectedCheque, 'deposit'); }}
                      className="w-full py-3 bg-[#2F8F3A] text-white font-semibold rounded-lg hover:bg-[#267a30] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                    >
                      <i className="ri-bank-line mr-2"></i>Deposit to Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedCheque(null); openModal(selectedCheque, 'pickup'); }}
                      className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]"
                    >
                      <i className="ri-hand-coin-line mr-2"></i>Request Pickup
                    </button>
                  </>
                )}
                <button type="button" className="w-full py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]">
                  <i className="ri-download-line mr-2"></i>Download
                </button>
                <button type="button" onClick={() => setSelectedCheque(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm cursor-pointer sm:w-auto sm:px-5 sm:flex-shrink-0">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {modalType === 'deposit' && modalCheque && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
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
                <p className="text-sm text-slate-600 mt-1">From: {modalCheque.from} — {modalCheque.bank}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Destination Bank Account</label>
                <div className="space-y-2">
                  {BANK_ACCOUNTS.map(ba => (
                    <label key={ba.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedBank === ba.id ? 'border-[#0A3D8F] bg-[#0A3D8F]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="bank" value={ba.id} checked={selectedBank === ba.id} onChange={() => setSelectedBank(ba.id)} className="accent-[#0A3D8F]" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ba.accountName}</p>
                        <p className="text-xs text-slate-500">{ba.bankName} • {ba.accountNo} • {ba.type}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModalType(null)} className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={handleDeposit} className="flex-1 py-3 bg-[#2F8F3A] text-white rounded-lg text-sm font-semibold hover:bg-[#267a30] cursor-pointer whitespace-nowrap">Submit Deposit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Modal */}
      {modalType === 'pickup' && modalCheque && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
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
                <p className="text-sm text-slate-600 mt-1">From: {modalCheque.from} — {modalCheque.bank}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address / Notes</label>
                <textarea
                  value={pickupNotes}
                  onChange={e => setPickupNotes(e.target.value.slice(0, 500))}
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
                <button onClick={() => setModalType(null)} className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={handlePickup} className="flex-1 py-3 bg-[#0A3D8F] text-white rounded-lg text-sm font-semibold hover:bg-[#083170] cursor-pointer whitespace-nowrap">Submit Pickup Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
