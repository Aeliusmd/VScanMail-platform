"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAdminProfile } from '../components/useAdminProfile';

interface ArchivedMail {
  id: string;
  serialNumber: string;
  company: string;
  companyEmail: string;
  sender: string;
  subject: string;
  preview: string;
  scannedAt: string;
  scannedDate: string;
  timeShort: string;
  archivedAt: string;
  archiveBox: string;
  status: 'Processed' | 'Delivered' | 'Pending Delivery';
  aiSummary: string;
  emailSent: boolean;
  thumbnail: string;
  starred: boolean;
  hasAttachment: boolean;
  tag?: string;
  tagColor?: string;
}

interface ArchivedCheque {
  id: string;
  serialNumber: string;
  company: string;
  companyEmail: string;
  payee: string;
  amount: string;
  bankName: string;
  chequeNumber: string;
  scannedAt: string;
  scannedDate: string;
  timeShort: string;
  archivedAt: string;
  archiveBox: string;
  status: 'Deposited' | 'Rejected' | 'On Hold';
  aiSummary: string;
  thumbnail: string;
  starred: boolean;
  depositToggle: boolean;
}

const archivedMailsData: ArchivedMail[] = [
  {
    id: 'ML-A001', serialNumber: 'SN-2025-00045',
    company: 'Meridian Holdings', companyEmail: 'legal@meridianholdings.com',
    sender: 'IRS Department', subject: 'Tax Audit Notice – FY 2023',
    preview: 'IRS audit notice for fiscal year 2023. All records have been reviewed and archived.',
    scannedAt: 'May 20, 2025', scannedDate: '2025-05-20', timeShort: 'May 20',
    archivedAt: 'May 22, 2025', archiveBox: 'BOX-2025-A1',
    status: 'Processed',
    aiSummary: 'IRS audit notice for fiscal year 2023. All financial records reviewed. No discrepancies found. Case closed. Archived per company request.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=official%20IRS%20tax%20audit%20notice%20document%20on%20white%20paper%20with%20government%20letterhead%20formal%20correspondence%20archived%20scanned%20professional&width=160&height=110&seq=arch-thumb-1&orientation=landscape',
    starred: false, hasAttachment: true, tag: 'Inbox', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A002', serialNumber: 'SN-2025-00046',
    company: 'Pinnacle Corp', companyEmail: 'finance@pinnaclecorp.com',
    sender: 'Wells Fargo Bank', subject: 'Annual Account Summary – 2024',
    preview: 'Annual account summary for 2024. Total transactions: 1,240. Net balance: $892,400.',
    scannedAt: 'May 18, 2025', scannedDate: '2025-05-18', timeShort: 'May 18',
    archivedAt: 'May 19, 2025', archiveBox: 'BOX-2025-A1',
    status: 'Delivered',
    aiSummary: 'Annual account summary from Wells Fargo for 2024. Total transactions: 1,240. Net balance: $892,400. No suspicious activity. Delivered to client and archived.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=annual%20bank%20account%20summary%20financial%20document%20on%20white%20background%20with%20tables%20and%20balance%20figures%20professional%20banking%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-2&orientation=landscape',
    starred: true, hasAttachment: false, tag: 'Delivered', tagColor: 'bg-green-100 text-[#2F8F3A]',
  },
  {
    id: 'ML-A003', serialNumber: 'SN-2025-00047',
    company: 'Crestview LLC', companyEmail: 'ops@crestviewllc.com',
    sender: 'State Labor Board', subject: 'Compliance Certificate – Q4 2024',
    preview: 'Labor compliance certificate for Q4 2024. All requirements met. Certificate valid through Dec 2025.',
    scannedAt: 'May 15, 2025', scannedDate: '2025-05-15', timeShort: 'May 15',
    archivedAt: 'May 16, 2025', archiveBox: 'BOX-2025-B2',
    status: 'Processed',
    aiSummary: 'State Labor Board compliance certificate for Q4 2024. All labor requirements met. Certificate valid through December 2025. No violations recorded.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=state%20labor%20board%20compliance%20certificate%20official%20document%20on%20white%20paper%20with%20seal%20and%20signature%20professional%20government%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-3&orientation=landscape',
    starred: false, hasAttachment: false, tag: 'Inbox', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A004', serialNumber: 'SN-2025-00048',
    company: 'Orion Dynamics', companyEmail: 'ceo@oriondynamics.com',
    sender: 'SEC – Enforcement Division', subject: 'Quarterly Filing Confirmation',
    preview: 'SEC confirmation of quarterly filing receipt. Form 10-Q accepted. No further action required.',
    scannedAt: 'May 12, 2025', scannedDate: '2025-05-12', timeShort: 'May 12',
    archivedAt: 'May 14, 2025', archiveBox: 'BOX-2025-B2',
    status: 'Delivered',
    aiSummary: 'SEC confirmation of quarterly filing receipt. Form 10-Q accepted without issues. Filing timestamp: May 12, 2025 at 3:42 PM EST. No further action required.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=SEC%20securities%20exchange%20commission%20quarterly%20filing%20confirmation%20document%20on%20white%20paper%20with%20official%20seal%20professional%20regulatory%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-4&orientation=landscape',
    starred: true, hasAttachment: true, tag: 'Delivered', tagColor: 'bg-green-100 text-[#2F8F3A]',
  },
  {
    id: 'ML-A005', serialNumber: 'SN-2025-00049',
    company: 'Vantage Group', companyEmail: 'admin@vantagegroup.com',
    sender: 'City Planning Office', subject: 'Zoning Permit Approval – 2025',
    preview: 'Zoning permit approved for commercial expansion at 450 Harbor Blvd. Valid through 2026.',
    scannedAt: 'May 8, 2025', scannedDate: '2025-05-08', timeShort: 'May 8',
    archivedAt: 'May 10, 2025', archiveBox: 'BOX-2025-C3',
    status: 'Processed',
    aiSummary: 'City Planning Office zoning permit approved for commercial expansion at 450 Harbor Blvd. Permit valid through December 2026. Construction may commence after final inspection.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=city%20planning%20zoning%20permit%20approval%20document%20on%20white%20paper%20with%20municipal%20seal%20professional%20government%20correspondence%20scanned%20clean&width=160&height=110&seq=arch-thumb-5&orientation=landscape',
    starred: false, hasAttachment: false, tag: 'Inbox', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A006', serialNumber: 'SN-2025-00050',
    company: 'Solaris Partners', companyEmail: 'billing@solarispartners.com',
    sender: 'Chase Bank', subject: 'Loan Payoff Confirmation Letter',
    preview: 'Commercial loan #CL-2022-8821 fully paid off as of May 5, 2025. Lien released.',
    scannedAt: 'May 6, 2025', scannedDate: '2025-05-06', timeShort: 'May 6',
    archivedAt: 'May 7, 2025', archiveBox: 'BOX-2025-C3',
    status: 'Delivered',
    aiSummary: 'Chase Bank loan payoff confirmation for commercial loan #CL-2022-8821. Fully paid off as of May 5, 2025. Total paid: $1,240,000. Lien released. Certificate of satisfaction enclosed.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=bank%20loan%20payoff%20confirmation%20letter%20on%20white%20paper%20with%20chase%20bank%20letterhead%20professional%20financial%20correspondence%20scanned%20clean%20document&width=160&height=110&seq=arch-thumb-6&orientation=landscape',
    starred: true, hasAttachment: true, tag: 'Delivered', tagColor: 'bg-green-100 text-[#2F8F3A]',
  },
  {
    id: 'ML-A007', serialNumber: 'SN-2025-00051',
    company: 'Nexus Enterprises', companyEmail: 'legal@nexusenterprises.com',
    sender: 'USPTO – Patent Office', subject: 'Patent Grant Notice – #US11234567',
    preview: 'Patent #US11234567 granted for proprietary AI algorithm. Effective April 28, 2025.',
    scannedAt: 'Apr 30, 2025', scannedDate: '2025-04-30', timeShort: 'Apr 30',
    archivedAt: 'May 2, 2025', archiveBox: 'BOX-2025-D4',
    status: 'Processed',
    aiSummary: 'USPTO patent grant notice for patent #US11234567. Granted for proprietary AI algorithm. Effective April 28, 2025. Patent term: 20 years from filing date. Maintenance fees due annually.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=USPTO%20patent%20grant%20notice%20official%20document%20on%20white%20paper%20with%20government%20seal%20professional%20intellectual%20property%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-7&orientation=landscape',
    starred: false, hasAttachment: true, tag: 'Inbox', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A008', serialNumber: 'SN-2025-00052',
    company: 'Cascade Holdings', companyEmail: 'info@cascadeholdings.com',
    sender: 'Department of Commerce', subject: 'Export License Renewal – 2025',
    preview: 'Export license renewed for international trade operations. License valid Jan–Dec 2025.',
    scannedAt: 'Apr 25, 2025', scannedDate: '2025-04-25', timeShort: 'Apr 25',
    archivedAt: 'Apr 28, 2025', archiveBox: 'BOX-2025-D4',
    status: 'Processed',
    aiSummary: 'Department of Commerce export license renewal for international trade operations. License valid January through December 2025. Covers all approved product categories. No restrictions noted.',
    emailSent: true, thumbnail: 'https://readdy.ai/api/search-image?query=department%20of%20commerce%20export%20license%20renewal%20document%20on%20white%20paper%20with%20government%20letterhead%20professional%20trade%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-8&orientation=landscape',
    starred: false, hasAttachment: false, tag: 'Inbox', tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
];

const archivedChequesData: ArchivedCheque[] = [
  {
    id: 'CHQ-A001', serialNumber: 'SN-CHQ-2025-A01',
    company: 'Meridian Holdings', companyEmail: 'finance@meridianholdings.com',
    payee: 'Meridian Holdings', amount: '$42,500.00',
    bankName: 'Bank of America', chequeNumber: '004821',
    scannedAt: 'May 20, 2025', scannedDate: '2025-05-20', timeShort: 'May 20',
    archivedAt: 'May 22, 2025', archiveBox: 'BOX-2025-A1',
    status: 'Deposited',
    aiSummary: 'Bank of America cheque for $42,500.00 payable to Meridian Holdings. Cheque number 004821. Successfully deposited May 21, 2025. Transaction reference: TXN-2025-44821. Archived per company request.',
    thumbnail: 'https://readdy.ai/api/search-image?query=business%20cheque%20document%20on%20white%20background%20with%20bank%20of%20america%20details%20amount%20and%20signature%20lines%20professional%20financial%20instrument%20scanned%20clean%20archived&width=160&height=100&seq=arch-chq-thumb-1&orientation=landscape',
    starred: false, depositToggle: true,
  },
  {
    id: 'CHQ-A002', serialNumber: 'SN-CHQ-2025-A02',
    company: 'Pinnacle Corp', companyEmail: 'accounts@pinnaclecorp.com',
    payee: 'Pinnacle Corp', amount: '$18,750.00',
    bankName: 'Chase Bank', chequeNumber: '009134',
    scannedAt: 'May 18, 2025', scannedDate: '2025-05-18', timeShort: 'May 18',
    archivedAt: 'May 19, 2025', archiveBox: 'BOX-2025-A1',
    status: 'Rejected',
    aiSummary: 'Chase Bank cheque for $18,750.00 payable to Pinnacle Corp. Cheque number 009134. Rejected due to signature mismatch. Company notified via email. Archived for record keeping.',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20cheque%20financial%20document%20on%20white%20background%20with%20printed%20amount%20payee%20name%20and%20routing%20number%20professional%20scanned%20document%20archived%20rejected&width=160&height=100&seq=arch-chq-thumb-2&orientation=landscape',
    starred: true, depositToggle: false,
  },
  {
    id: 'CHQ-A003', serialNumber: 'SN-CHQ-2025-A03',
    company: 'Crestview LLC', companyEmail: 'ops@crestviewllc.com',
    payee: 'Crestview LLC', amount: '$9,200.00',
    bankName: 'Wells Fargo', chequeNumber: '002267',
    scannedAt: 'May 15, 2025', scannedDate: '2025-05-15', timeShort: 'May 15',
    archivedAt: 'May 16, 2025', archiveBox: 'BOX-2025-B2',
    status: 'Deposited',
    aiSummary: 'Wells Fargo cheque for $9,200.00 payable to Crestview LLC. Cheque number 002267. Deposited May 16, 2025. Transaction reference: TXN-2025-44655. Archived after successful processing.',
    thumbnail: 'https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20paper%20with%20wells%20fargo%20bank%20logo%20amount%20field%20and%20memo%20line%20professional%20financial%20instrument%20clean%20scan%20archived&width=160&height=100&seq=arch-chq-thumb-3&orientation=landscape',
    starred: false, depositToggle: true,
  },
  {
    id: 'CHQ-A004', serialNumber: 'SN-CHQ-2025-A04',
    company: 'Orion Dynamics', companyEmail: 'ceo@oriondynamics.com',
    payee: 'Orion Dynamics', amount: '$67,000.00',
    bankName: 'Citibank', chequeNumber: '007755',
    scannedAt: 'May 12, 2025', scannedDate: '2025-05-12', timeShort: 'May 12',
    archivedAt: 'May 14, 2025', archiveBox: 'BOX-2025-B2',
    status: 'On Hold',
    aiSummary: 'Citibank cheque for $67,000.00 payable to Orion Dynamics. Cheque number 007755. Placed on hold pending compliance review. Amount exceeds standard threshold. Archived pending resolution.',
    thumbnail: 'https://readdy.ai/api/search-image?query=citibank%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20payee%20professional%20financial%20document%20scanned%20archived%20on%20hold&width=160&height=100&seq=arch-chq-thumb-4&orientation=landscape',
    starred: true, depositToggle: false,
  },
  {
    id: 'CHQ-A005', serialNumber: 'SN-CHQ-2025-A05',
    company: 'Vantage Group', companyEmail: 'admin@vantagegroup.com',
    payee: 'Vantage Group', amount: '$31,400.00',
    bankName: 'TD Bank', chequeNumber: '003398',
    scannedAt: 'May 8, 2025', scannedDate: '2025-05-08', timeShort: 'May 8',
    archivedAt: 'May 10, 2025', archiveBox: 'BOX-2025-C3',
    status: 'Deposited',
    aiSummary: 'TD Bank cheque for $31,400.00 payable to Vantage Group. Cheque number 003398. Deposited May 9, 2025. Transaction reference: TXN-2025-44512. Funds cleared. Archived per standard procedure.',
    thumbnail: 'https://readdy.ai/api/search-image?query=td%20bank%20cheque%20document%20on%20white%20background%20with%20amount%20payee%20and%20date%20fields%20professional%20financial%20instrument%20scanned%20archived%20deposited&width=160&height=100&seq=arch-chq-thumb-5&orientation=landscape',
    starred: false, depositToggle: true,
  },
  {
    id: 'CHQ-A006', serialNumber: 'SN-CHQ-2025-A06',
    company: 'Nexus Enterprises', companyEmail: 'legal@nexusenterprises.com',
    payee: 'Nexus Enterprises', amount: '$55,800.00',
    bankName: 'US Bank', chequeNumber: '011042',
    scannedAt: 'Apr 30, 2025', scannedDate: '2025-04-30', timeShort: 'Apr 30',
    archivedAt: 'May 2, 2025', archiveBox: 'BOX-2025-D4',
    status: 'Deposited',
    aiSummary: 'US Bank cheque for $55,800.00 payable to Nexus Enterprises. Cheque number 011042. Deposited May 1, 2025. Transaction reference: TXN-2025-44790. Funds cleared successfully. Archived.',
    thumbnail: 'https://readdy.ai/api/search-image?query=us%20bank%20cheque%20document%20on%20white%20background%20with%20large%20value%20amount%20payee%20routing%20number%20professional%20financial%20instrument%20scanned%20archived&width=160&height=100&seq=arch-chq-thumb-6&orientation=landscape',
    starred: true, depositToggle: true,
  },
];

const mailStatusColors: Record<ArchivedMail['status'], string> = {
  'Processed': 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  'Delivered': 'bg-green-100 text-[#2F8F3A]',
  'Pending Delivery': 'bg-amber-100 text-amber-700',
};

const chequeStatusColors: Record<ArchivedCheque['status'], string> = {
  'Deposited': 'bg-green-100 text-[#2F8F3A]',
  'Rejected': 'bg-red-100 text-red-700',
  'On Hold': 'bg-slate-100 text-slate-600',
};

export default function AdminArchivedMailsPage() {
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'mails' | 'cheques'>('mails');

  // Mails state
  const [mailSearch, setMailSearch] = useState('');
  const [mailStatusFilter, setMailStatusFilter] = useState<string>('All');
  const [mailBoxFilter, setMailBoxFilter] = useState<string>('All');
  const [mailDateFrom, setMailDateFrom] = useState('');
  const [mailDateTo, setMailDateTo] = useState('');
  const [showMailDateFilter, setShowMailDateFilter] = useState(false);
  const [showMailBoxFilter, setShowMailBoxFilter] = useState(false);
  const [selectedMail, setSelectedMail] = useState<ArchivedMail | null>(null);
  const [mails, setMails] = useState<ArchivedMail[]>(archivedMailsData);
  const [mailCheckedIds, setMailCheckedIds] = useState<Set<string>>(new Set());
  const [mailAllChecked, setMailAllChecked] = useState(false);

  // Cheques state
  const [chequeSearch, setChequeSearch] = useState('');
  const [chequeStatusFilter, setChequeStatusFilter] = useState<string>('All');
  const [chequeBoxFilter, setChequeBoxFilter] = useState<string>('All');
  const [chequeDateFrom, setChequeDateFrom] = useState('');
  const [chequeDateTo, setChequeDateTo] = useState('');
  const [showChequeDateFilter, setShowChequeDateFilter] = useState(false);
  const [showChequeBoxFilter, setShowChequeBoxFilter] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<ArchivedCheque | null>(null);
  const [cheques, setCheques] = useState<ArchivedCheque[]>(archivedChequesData);
  const [chequeCheckedIds, setChequeCheckedIds] = useState<Set<string>>(new Set());
  const [chequeAllChecked, setChequeAllChecked] = useState(false);

  const uniqueMailBoxes = useMemo(
    () => [...new Set(mails.map((m) => m.archiveBox))],
    [mails]
  );
  const uniqueChequeBoxes = useMemo(
    () => [...new Set(cheques.map((c) => c.archiveBox))],
    [cheques]
  );
  const allUniqueBoxes = useMemo(
    () => [...new Set([...uniqueMailBoxes, ...uniqueChequeBoxes])],
    [uniqueMailBoxes, uniqueChequeBoxes]
  );

  // Filtered mails
  const filteredMails = mails.filter(m => {
    const matchSearch =
      m.company.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.sender.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.subject.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.archiveBox.toLowerCase().includes(mailSearch.toLowerCase());
    const matchStatus = mailStatusFilter === 'All' || m.status === mailStatusFilter;
    const matchBox = mailBoxFilter === 'All' || m.archiveBox === mailBoxFilter;
    const matchDateFrom = !mailDateFrom || m.scannedDate >= mailDateFrom;
    const matchDateTo = !mailDateTo || m.scannedDate <= mailDateTo;
    return matchSearch && matchStatus && matchBox && matchDateFrom && matchDateTo;
  });

  // Filtered cheques
  const filteredCheques = cheques.filter(c => {
    const matchSearch =
      c.company.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.payee.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.bankName.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.chequeNumber.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.serialNumber.toLowerCase().includes(chequeSearch.toLowerCase()) ||
      c.archiveBox.toLowerCase().includes(chequeSearch.toLowerCase());
    const matchStatus = chequeStatusFilter === 'All' || c.status === chequeStatusFilter;
    const matchBox = chequeBoxFilter === 'All' || c.archiveBox === chequeBoxFilter;
    const matchDateFrom = !chequeDateFrom || c.scannedDate >= chequeDateFrom;
    const matchDateTo = !chequeDateTo || c.scannedDate <= chequeDateTo;
    return matchSearch && matchStatus && matchBox && matchDateFrom && matchDateTo;
  });

  // Mail handlers
  const toggleMailCheck = (id: string) => {
    setMailCheckedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleMailAllCheck = () => {
    if (mailAllChecked) { setMailCheckedIds(new Set()); setMailAllChecked(false); }
    else { setMailCheckedIds(new Set(filteredMails.map(m => m.id))); setMailAllChecked(true); }
  };
  const handleUnarchiveMail = (id: string) => {
    setMails(prev => prev.filter(m => m.id !== id));
    setMailCheckedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };
  const handleUnarchiveSelectedMails = () => {
    setMails(prev => prev.filter(m => !mailCheckedIds.has(m.id)));
    setMailCheckedIds(new Set()); setMailAllChecked(false);
  };

  // Cheque handlers
  const toggleChequeCheck = (id: string) => {
    setChequeCheckedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleChequeAllCheck = () => {
    if (chequeAllChecked) { setChequeCheckedIds(new Set()); setChequeAllChecked(false); }
    else { setChequeCheckedIds(new Set(filteredCheques.map(c => c.id))); setChequeAllChecked(true); }
  };
  const handleUnarchiveCheque = (id: string) => {
    setCheques(prev => prev.filter(c => c.id !== id));
    setChequeCheckedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };
  const handleUnarchiveSelectedCheques = () => {
    setCheques(prev => prev.filter(c => !chequeCheckedIds.has(c.id)));
    setChequeCheckedIds(new Set()); setChequeAllChecked(false);
  };

  const mailBoxCounts = allUniqueBoxes.reduce<Record<string, number>>((acc, box) => {
    acc[box] = mails.filter(m => m.archiveBox === box).length;
    return acc;
  }, {});

  const chequeBoxCounts = allUniqueBoxes.reduce<Record<string, number>>((acc, box) => {
    acc[box] = cheques.filter(c => c.archiveBox === box).length;
    return acc;
  }, {});

  return (
    <>
      <div className="min-h-full flex flex-col min-w-0 bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="relative flex-1 max-w-xl min-w-0">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
                <input
                  type="text"
                  placeholder="Search by serial number, box, cheque no., company..."
                  value={activeTab === 'mails' ? mailSearch : chequeSearch}
                  onChange={e => activeTab === 'mails' ? setMailSearch(e.target.value) : setChequeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-0 outline-none text-sm text-slate-800 placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-notification-3-line text-slate-600 text-xl"></i>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Notifications</span>
                      <span className="text-xs text-[#0A3D8F] cursor-pointer">Mark all read</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <p className="text-xs text-slate-700">2 mails moved to archive box BOX-2025-A1</p>
                        <p className="text-[11px] text-slate-400 mt-1">2 min ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <p className="text-xs text-slate-700">1 cheque unarchived and returned to processing queue</p>
                        <p className="text-[11px] text-slate-400 mt-1">10 min ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative pl-3 border-l border-slate-200">
                <button
                  onClick={() => {
                    setShowUserMenu((prev) => !prev);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0A3D8F] to-[#083170] rounded-full flex items-center justify-center text-white font-semibold text-xs overflow-hidden flex-shrink-0">
                    {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-slate-900 leading-none">{displayName}</p>
                    <p className="text-xs text-slate-500 uppercase">{displayRole}</p>
                  </div>
                  <i className="ri-arrow-down-s-line text-slate-400 text-base hidden lg:block"></i>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-[180px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                    <Link href="/admin/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <div className="w-4 h-4 flex items-center justify-center"><i className="ri-user-line text-sm"></i></div>
                      My Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-4 h-4 flex items-center justify-center"><i className="ri-settings-3-line text-sm"></i></div>
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                      <div className="w-4 h-4 flex items-center justify-center"><i className="ri-logout-box-r-line text-sm"></i></div>
                      Sign Out
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Title Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                <i className="ri-archive-line text-slate-600 text-lg"></i>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Archived Mails &amp; Cheques</h1>
                <p className="text-xs text-slate-500">{mails.length} mails · {cheques.length} cheques across {allUniqueBoxes.length} archive boxes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {allUniqueBoxes.slice(0, 3).map(box => (
                <span key={box} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                  {box}: {(mailBoxCounts[box] || 0) + (chequeBoxCounts[box] || 0)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Archive boxes</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMailBoxFilter('All');
                setChequeBoxFilter('All');
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mailBoxFilter === 'All' && chequeBoxFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <i className="ri-archive-drawer-line"></i>
              All boxes
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-inherit">{mails.length + cheques.length}</span>
            </button>
            {allUniqueBoxes.map((box) => (
              <button
                type="button"
                key={box}
                onClick={() => {
                  setMailBoxFilter(box);
                  setChequeBoxFilter(box);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  mailBoxFilter === box && chequeBoxFilter === box
                    ? 'border-[#0A3D8F] bg-[#0A3D8F]/10 text-[#0A3D8F]'
                    : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="ri-inbox-archive-line text-slate-400"></i>
                {box}
                <span className="text-slate-400">{(mailBoxCounts[box] || 0) + (chequeBoxCounts[box] || 0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mails / Cheques Toggle */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 overflow-x-auto">
          <div className="flex items-center space-x-1 bg-slate-100 rounded-full p-1 w-max min-w-full sm:min-w-0 sm:w-fit">
            <button
              onClick={() => {
                setActiveTab('mails');
                setMailSearch('');
              }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'mails' ? 'bg-white text-[#0A3D8F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="ri-mail-line text-base"></i>
              <span>Archived Mails</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === 'mails' ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-200 text-slate-500'}`}>
                {mails.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('cheques');
                setChequeSearch('');
              }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'cheques' ? 'bg-white text-[#0A3D8F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="ri-bank-card-line text-base"></i>
              <span>Archived Cheques</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === 'cheques' ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-200 text-slate-500'}`}>
                {cheques.length}
              </span>
            </button>
          </div>
        </div>

        {/* ===== MAILS TAB ===== */}
        {activeTab === 'mails' && (
          <>
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <input type="checkbox" checked={mailAllChecked} onChange={toggleMailAllCheck} className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer" />
                  <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer">
                    <i className="ri-arrow-down-s-line text-slate-500 text-sm"></i>
                  </button>
                </div>
                {mailCheckedIds.size > 0 && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button onClick={handleUnarchiveSelectedMails} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                      <i className="ri-inbox-unarchive-line text-slate-600 text-base"></i>
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Unarchive</span>
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Delete">
                      <i className="ri-delete-bin-line text-slate-500 text-base"></i>
                    </button>
                    <span className="text-xs text-slate-500 ml-1">{mailCheckedIds.size} selected</span>
                  </div>
                )}
                <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
                  <i className="ri-refresh-line text-slate-500 text-base"></i>
                </button>

                {/* Box Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowMailBoxFilter(!showMailBoxFilter)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-medium whitespace-nowrap ${mailBoxFilter !== 'All' ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <i className="ri-archive-drawer-line text-sm"></i>
                    <span>{mailBoxFilter !== 'All' ? mailBoxFilter : 'Filter by box'}</span>
                    {mailBoxFilter !== 'All' && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); setMailBoxFilter('All'); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setMailBoxFilter('All');
                          }
                        }}
                        className="ml-1 hover:text-red-500 cursor-pointer"
                        aria-label="Clear mail box filter"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </span>
                    )}
                  </button>
                  {showMailBoxFilter && (
                    <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl p-2 z-40 w-48">
                      <button onClick={() => { setMailBoxFilter('All'); setShowMailBoxFilter(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer ${mailBoxFilter === 'All' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>All Boxes</button>
                      {uniqueMailBoxes.map(box => (
                        <button key={box} onClick={() => { setMailBoxFilter(box); setShowMailBoxFilter(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${mailBoxFilter === box ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                          <span>{box}</span>
                          <span className="text-xs text-slate-400">{mailBoxCounts[box]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowMailDateFilter(!showMailDateFilter)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-medium whitespace-nowrap ${(mailDateFrom || mailDateTo) ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <i className="ri-calendar-line text-sm"></i>
                    <span>{(mailDateFrom || mailDateTo) ? 'Date filtered' : 'Filter by date'}</span>
                    {(mailDateFrom || mailDateTo) && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); setMailDateFrom(''); setMailDateTo(''); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setMailDateFrom('');
                            setMailDateTo('');
                          }
                        }}
                        className="ml-1 hover:text-red-500 cursor-pointer"
                        aria-label="Clear mail date filter"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </span>
                    )}
                  </button>
                  {showMailDateFilter && (
                    <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl p-4 z-40 w-64">
                      <p className="text-xs font-semibold text-slate-700 mb-3">Filter by Scan Date</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">From</label>
                          <input type="date" value={mailDateFrom} onChange={e => setMailDateFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A3D8F] cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">To</label>
                          <input type="date" value={mailDateTo} onChange={e => setMailDateTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A3D8F] cursor-pointer" />
                        </div>
                        <div className="flex space-x-2 pt-1">
                          <button onClick={() => { setMailDateFrom(''); setMailDateTo(''); }} className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap">Clear</button>
                          <button onClick={() => setShowMailDateFilter(false)} className="flex-1 py-2 text-xs font-medium text-white bg-[#0A3D8F] hover:bg-[#083170] rounded-lg cursor-pointer whitespace-nowrap">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500">{filteredMails.length} of {mails.length} mails</span>
            </div>

            {/* Mail Status Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto">
              {['All', 'Processed', 'Delivered', 'Pending Delivery'].map(tab => (
                <button key={tab} onClick={() => setMailStatusFilter(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${mailStatusFilter === tab ? 'border-[#0A3D8F] text-[#0A3D8F]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {tab}
                  {tab !== 'All' && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${mailStatusFilter === tab ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-500'}`}>
                      {mails.filter(m => m.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Mail List */}
            <main className="flex-1 overflow-auto bg-white">
              {filteredMails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <i className="ri-archive-line text-slate-400 text-3xl"></i>
                  </div>
                  <p className="text-slate-500 font-medium">No archived mails found</p>
                  <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="min-w-[980px] divide-y divide-slate-100">
                  {filteredMails.map(mail => (
                    <div key={mail.id} className="flex items-center group px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedMail(mail)}>
                      <div className="flex items-center space-x-2 mr-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={mailCheckedIds.has(mail.id)} onChange={() => toggleMailCheck(mail.id)} className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer" />
                      </div>
                      <div className="mr-2 flex-shrink-0"><i className="ri-archive-line text-slate-300 text-lg"></i></div>
                      <div className="mr-3 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium whitespace-nowrap">{mail.archiveBox}</span>
                      </div>
                      <div className="w-40 flex-shrink-0 mr-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{mail.sender.charAt(0)}</div>
                          <span className="text-sm truncate font-medium text-slate-600">{mail.sender}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center space-x-2 mr-4">
                        {mail.tag && (
                          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${mail.tagColor ?? 'bg-slate-100 text-slate-600'}`}>
                            {mail.tag}
                          </span>
                        )}
                        <span className="text-sm truncate text-slate-700">{mail.subject}</span>
                        <span className="text-sm text-slate-400 truncate hidden xl:block">– {mail.preview}</span>
                      </div>
                      <div className="w-32 flex-shrink-0 mr-4 hidden lg:block">
                        <span className="text-xs text-slate-400 font-mono">{mail.serialNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
                        {mail.hasAttachment && <i className="ri-attachment-2 text-slate-400 text-base"></i>}
                      </div>
                      <div className="mr-3 flex-shrink-0" onClick={e => { e.stopPropagation(); handleUnarchiveMail(mail.id); }}>
                        <button className="text-xs text-slate-500 hover:text-[#0A3D8F] px-2 py-1 rounded hover:bg-[#0A3D8F]/10 transition-colors cursor-pointer whitespace-nowrap">Unarchive</button>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-slate-400">{mail.timeShort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {/* ===== CHEQUES TAB ===== */}
        {activeTab === 'cheques' && (
          <>
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <input type="checkbox" checked={chequeAllChecked} onChange={toggleChequeAllCheck} className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer" />
                  <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer">
                    <i className="ri-arrow-down-s-line text-slate-500 text-sm"></i>
                  </button>
                </div>
                {chequeCheckedIds.size > 0 && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button onClick={handleUnarchiveSelectedCheques} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                      <i className="ri-inbox-unarchive-line text-slate-600 text-base"></i>
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Unarchive</span>
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Delete">
                      <i className="ri-delete-bin-line text-slate-500 text-base"></i>
                    </button>
                    <span className="text-xs text-slate-500 ml-1">{chequeCheckedIds.size} selected</span>
                  </div>
                )}
                <button className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
                  <i className="ri-refresh-line text-slate-500 text-base"></i>
                </button>

                {/* Box Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowChequeBoxFilter(!showChequeBoxFilter)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-medium whitespace-nowrap ${chequeBoxFilter !== 'All' ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <i className="ri-archive-drawer-line text-sm"></i>
                    <span>{chequeBoxFilter !== 'All' ? chequeBoxFilter : 'Filter by box'}</span>
                    {chequeBoxFilter !== 'All' && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); setChequeBoxFilter('All'); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setChequeBoxFilter('All');
                          }
                        }}
                        className="ml-1 hover:text-red-500 cursor-pointer"
                        aria-label="Clear cheque box filter"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </span>
                    )}
                  </button>
                  {showChequeBoxFilter && (
                    <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl p-2 z-40 w-48">
                      <button onClick={() => { setChequeBoxFilter('All'); setShowChequeBoxFilter(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer ${chequeBoxFilter === 'All' ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>All Boxes</button>
                      {uniqueChequeBoxes.map(box => (
                        <button key={box} onClick={() => { setChequeBoxFilter(box); setShowChequeBoxFilter(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${chequeBoxFilter === box ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                          <span>{box}</span>
                          <span className="text-xs text-slate-400">{chequeBoxCounts[box]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowChequeDateFilter(!showChequeDateFilter)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-medium whitespace-nowrap ${(chequeDateFrom || chequeDateTo) ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <i className="ri-calendar-line text-sm"></i>
                    <span>{(chequeDateFrom || chequeDateTo) ? 'Date filtered' : 'Filter by date'}</span>
                    {(chequeDateFrom || chequeDateTo) && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); setChequeDateFrom(''); setChequeDateTo(''); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setChequeDateFrom('');
                            setChequeDateTo('');
                          }
                        }}
                        className="ml-1 hover:text-red-500 cursor-pointer"
                        aria-label="Clear cheque date filter"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </span>
                    )}
                  </button>
                  {showChequeDateFilter && (
                    <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl p-4 z-40 w-64">
                      <p className="text-xs font-semibold text-slate-700 mb-3">Filter by Scan Date</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">From</label>
                          <input type="date" value={chequeDateFrom} onChange={e => setChequeDateFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A3D8F] cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">To</label>
                          <input type="date" value={chequeDateTo} onChange={e => setChequeDateTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A3D8F] cursor-pointer" />
                        </div>
                        <div className="flex space-x-2 pt-1">
                          <button onClick={() => { setChequeDateFrom(''); setChequeDateTo(''); }} className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap">Clear</button>
                          <button onClick={() => setShowChequeDateFilter(false)} className="flex-1 py-2 text-xs font-medium text-white bg-[#0A3D8F] hover:bg-[#083170] rounded-lg cursor-pointer whitespace-nowrap">Apply</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500">{filteredCheques.length} of {cheques.length} cheques</span>
            </div>

            {/* Cheque Status Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto">
              {['All', 'Deposited', 'Rejected', 'On Hold'].map(tab => (
                <button key={tab} onClick={() => setChequeStatusFilter(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${chequeStatusFilter === tab ? 'border-[#0A3D8F] text-[#0A3D8F]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {tab}
                  {tab !== 'All' && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${chequeStatusFilter === tab ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]' : 'bg-slate-100 text-slate-500'}`}>
                      {cheques.filter(c => c.status === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Cheque List */}
            <main className="flex-1 overflow-auto bg-white">
              {filteredCheques.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <i className="ri-bank-card-line text-slate-400 text-3xl"></i>
                  </div>
                  <p className="text-slate-500 font-medium">No archived cheques found</p>
                  <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="min-w-[1080px] divide-y divide-slate-100">
                  {filteredCheques.map(cheque => (
                    <div key={cheque.id} className="flex items-center group px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedCheque(cheque)}>
                      <div className="flex items-center space-x-2 mr-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={chequeCheckedIds.has(cheque.id)} onChange={() => toggleChequeCheck(cheque.id)} className="w-4 h-4 rounded border-slate-300 accent-[#0A3D8F] cursor-pointer" />
                      </div>
                      <div className="mr-2 flex-shrink-0"><i className="ri-bank-card-line text-slate-300 text-lg"></i></div>
                      <div className="mr-3 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium whitespace-nowrap">{cheque.archiveBox}</span>
                      </div>
                      <div className="w-44 flex-shrink-0 mr-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{cheque.company.charAt(0)}</div>
                          <span className="text-sm truncate font-medium text-slate-600">{cheque.company}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center space-x-2 mr-4">
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${chequeStatusColors[cheque.status]}`}>{cheque.status}</span>
                        <span className="text-sm truncate text-slate-700">{cheque.bankName} – #{cheque.chequeNumber}</span>
                        <span className="text-sm text-slate-400 truncate hidden xl:block">– {cheque.aiSummary.substring(0, 50)}...</span>
                      </div>
                      <div className="w-36 flex-shrink-0 mr-4 hidden lg:block">
                        <span className="text-xs text-slate-400 font-mono">{cheque.serialNumber}</span>
                      </div>
                      <div className="flex items-center mr-4 flex-shrink-0">
                        <span className="text-sm font-bold text-slate-600">{cheque.amount}</span>
                      </div>
                      <div className="mr-3 flex-shrink-0" onClick={e => { e.stopPropagation(); handleUnarchiveCheque(cheque.id); }}>
                        <button className="text-xs text-slate-500 hover:text-[#0A3D8F] px-2 py-1 rounded hover:bg-[#0A3D8F]/10 transition-colors cursor-pointer whitespace-nowrap">Unarchive</button>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-slate-400">{cheque.timeShort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Mail Detail Modal */}
      {selectedMail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setSelectedMail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <i className="ri-archive-line text-slate-600 text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedMail.subject}</h2>
                  <p className="text-xs text-slate-500">{selectedMail.id} · {selectedMail.serialNumber} · Archived to {selectedMail.archiveBox}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMail(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200">
                <img src={selectedMail.thumbnail} alt="Mail document" className="w-full h-full object-cover object-top" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Recipient Company</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{selectedMail.company.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedMail.company}</p>
                      <p className="text-xs text-slate-500">{selectedMail.companyEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Sender</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedMail.sender}</p>
                  <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${mailStatusColors[selectedMail.status]}`}>{selectedMail.status}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Archive Box</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedMail.archiveBox}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Archived: {selectedMail.archivedAt}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Scanned</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedMail.scannedAt}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedMail.serialNumber}</p>
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
              <div className="flex items-center space-x-3 pt-1">
                <button onClick={() => { handleUnarchiveMail(selectedMail.id); setSelectedMail(null); }} className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm whitespace-nowrap cursor-pointer">
                  <i className="ri-inbox-unarchive-line mr-2"></i>Unarchive
                </button>
                <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer">
                  <i className="ri-download-line mr-2"></i>Download
                </button>
                <button onClick={() => setSelectedMail(null)} className="px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Detail Modal */}
      {selectedCheque && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setSelectedCheque(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
                  <i className="ri-bank-card-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedCheque.bankName} Cheque</h2>
                  <p className="text-xs text-slate-500">{selectedCheque.id} · {selectedCheque.serialNumber} · #{selectedCheque.chequeNumber} · Archived to {selectedCheque.archiveBox}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCheque(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200">
                <img src={selectedCheque.thumbnail} alt="Cheque document" className="w-full h-full object-cover object-top" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Recipient Company</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-[#0A3D8F] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{selectedCheque.company.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedCheque.company}</p>
                      <p className="text-xs text-slate-500">{selectedCheque.companyEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Cheque Amount</p>
                  <p className="text-2xl font-bold text-[#0A3D8F]">{selectedCheque.amount}</p>
                  <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${chequeStatusColors[selectedCheque.status]}`}>{selectedCheque.status}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Issuing Bank</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCheque.bankName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cheque No. #{selectedCheque.chequeNumber}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Archive Box</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCheque.archiveBox}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Archived: {selectedCheque.archivedAt}</p>
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
              <div className="flex items-center space-x-3 pt-1">
                <button onClick={() => { handleUnarchiveCheque(selectedCheque.id); setSelectedCheque(null); }} className="flex-1 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm whitespace-nowrap cursor-pointer">
                  <i className="ri-inbox-unarchive-line mr-2"></i>Unarchive
                </button>
                <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer">
                  <i className="ri-download-line mr-2"></i>Download
                </button>
                <button onClick={() => setSelectedCheque(null)} className="px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
