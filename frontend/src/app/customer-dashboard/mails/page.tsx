"use client";

import { useState } from 'react';

type MailStatus = 'Unread' | 'Read' | 'Archived';

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

const INITIAL_MAILS: Mail[] = [
  {
    id: 'M-2024-001', subject: 'Invoice #INV-2024-001 – January Services', sender: 'ABC Corporation', senderEmail: 'billing@abccorp.com',
    preview: 'Monthly service invoice for January 2024 totaling $12,500.00. Payment due by February 15, 2024.',
    body: 'Dear Acme Corporation,\n\nPlease find enclosed Invoice #INV-2024-001 for services rendered during January 2024.\n\nInvoice Details:\n- Consulting Services: $8,500.00\n- Software Licenses: $3,000.00\n- Support Package: $1,000.00\n\nTotal Due: $12,500.00\nPayment Due: February 15, 2024\n\nPayment can be made via bank transfer or cheque. Please reference invoice number on payment.\n\nThank you for your business.',
    date: 'Jan 22, 2024', timeShort: 'Jan 22', status: 'Unread', category: 'Invoice', hasAttachment: true, scannedPages: 3, starred: true,
    tag: 'Invoice', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
    thumbnail: 'https://readdy.ai/api/search-image?query=professional%20business%20invoice%20document%20with%20company%20letterhead%20clean%20white%20background%20minimalist%20corporate%20style%20formal%20paper&width=160&height=110&seq=cml1&orientation=landscape',
    aiSummary: 'Invoice for January 2024 services. Total amount $12,500 due February 15. Includes consulting, software licenses, and support.'
  },
  {
    id: 'M-2024-002', subject: 'Contract Renewal Notice – Annual Agreement 2024', sender: 'XYZ Services Ltd', senderEmail: 'contracts@xyzservices.com',
    preview: 'Your annual service contract is up for renewal. Please review the updated terms and conditions by February 10.',
    body: 'Dear Valued Client,\n\nThis letter serves as formal notice that your Annual Service Agreement (Contract #XYZ-2023-AC-089) is scheduled for renewal on March 1, 2024.\n\nKey Changes for 2024:\n- Service rate adjustment: 3% increase (CPI aligned)\n- Extended support hours: 7AM–9PM\n- Added cloud backup services\n\nNew Contract Term: March 1, 2024 – February 28, 2025\nAnnual Value: $48,000.00\n\nPlease sign and return the enclosed renewal agreement by February 10, 2024 to avoid any service interruption.',
    date: 'Jan 21, 2024', timeShort: 'Jan 21', status: 'Read', category: 'Contract', hasAttachment: true, scannedPages: 8, starred: true,
    tag: 'Contract', tagColor: 'bg-amber-100 text-amber-700',
    thumbnail: 'https://readdy.ai/api/search-image?query=official%20legal%20contract%20document%20with%20signature%20lines%20professional%20business%20agreement%20white%20background%20clean%20formal%20corporate%20paper&width=160&height=110&seq=cml2&orientation=landscape',
    aiSummary: 'Contract renewal notice for annual agreement expiring March 2024. 3% rate increase. New term runs to Feb 2025. Requires signature by Feb 10.'
  },
  {
    id: 'M-2024-003', subject: 'January 2024 Bank Statement – Account ****4521', sender: 'Bank of Commerce', senderEmail: 'statements@bankofcommerce.com',
    preview: 'Your account statement for January 2024 is ready. Opening balance: $245,000. Closing balance: $287,500.',
    body: 'Dear Account Holder,\n\nEnclosed please find your official bank statement for the period January 1–31, 2024.\n\nAccount Summary:\nOpening Balance: $245,000.00\nTotal Credits: $87,500.00\nTotal Debits: $45,000.00\nClosing Balance: $287,500.00\n\nFor any discrepancies, please contact customer service within 30 days of statement date.',
    date: 'Jan 20, 2024', timeShort: 'Jan 20', status: 'Read', category: 'Statement', hasAttachment: false, scannedPages: 4, starred: false,
    tag: 'Statement', tagColor: 'bg-green-100 text-[#2F8F3A]',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20account%20statement%20document%20with%20transaction%20details%20financial%20data%20rows%20clean%20professional%20banking%20letterhead%20white%20background&width=160&height=110&seq=cml3&orientation=landscape',
    aiSummary: 'Bank statement Jan 2024. Opening $245K, closing $287.5K. Net gain of $42.5K. 12 credit transactions, 8 debit transactions.'
  },
  {
    id: 'M-2024-004', subject: 'Property Tax Assessment Notice – Q1 2024', sender: 'City Revenue Authority', senderEmail: 'notices@cityrevenue.gov',
    preview: 'Annual property tax assessment for your commercial property at 450 Business Park Drive. Q1 due March 31.',
    body: 'Property Address: 450 Business Park Drive\nAssessment Year: 2024\n\nAssessed Value: $2,400,000.00\nTax Rate: 1.85%\nAnnual Tax: $44,400.00\nQuarterly Installment: $11,100.00\n\nQ1 Payment Due: March 31, 2024\n\nPayment methods: Online portal, bank transfer, or in-person at City Hall.',
    date: 'Jan 18, 2024', timeShort: 'Jan 18', status: 'Unread', category: 'Government', hasAttachment: true, scannedPages: 2, starred: false,
    tag: 'Government', tagColor: 'bg-slate-100 text-slate-600',
    thumbnail: 'https://readdy.ai/api/search-image?query=official%20government%20tax%20assessment%20notice%20document%20with%20seal%20and%20formal%20letterhead%20professional%20white%20background%20clean%20government%20paper&width=160&height=110&seq=cml4&orientation=landscape',
    aiSummary: 'Property tax assessment 2024. Property valued at $2.4M, annual tax $44,400. Q1 installment of $11,100 due March 31.'
  },
  {
    id: 'M-2024-005', subject: 'Software License Renewal – Enterprise Suite', sender: 'TechSoft Solutions', senderEmail: 'licenses@techsoft.io',
    preview: 'Your Enterprise Software Suite license expires on February 28, 2024. Renew now to avoid disruption.',
    body: 'Dear IT Administrator,\n\nYour TechSoft Enterprise Suite license (License ID: TS-ENT-00892) is due for renewal.\n\nCurrent License:\n- 50 user seats\n- Enterprise modules\n- Priority support\nExpiry: February 28, 2024\n\nRenewal Pricing:\n- Annual: $24,000/year ($2,000/month)\n- 3-Year: $64,800 (10% discount)\n\nPlease contact your account manager by Feb 15 to process renewal.',
    date: 'Jan 17, 2024', timeShort: 'Jan 17', status: 'Read', category: 'Invoice', hasAttachment: false, scannedPages: 2, starred: false,
    tag: 'Invoice', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
    thumbnail: 'https://readdy.ai/api/search-image?query=software%20license%20renewal%20notice%20document%20professional%20business%20letter%20with%20technology%20company%20branding%20clean%20white%20background%20formal&width=160&height=110&seq=cml5&orientation=landscape',
    aiSummary: 'Enterprise software license expiring Feb 28. 50 seats. Renewal options: $24K/year or $64.8K for 3 years. Respond by Feb 15.'
  },
  {
    id: 'M-2024-006', subject: 'Insurance Policy Renewal – Commercial Property', sender: 'SecureGuard Insurance', senderEmail: 'renewals@secureguard.com',
    preview: 'Your commercial property insurance policy #SP-2023-44291 is up for renewal effective April 1, 2024.',
    body: 'Dear Policyholder,\n\nYour commercial property insurance policy is due for renewal.\n\nPolicy: #SP-2023-44291\nCoverage: Commercial Property & Liability\nRenewal Date: April 1, 2024\n\nPremium Summary:\nPrevious Annual Premium: $18,600.00\nNew Annual Premium: $19,200.00 (+3.2%)\n\nCoverage includes: Building, contents, business interruption, and general liability up to $5M.',
    date: 'Jan 15, 2024', timeShort: 'Jan 15', status: 'Archived', category: 'Insurance', hasAttachment: true, scannedPages: 6, starred: false,
    tag: 'Insurance', tagColor: 'bg-amber-100 text-amber-700',
    thumbnail: 'https://readdy.ai/api/search-image?query=insurance%20policy%20renewal%20document%20with%20formal%20letterhead%20professional%20business%20insurance%20notice%20clean%20white%20background%20corporate%20paper&width=160&height=110&seq=cml6&orientation=landscape',
    aiSummary: 'Insurance renewal notice. Premium increasing 3.2% to $19,200/year. Covers building, contents, business interruption and $5M liability. Renews April 1.'
  },
  {
    id: 'M-2024-007', subject: 'Quarterly Business Review – Q4 2023 Report', sender: 'Metro Consulting Group', senderEmail: 'reports@metroconsulting.com',
    preview: 'Enclosed is your Q4 2023 business performance review with 18% YoY revenue growth and strategic recommendations.',
    body: 'Dear Leadership Team,\n\nPlease find the enclosed Q4 2023 Business Performance Review.\n\nHighlights:\n- Revenue growth: 18% YoY\n- EBITDA margin improved to 24%\n- Customer retention: 94%\n- Market share: +2.3%\n\nKey Recommendations for 2024:\n1. Expand into the northeast market\n2. Invest in automation\n3. Strengthen supply chain',
    date: 'Jan 12, 2024', timeShort: 'Jan 12', status: 'Read', category: 'Report', hasAttachment: true, scannedPages: 24, starred: true,
    tag: 'Report', tagColor: 'bg-green-100 text-[#2F8F3A]',
    thumbnail: 'https://readdy.ai/api/search-image?query=business%20quarterly%20report%20document%20with%20charts%20and%20data%20analysis%20professional%20consulting%20firm%20letterhead%20white%20background%20clean%20formal%20corporate&width=160&height=110&seq=cml7&orientation=landscape',
    aiSummary: 'Q4 2023 review. 18% revenue growth, 24% EBITDA margin, 94% customer retention. Recommends northeast expansion, automation investment, supply chain strengthening.'
  },
  {
    id: 'M-2024-008', subject: 'Utility Bill – Commercial Account January 2024', sender: 'City Power & Water', senderEmail: 'billing@citypowerwater.com',
    preview: 'Your combined utility bill for January 2024. Total amount due: $3,245.00. Auto-pay enrolled.',
    body: 'Account: #CP-2024-88712\nService Address: 450 Business Park Drive\n\nElectricity: $1,890.00 (42,000 kWh)\nWater: $645.00\nGas: $560.00\nWaste Management: $150.00\n\nTotal Due: $3,245.00\nDue Date: February 10, 2024\n\nAuto-pay enrolled. Payment will be processed on due date.',
    date: 'Jan 10, 2024', timeShort: 'Jan 10', status: 'Archived', category: 'Utility', hasAttachment: false, scannedPages: 2, starred: false,
    tag: 'Utility', tagColor: 'bg-slate-100 text-slate-600',
    thumbnail: 'https://readdy.ai/api/search-image?query=utility%20bill%20statement%20document%20electricity%20water%20gas%20charges%20professional%20billing%20statement%20white%20background%20clean%20minimal%20corporate&width=160&height=110&seq=cml8&orientation=landscape',
    aiSummary: 'January utility bill totaling $3,245. Electricity $1,890, water $645, gas $560, waste $150. Auto-pay on Feb 10.'
  },
];

