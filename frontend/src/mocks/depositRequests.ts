export interface DepositRequest {
  id: string;
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
}

export const initialDepositRequests: DepositRequest[] = [
  {
    id: 'DEP-001',
    company: 'Tech Solutions Inc',
    companyEmail: 'finance@techsolutions.com',
    bankName: 'Bank of America',
    chequeNumber: '004821',
    amount: '$12,500.00',
    requestedAt: 'Today, 11:05 AM',
    timeShort: '11:05 AM',
    status: 'Pending',
    emailSent: true,
    aiSummary:
      'Deposit request for Bank of America cheque #004821 for $12,500.00. Requested by Tech Solutions Inc. All verification checks passed. Signature verified. No alterations detected. Ready for approval.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=business%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20and%20signature%20lines%20professional%20financial%20instrument%20scanned%20clean&width=160&height=100&seq=dep-thumb-1&orientation=landscape',
    starred: true,
    read: false,
    tag: 'Urgent',
    tagColor: 'bg-red-100 text-red-700',
    requestedBy: 'John Smith',
    notes: 'Client requested expedited processing',
  },
  {
    id: 'DEP-002',
    company: 'Global Enterprises',
    companyEmail: 'accounts@globalenterprises.com',
    bankName: 'Chase Bank',
    chequeNumber: '009134',
    amount: '$47,200.00',
    requestedAt: 'Today, 09:48 AM',
    timeShort: '9:48 AM',
    status: 'Approved',
    emailSent: true,
    aiSummary:
      'Deposit request approved for Chase Bank cheque #009134 for $47,200.00. Processed by admin team. Transaction reference: TXN-2025-44821. Funds will be available within 2-3 business days.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=bank%20cheque%20financial%20document%20on%20white%20background%20with%20printed%20amount%20payee%20name%20and%20routing%20number%20professional%20scanned%20document&width=160&height=100&seq=dep-thumb-2&orientation=landscape',
    starred: false,
    read: false,
    tag: 'Approved',
    tagColor: 'bg-green-100 text-[#2F8F3A]',
    requestedBy: 'Sarah Johnson',
    depositDate: '2026/03/25',
  },
  {
    id: 'DEP-003',
    company: 'Innovate Corp',
    companyEmail: 'legal@innovatecorp.com',
    bankName: 'Wells Fargo',
    chequeNumber: '002267',
    amount: '$8,750.00',
    requestedAt: 'Yesterday, 3:30 PM',
    timeShort: 'Yesterday',
    status: 'Pending',
    emailSent: true,
    aiSummary:
      'Deposit request for Wells Fargo cheque #002267 for $8,750.00. Awaiting admin approval. All security checks completed successfully. No issues detected during verification.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20paper%20with%20bank%20logo%20amount%20field%20and%20memo%20line%20professional%20financial%20instrument%20clean%20scan&width=160&height=100&seq=dep-thumb-3&orientation=landscape',
    starred: true,
    read: true,
    tag: 'Pending',
    tagColor: 'bg-amber-100 text-amber-700',
    requestedBy: 'Michael Chen',
  },
  {
    id: 'DEP-004',
    company: 'Prime Industries',
    companyEmail: 'ops@primeindustries.com',
    bankName: 'Citibank',
    chequeNumber: '007755',
    amount: '$3,300.00',
    requestedAt: 'Yesterday, 1:15 PM',
    timeShort: 'Yesterday',
    status: 'Rejected',
    emailSent: true,
    aiSummary:
      'Deposit request rejected for Citibank cheque #007755 for $3,300.00. Reason: Signature mismatch detected during verification. Company has been notified via email. Resubmission required with corrected documentation.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=rejected%20cheque%20document%20on%20white%20background%20with%20bank%20details%20and%20amount%20professional%20financial%20document%20scanned%20with%20visible%20details&width=160&height=100&seq=dep-thumb-4&orientation=landscape',
    starred: false,
    read: true,
    tag: 'Rejected',
    tagColor: 'bg-red-100 text-red-700',
    requestedBy: 'Emily Davis',
    notes: 'Signature verification failed',
  },
  {
    id: 'DEP-005',
    company: 'Summit LLC',
    companyEmail: 'admin@summitllc.com',
    bankName: 'TD Bank',
    chequeNumber: '003398',
    amount: '$21,000.00',
    requestedAt: 'Yesterday, 10:00 AM',
    timeShort: 'Yesterday',
    status: 'Pending',
    emailSent: false,
    aiSummary:
      'Deposit request for TD Bank cheque #003398 for $21,000.00. Amount exceeds standard threshold. Manual review required. Additional verification in progress.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=business%20cheque%20on%20hold%20document%20white%20background%20with%20bank%20name%20amount%20and%20date%20fields%20professional%20financial%20instrument%20scanned&width=160&height=100&seq=dep-thumb-5&orientation=landscape',
    starred: false,
    read: true,
    tag: 'Review',
    tagColor: 'bg-slate-100 text-slate-600',
    requestedBy: 'David Wilson',
    notes: 'High value transaction - requires manager approval',
  },
  {
    id: 'DEP-006',
    company: 'Apex Ventures',
    companyEmail: 'finance@apexventures.com',
    bankName: 'US Bank',
    chequeNumber: '011042',
    amount: '$65,000.00',
    requestedAt: 'Jun 11, 4:20 PM',
    timeShort: 'Jun 11',
    status: 'Deposited',
    emailSent: true,
    aiSummary:
      'Deposit request approved for US Bank cheque #011042 for $65,000.00. Transaction reference: TXN-2025-44790. Funds cleared and deposited successfully. Company notified.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=large%20value%20cheque%20document%20on%20white%20background%20with%20bank%20details%20amount%20payee%20and%20date%20professional%20financial%20instrument%20scanned%20clean&width=160&height=100&seq=dep-thumb-6&orientation=landscape',
    starred: true,
    read: true,
    tag: 'Deposited',
    tagColor: 'bg-teal-100 text-teal-700',
    requestedBy: 'Lisa Anderson',
    depositDate: '2026/03/20',
  },
  {
    id: 'DEP-007',
    company: 'Horizon Group',
    companyEmail: 'info@horizongroup.com',
    bankName: 'PNC Bank',
    chequeNumber: '005613',
    amount: '$9,850.00',
    requestedAt: 'Jun 11, 11:45 AM',
    timeShort: 'Jun 11',
    status: 'Pending',
    emailSent: true,
    aiSummary:
      'Deposit request for PNC Bank cheque #005613 for $9,850.00. Submitted by Horizon Group. Awaiting processing by banking team. All fields verified and signature confirmed.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=cheque%20document%20on%20white%20paper%20with%20pnc%20bank%20details%20amount%20and%20payee%20name%20professional%20financial%20instrument%20scanned%20document&width=160&height=100&seq=dep-thumb-7&orientation=landscape',
    starred: false,
    read: true,
    tag: 'Pending',
    tagColor: 'bg-amber-100 text-amber-700',
    requestedBy: 'Robert Taylor',
  },
  {
    id: 'DEP-008',
    company: 'BlueStar Corp',
    companyEmail: 'ceo@bluestarcorp.com',
    bankName: 'Regions Bank',
    chequeNumber: '008877',
    amount: '$33,400.00',
    requestedAt: 'Jun 10, 2:00 PM',
    timeShort: 'Jun 10',
    status: 'Approved',
    emailSent: true,
    aiSummary:
      'Deposit request approved for Regions Bank cheque #008877 for $33,400.00. Transaction reference: TXN-2025-44655. No discrepancies found. Deposit completed successfully.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=corporate%20cheque%20document%20on%20white%20background%20with%20regions%20bank%20details%20amount%20and%20signature%20professional%20financial%20instrument%20scanned&width=160&height=100&seq=dep-thumb-8&orientation=landscape',
    starred: false,
    read: true,
    tag: 'Approved',
    tagColor: 'bg-green-100 text-[#2F8F3A]',
    requestedBy: 'Jennifer Martinez',
    depositDate: '2026/03/22',
  },
  {
    id: 'DEP-009',
    company: 'NovaTech LLC',
    companyEmail: 'billing@novatech.com',
    bankName: 'KeyBank',
    chequeNumber: '006221',
    amount: '$15,600.00',
    requestedAt: 'Jun 9, 3:10 PM',
    timeShort: 'Jun 9',
    status: 'Pending',
    emailSent: true,
    aiSummary:
      'Deposit request for KeyBank cheque #006221 for $15,600.00. Requested by NovaTech LLC. All verification checks passed. Awaiting final approval from admin team.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=keybank%20cheque%20document%20on%20white%20background%20with%20amount%20payee%20and%20date%20fields%20professional%20financial%20instrument%20scanned%20clean%20document&width=160&height=100&seq=dep-thumb-9&orientation=landscape',
    starred: false,
    read: true,
    tag: 'Pending',
    tagColor: 'bg-amber-100 text-amber-700',
    requestedBy: 'Christopher Lee',
  },
  {
    id: 'DEP-010',
    company: 'Vertex Partners',
    companyEmail: 'ops@vertexpartners.com',
    bankName: 'Truist Bank',
    chequeNumber: '013456',
    amount: '$28,900.00',
    requestedAt: 'Jun 8, 9:30 AM',
    timeShort: 'Jun 8',
    status: 'Deposited',
    emailSent: true,
    aiSummary:
      'Deposit request approved for Truist Bank cheque #013456 for $28,900.00. Transaction reference: TXN-2025-44512. Funds cleared successfully. Deposit slip sent to company.',
    thumbnail:
      'https://readdy.ai/api/search-image?query=truist%20bank%20cheque%20document%20on%20white%20background%20with%20amount%20payee%20routing%20number%20professional%20financial%20instrument%20scanned%20clean&width=160&height=100&seq=dep-thumb-10&orientation=landscape',
    starred: true,
    read: true,
    tag: 'Deposited',
    tagColor: 'bg-teal-100 text-teal-700',
    requestedBy: 'Amanda White',
    depositDate: '2026/03/18',
  },
];
