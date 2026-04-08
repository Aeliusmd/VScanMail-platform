export interface ArchivedMail {
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

export interface ArchivedCheque {
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

export const archivedMailsData: ArchivedMail[] = [
  {
    id: 'ML-A001',
    serialNumber: 'SN-2025-00045',
    company: 'Meridian Holdings',
    companyEmail: 'legal@meridianholdings.com',
    sender: 'IRS Department',
    subject: 'Tax Audit Notice - FY 2023',
    preview: 'IRS audit notice for fiscal year 2023. All records have been reviewed and archived.',
    scannedAt: 'May 20, 2025',
    scannedDate: '2025-05-20',
    timeShort: 'May 20',
    archivedAt: 'May 22, 2025',
    archiveBox: 'BOX-2025-A1',
    status: 'Processed',
    aiSummary: 'IRS audit notice for fiscal year 2023. All financial records reviewed. No discrepancies found. Case closed. Archived per company request.',
    emailSent: true,
    thumbnail: 'https://readdy.ai/api/search-image?query=official%20IRS%20tax%20audit%20notice%20document%20on%20white%20paper%20with%20government%20letterhead%20formal%20correspondence%20archived%20scanned%20professional&width=160&height=110&seq=arch-thumb-1&orientation=landscape',
    starred: false,
    hasAttachment: true,
    tag: 'Inbox',
    tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A002',
    serialNumber: 'SN-2025-00046',
    company: 'Pinnacle Corp',
    companyEmail: 'finance@pinnaclecorp.com',
    sender: 'Wells Fargo Bank',
    subject: 'Annual Account Summary - 2024',
    preview: 'Annual account summary for 2024. Total transactions: 1,240. Net balance: $892,400.',
    scannedAt: 'May 18, 2025',
    scannedDate: '2025-05-18',
    timeShort: 'May 18',
    archivedAt: 'May 19, 2025',
    archiveBox: 'BOX-2025-A1',
    status: 'Delivered',
    aiSummary: 'Annual account summary from Wells Fargo for 2024. Total transactions: 1,240. Net balance: $892,400. No suspicious activity. Delivered to client and archived.',
    emailSent: true,
    thumbnail: 'https://readdy.ai/api/search-image?query=annual%20bank%20account%20summary%20financial%20document%20on%20white%20background%20with%20tables%20and%20balance%20figures%20professional%20banking%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-2&orientation=landscape',
    starred: true,
    hasAttachment: false,
    tag: 'Delivered',
    tagColor: 'bg-green-100 text-[#2F8F3A]',
  },
  {
    id: 'ML-A003',
    serialNumber: 'SN-2025-00047',
    company: 'Crestview LLC',
    companyEmail: 'ops@crestviewllc.com',
    sender: 'State Labor Board',
    subject: 'Compliance Certificate - Q4 2024',
    preview: 'Labor compliance certificate for Q4 2024. All requirements met. Certificate valid through Dec 2025.',
    scannedAt: 'May 15, 2025',
    scannedDate: '2025-05-15',
    timeShort: 'May 15',
    archivedAt: 'May 16, 2025',
    archiveBox: 'BOX-2025-B2',
    status: 'Processed',
    aiSummary: 'State Labor Board compliance certificate for Q4 2024. All labor requirements met. Certificate valid through December 2025. No violations recorded.',
    emailSent: true,
    thumbnail: 'https://readdy.ai/api/search-image?query=state%20labor%20board%20compliance%20certificate%20official%20document%20on%20white%20paper%20with%20seal%20and%20signature%20professional%20government%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-3&orientation=landscape',
    starred: false,
    hasAttachment: false,
    tag: 'Inbox',
    tagColor: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  },
  {
    id: 'ML-A004',
    serialNumber: 'SN-2025-00048',
    company: 'Orion Dynamics',
    companyEmail: 'ceo@oriondynamics.com',
    sender: 'SEC - Enforcement Division',
    subject: 'Quarterly Filing Confirmation',
    preview: 'SEC confirmation of quarterly filing receipt. Form 10-Q accepted. No further action required.',
    scannedAt: 'May 12, 2025',
    scannedDate: '2025-05-12',
    timeShort: 'May 12',
    archivedAt: 'May 14, 2025',
    archiveBox: 'BOX-2025-B2',
    status: 'Delivered',
    aiSummary: 'SEC confirmation of quarterly filing receipt. Form 10-Q accepted without issues. Filing timestamp: May 12, 2025 at 3:42 PM EST. No further action required.',
    emailSent: true,
    thumbnail: 'https://readdy.ai/api/search-image?query=SEC%20securities%20exchange%20commission%20quarterly%20filing%20confirmation%20document%20on%20white%20paper%20with%20official%20seal%20professional%20regulatory%20correspondence%20scanned&width=160&height=110&seq=arch-thumb-4&orientation=landscape',
    starred: true,
    hasAttachment: true,
    tag: 'Delivered',
    tagColor: 'bg-green-100 text-[#2F8F3A]',
  },
];

export const archivedChequesData: ArchivedCheque[] = [
  {
    id: 'CHQ-A001',
    serialNumber: 'SN-CHQ-2025-A01',
    company: 'Meridian Holdings',
    companyEmail: 'finance@meridianholdings.com',
    payee: 'Meridian Holdings',
    amount: '$42,500.00',
    bankName: 'Bank of America',
    chequeNumber: '004821',
    scannedAt: 'May 20, 2025',
    scannedDate: '2025-05-20',
    timeShort: 'May 20',
    archivedAt: 'May 22, 2025',
    archiveBox: 'BOX-2025-A1',
    status: 'Deposited',
    aiSummary: 'Bank of America cheque for $42,500.00 payable to Meridian Holdings. Cheque number 004821. Successfully deposited May 21, 2025. Transaction reference: TXN-2025-44821. Archived per company request.',
    thumbnail: 'https://readdy.ai/api/search-image?query=business%20cheque%20document%20on%20white%20background%20with%20bank%20of%20america%20details%20amount%20and%20signature%20lines%20professional%20financial%20instrument%20scanned%20clean%20archived&width=160&height=100&seq=arch-chq-thumb-1&orientation=landscape',
    starred: false,
    depositToggle: true,
  },
  {
    id: 'CHQ-A002',
    serialNumber: 'SN-CHQ-2025-A02',
    company: 'Pinnacle Corp',
    companyEmail: 'accounts@pinnaclecorp.com',
    payee: 'Pinnacle Corp',
    amount: '$18,750.00',
    bankName: 'Chase Bank',
    chequeNumber: '009134',
    scannedAt: 'May 18, 2025',
    scannedDate: '2025-05-18',
    timeShort: 'May 18',
    archivedAt: 'May 19, 2025',
    archiveBox: 'BOX-2025-A1',
    status: 'Rejected',
    aiSummary: 'Chase Bank cheque for $18,750.00 payable to Pinnacle Corp. Cheque number 009134. Rejected due to signature mismatch. Company notified via email. Archived for record keeping.',
    thumbnail: 'https://readdy.ai/api/search-image?query=bank%20cheque%20financial%20document%20on%20white%20background%20with%20printed%20amount%20payee%20name%20and%20routing%20number%20professional%20scanned%20document%20archived%20rejected&width=160&height=100&seq=arch-chq-thumb-2&orientation=landscape',
    starred: true,
    depositToggle: false,
  },
  {
    id: 'CHQ-A003',
    serialNumber: 'SN-CHQ-2025-A03',
    company: 'Crestview LLC',
    companyEmail: 'ops@crestviewllc.com',
    payee: 'Crestview LLC',
    amount: '$9,200.00',
    bankName: 'Wells Fargo',
    chequeNumber: '002267',
    scannedAt: 'May 15, 2025',
    scannedDate: '2025-05-15',
    timeShort: 'May 15',
    archivedAt: 'May 16, 2025',
    archiveBox: 'BOX-2025-B2',
    status: 'Deposited',
    aiSummary: 'Wells Fargo cheque for $9,200.00 payable to Crestview LLC. Cheque number 002267. Deposited May 16, 2025. Transaction reference: TXN-2025-44655. Archived after successful processing.',
    thumbnail: 'https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20paper%20with%20wells%20fargo%20bank%20logo%20amount%20field%20and%20memo%20line%20professional%20financial%20instrument%20clean%20scan%20archived&width=160&height=100&seq=arch-chq-thumb-3&orientation=landscape',
    starred: false,
    depositToggle: true,
  },
  {
    id: 'CHQ-A004',
    serialNumber: 'SN-CHQ-2025-A04',
    company: 'Orion Dynamics',
    companyEmail: 'ceo@oriondynamics.com',
    payee: 'Orion Dynamics',
    amount: '$67,000.00',
    bankName: 'Citibank',
    chequeNumber: '007755',
    scannedAt: 'May 12, 2025',
    scannedDate: '2025-05-12',
    timeShort: 'May 12',
    archivedAt: 'May 14, 2025',
    archiveBox: 'BOX-2025-B2',
    status: 'On Hold',
    aiSummary: 'Citibank cheque for $67,000.00 payable to Orion Dynamics. Cheque number 007755. Placed on hold pending compliance review. Amount exceeds standard threshold. Archived pending resolution.',
    thumbnail: 'https://readdy.ai/api/search-image?query=citibank%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20payee%20professional%20financial%20document%20scanned%20archived%20on%20hold&width=160&height=100&seq=arch-chq-thumb-4&orientation=landscape',
    starred: true,
    depositToggle: false,
  },
];

export const mailStatusColors: Record<ArchivedMail['status'], string> = {
  Processed: 'bg-[#0A3D8F]/10 text-[#0A3D8F]',
  Delivered: 'bg-green-100 text-[#2F8F3A]',
  'Pending Delivery': 'bg-amber-100 text-amber-700',
};

export const chequeStatusColors: Record<ArchivedCheque['status'], string> = {
  Deposited: 'bg-green-100 text-[#2F8F3A]',
  Rejected: 'bg-red-100 text-red-700',
  'On Hold': 'bg-slate-100 text-slate-600',
};

export const uniqueArchiveBoxes = [...new Set([...archivedMailsData, ...archivedChequesData].map((item) => item.archiveBox))];