const statusColors: Record<MailStatus, string> = {
  'Unread': 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  'Read': 'bg-slate-100 text-slate-600',
  'Archived': 'bg-amber-100 text-amber-700',
};

export default function CustomerMailsPage() {
  const [mails, setMails] = useState<Mail[]>(INITIAL_MAILS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const filtered = mails.filter(m => {
    const matchSearch =
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.preview.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const unreadCount = mails.filter(m => m.status === 'Unread').length;

  const toggleStar = (id: string) => {
    setMails(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
    if (selectedMail?.id === id) setSelectedMail(prev => prev ? { ...prev, starred: !prev.starred } : null);
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllCheck = () => {
    if (allChecked) { setCheckedIds(new Set()); setAllChecked(false); }
    else { setCheckedIds(new Set(filtered.map(m => m.id))); setAllChecked(true); }
  };

  const openMail = (mail: Mail) => {
    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, status: m.status === 'Unread' ? 'Read' : m.status } : m));
    setSelectedMail({ ...mail, status: mail.status === 'Unread' ? 'Read' : mail.status });
  };

  const archiveMail = (id: string) => {
    setMails(prev => prev.map(m => m.id === id ? { ...m, status: 'Archived' } : m));
    if (selectedMail?.id === id) setSelectedMail(prev => prev ? { ...prev, status: 'Archived' } : null);
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
                onChange={e => setSearch(e.target.value)}
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
                  onClick={() => { checkedIds.forEach(id => archiveMail(id)); setCheckedIds(new Set()); setAllChecked(false); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Archive"
                >
                  <i className="ri-archive-line text-slate-500 text-base"></i>
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Mark as read"
                  onClick={() => {
                    setMails(prev => prev.map(m => checkedIds.has(m.id) ? { ...m, status: 'Read' } : m));
                    setCheckedIds(new Set()); setAllChecked(false);
                  }}
                >
                  <i className="ri-mail-open-line text-slate-500 text-base"></i>
                </button>
                <span className="text-xs text-slate-500 ml-1">{checkedIds.size} selected</span>
              </div>
            )}
            <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
              <i className="ri-refresh-line text-slate-500 text-base"></i>
            </button>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">1–{filtered.length} of {mails.length}</span>
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
          {['All', 'Unread', 'Read', 'Archived'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab ? 'border-[#0A3D8F] text-[#0A3D8F]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-500'}`}>
                  {mails.filter(m => m.status === tab).length}
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
              {filtered.map(mail => (
                <div
                  key={mail.id}
                  className="group flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openMail(mail)}
                >
                  <div className="flex items-center gap-2 sm:mr-2">
                    <div className="flex items-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedIds.has(mail.id)}
                        onChange={() => toggleCheck(mail.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer"
                      />
                    </div>
                    <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); toggleStar(mail.id); }}>
                      <i className={`${mail.starred ? 'ri-star-fill text-amber-400' : 'ri-star-line text-slate-300 group-hover:text-slate-400'} text-lg cursor-pointer transition-colors`}></i>
                    </div>
                    <div className="flex-shrink-0">
                      <i className={`ri-bookmark-fill text-sm ${mail.status === 'Unread' ? 'text-amber-400' : 'text-slate-200'}`}></i>
                    </div>
                    <span className={`sm:hidden ml-auto text-xs shrink-0 ${mail.status === 'Unread' ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {mail.timeShort}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-2 sm:w-44 sm:flex-shrink-0">
                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold">
                        {mail.sender.charAt(0)}
                      </div>
                      <span className={`min-w-0 truncate text-sm ${mail.status === 'Unread' ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {mail.sender}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:mr-4">
                      <span className={`inline-flex shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${mail.tagColor}`}>
                        {mail.tag}
                      </span>
                      <span className={`min-w-0 flex-1 text-sm sm:truncate ${mail.status === 'Unread' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {mail.subject}
                      </span>
                      <span className="w-full text-sm text-slate-400 line-clamp-2 sm:line-clamp-1 lg:max-w-md lg:truncate">
                        {mail.preview}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 sm:flex-shrink-0 sm:justify-start">
                      {mail.hasAttachment && <i className="ri-attachment-2 text-slate-400 text-base"></i>}
                      <span className="hidden text-right text-xs text-slate-400 lg:inline lg:w-12">{mail.scannedPages}p</span>
                      <span className={`hidden text-right text-xs sm:inline sm:w-14 ${mail.status === 'Unread' ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 md:p-6" onClick={() => setSelectedMail(null)}>
          <div className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="hidden w-10 h-10 shrink-0 bg-[#0A3D8F]/10 rounded-lg sm:flex items-center justify-center">
                  <i className="ri-mail-open-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">{selectedMail.subject}</h2>
                  <p className="text-xs text-slate-500">{selectedMail.id} • {selectedMail.date}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedMail(null)} className="self-end p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer sm:self-auto">
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-200 sm:h-52">
                <img src={selectedMail.thumbnail} alt="Mail document" className="w-full h-full object-cover object-top" />
              </div>

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
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMail.aiSummary}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <i className="ri-robot-line text-[#0A3D8F] text-sm"></i>
                  <span className="text-xs text-slate-400">Generated by VScan AI</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Document Content</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{selectedMail.body}</p>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-stretch">
                <button type="button" className="w-full py-3 bg-[#0A3D8F] text-white font-semibold rounded-lg hover:bg-[#083170] transition-colors text-sm cursor-pointer sm:flex-1 min-w-[140px]">
                  <i className="ri-download-line mr-2"></i>Download PDF
                </button>
                {selectedMail.status !== 'Archived' && (
                  <button
                    type="button"
                    onClick={() => { archiveMail(selectedMail.id); setSelectedMail(null); }}
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
    </div>
  );
}
