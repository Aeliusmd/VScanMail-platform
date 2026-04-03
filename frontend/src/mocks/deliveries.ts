export interface DeliveryRequest {
  id: string;
  company: string;
  companyEmail: string;
  mailSubject: string;
  deliveryAddress: string;
  addressShort: string;
  courier: string;
  trackingNumber: string;
  requestedAt: string;
  timeShort: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Failed';
  emailSent: boolean;
  aiSummary: string;
  thumbnail: string;
  starred: boolean;
  read: boolean;
  tag?: string;
  tagColor?: string;
  requestedBy: string;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export const deliveries: DeliveryRequest[] = [
//   {
//     id: 'DEL-001',
//     company: 'Tech Solutions Inc',
//     companyEmail: 'finance@techsolutions.com',
//     mailSubject: 'Bank Statement - January 2025',
//     deliveryAddress: '1234 Market Street, Suite 500, San Francisco, CA 94103',
//     addressShort: '1234 Market St, SF, CA',
//     courier: 'FedEx Express',
//     trackingNumber: 'FDX8821445672',
//     requestedAt: 'Today, 11:05 AM',
//     timeShort: '11:05 AM',
//     status: 'Pending',
//     emailSent: true,
//     aiSummary:
//       'Delivery request for bank statement mail to Tech Solutions Inc headquarters in San Francisco. Standard priority delivery. Recipient confirmed available for signature. No special handling required.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=business%20envelope%20with%20bank%20statement%20document%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=160&height=100&seq=del-thumb-1&orientation=landscape',
//     starred: true,
//     read: false,
//     tag: 'Urgent',
//     tagColor: 'bg-red-100 text-red-700',
//     requestedBy: 'John Smith',
//     recipientName: 'Sarah Johnson',
//     recipientPhone: '+1 (415) 555-0123',
//     notes: 'Signature required upon delivery',
//   },
//   {
//     id: 'DEL-002',
//     company: 'Global Enterprises',
//     companyEmail: 'accounts@globalenterprises.com',
//     mailSubject: 'Legal Documents - Contract Amendment',
//     deliveryAddress: '789 Business Park Drive, Building C, Austin, TX 78701',
//     addressShort: '789 Business Park Dr, Austin, TX',
//     courier: 'UPS Next Day Air',
//     trackingNumber: 'UPS9934521087',
//     requestedAt: 'Today, 09:48 AM',
//     timeShort: '9:48 AM',
//     status: 'In Transit',
//     emailSent: true,
//     aiSummary:
//       'Legal documents in transit to Global Enterprises Austin office. Next day air delivery scheduled. Package scanned at distribution center at 8:30 AM. Expected delivery by 3:00 PM today.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=legal%20document%20envelope%20with%20contract%20papers%20on%20white%20background%20professional%20mail%20package%20scanned&width=160&height=100&seq=del-thumb-2&orientation=landscape',
//     starred: false,
//     read: false,
//     tag: 'In Transit',
//     tagColor: 'bg-blue-100 text-blue-700',
//     requestedBy: 'Sarah Johnson',
//     recipientName: 'Michael Chen',
//     recipientPhone: '+1 (512) 555-0198',
//   },
//   {
//     id: 'DEL-003',
//     company: 'Innovate Corp',
//     companyEmail: 'legal@innovatecorp.com',
//     mailSubject: 'Tax Documents - Q4 2024',
//     deliveryAddress: '456 Innovation Way, Floor 12, Seattle, WA 98101',
//     addressShort: '456 Innovation Way, Seattle, WA',
//     courier: 'USPS Priority Mail',
//     trackingNumber: 'USPS7712334556',
//     requestedAt: 'Yesterday, 3:30 PM',
//     timeShort: 'Yesterday',
//     status: 'Delivered',
//     emailSent: true,
//     aiSummary:
//       'Tax documents successfully delivered to Innovate Corp Seattle office. Package signed for by Michael Chen at 2:45 PM yesterday. Delivery confirmation sent to company email.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=tax%20document%20envelope%20with%20financial%20papers%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=160&height=100&seq=del-thumb-3&orientation=landscape',
//     starred: true,
//     read: true,
//     tag: 'Delivered',
//     tagColor: 'bg-green-100 text-[#2F8F3A]',
//     requestedBy: 'Michael Chen',
//     recipientName: 'Emily Davis',
//     recipientPhone: '+1 (206) 555-0167',
//   },
//   {
//     id: 'DEL-004',
//     company: 'Prime Industries',
//     companyEmail: 'ops@primeindustries.com',
//     mailSubject: 'Insurance Policy Documents',
//     deliveryAddress: '321 Corporate Blvd, Suite 200, Chicago, IL 60601',
//     addressShort: '321 Corporate Blvd, Chicago, IL',
//     courier: 'DHL Express',
//     trackingNumber: 'DHL4456778899',
//     requestedAt: 'Yesterday, 1:15 PM',
//     timeShort: 'Yesterday',
//     status: 'Failed',
//     emailSent: true,
//     aiSummary:
//       'Delivery attempt failed - recipient not available at delivery address. Package held at local DHL facility. Company has been notified to arrange redelivery or pickup.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=insurance%20document%20envelope%20with%20policy%20papers%20on%20white%20background%20professional%20mail%20package%20scanned&width=160&height=100&seq=del-thumb-4&orientation=landscape',
//     starred: false,
//     read: true,
//     tag: 'Failed',
//     tagColor: 'bg-red-100 text-red-700',
//     requestedBy: 'Emily Davis',
//     recipientName: 'David Wilson',
//     recipientPhone: '+1 (312) 555-0145',
//     notes: 'Recipient unavailable - held at facility',
//   },
//   {
//     id: 'DEL-005',
//     company: 'Summit LLC',
//     companyEmail: 'admin@summitllc.com',
//     mailSubject: 'Vendor Invoices - Multiple Documents',
//     deliveryAddress: '555 Commerce Street, Floor 8, Dallas, TX 75201',
//     addressShort: '555 Commerce St, Dallas, TX',
//     courier: 'FedEx Ground',
//     trackingNumber: 'FDX2234567890',
//     requestedAt: 'Yesterday, 10:00 AM',
//     timeShort: 'Yesterday',
//     status: 'Pending',
//     emailSent: false,
//     aiSummary:
//       'Delivery request for vendor invoice package to Summit LLC Dallas office. Standard ground shipping. Package contains multiple documents. Awaiting courier pickup from processing center.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=business%20invoice%20envelope%20with%20multiple%20documents%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=160&height=100&seq=del-thumb-5&orientation=landscape',
//     starred: false,
//     read: true,
//     tag: 'Pending',
//     tagColor: 'bg-amber-100 text-amber-700',
//     requestedBy: 'David Wilson',
//     recipientName: 'Lisa Anderson',
//     recipientPhone: '+1 (214) 555-0189',
//     notes: 'Multiple documents - handle with care',
//   },
//   {
//     id: 'DEL-006',
//     company: 'Apex Ventures',
//     companyEmail: 'finance@apexventures.com',
//     mailSubject: 'Financial Reports - Annual Review',
//     deliveryAddress: '888 Financial Plaza, Suite 1500, New York, NY 10004',
//     addressShort: '888 Financial Plaza, NY, NY',
//     courier: 'UPS Ground',
//     trackingNumber: 'UPS1122334455',
//     requestedAt: 'Jun 11, 4:20 PM',
//     timeShort: 'Jun 11',
//     status: 'Delivered',
//     emailSent: true,
//     aiSummary:
//       'Annual financial reports delivered successfully to Apex Ventures New York headquarters. Package signed for by Lisa Anderson on June 11 at 3:15 PM. All documents accounted for.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=financial%20report%20envelope%20with%20annual%20documents%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=160&height=100&seq=del-thumb-6&orientation=landscape',
//     starred: true,
//     read: true,
//     tag: 'Delivered',
//     tagColor: 'bg-green-100 text-[#2F8F3A]',
//     requestedBy: 'Lisa Anderson',
//     recipientName: 'Robert Taylor',
//     recipientPhone: '+1 (212) 555-0134',
//   },
//   {
//     id: 'DEL-007',
//     company: 'Horizon Group',
//     companyEmail: 'info@horizongroup.com',
//     mailSubject: 'Client Correspondence - Proposal Documents',
//     deliveryAddress: '222 Enterprise Avenue, Building B, Boston, MA 02101',
//     addressShort: '222 Enterprise Ave, Boston, MA',
//     courier: 'FedEx 2Day',
//     trackingNumber: 'FDX5566778899',
//     requestedAt: 'Jun 11, 11:45 AM',
//     timeShort: 'Jun 11',
//     status: 'In Transit',
//     emailSent: true,
//     aiSummary:
//       'Client proposal documents in transit to Horizon Group Boston office. Two-day delivery service. Package currently at regional sorting facility. Expected delivery tomorrow by end of day.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=business%20proposal%20envelope%20with%20client%20documents%20on%20white%20background%20professional%20mail%20package%20scanned&width=160&height=100&seq=del-thumb-7&orientation=landscape',
//     starred: false,
//     read: true,
//     tag: 'In Transit',
//     tagColor: 'bg-blue-100 text-blue-700',
//     requestedBy: 'Robert Taylor',
//     recipientName: 'Jennifer Martinez',
//     recipientPhone: '+1 (617) 555-0176',
//   },
//   {
//     id: 'DEL-008',
//     company: 'BlueStar Corp',
//     companyEmail: 'ceo@bluestarcorp.com',
//     mailSubject: 'HR Documents - Employee Records',
//     deliveryAddress: '999 Technology Drive, Suite 300, San Jose, CA 95110',
//     addressShort: '999 Technology Dr, San Jose, CA',
//     courier: 'USPS Express Mail',
//     trackingNumber: 'USPS9988776655',
//     requestedAt: 'Jun 10, 2:00 PM',
//     timeShort: 'Jun 10',
//     status: 'Delivered',
//     emailSent: true,
//     aiSummary:
//       'HR employee records delivered to BlueStar Corp San Jose office. Express mail service completed on June 10 at 11:30 AM. Confidential documents signed for by authorized personnel.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=hr%20document%20envelope%20with%20employee%20records%20on%20white%20background%20professional%20confidential%20mail%20package%20scanned&width=160&height=100&seq=del-thumb-8&orientation=landscape',
//     starred: false,
//     read: true,
//     tag: 'Delivered',
//     tagColor: 'bg-green-100 text-[#2F8F3A]',
//     requestedBy: 'Jennifer Martinez',
//     recipientName: 'Christopher Lee',
//     recipientPhone: '+1 (408) 555-0192',
//   },
//   {
//     id: 'DEL-009',
//     company: 'NovaTech LLC',
//     companyEmail: 'billing@novatech.com',
//     mailSubject: 'Utility Bills - Office Expenses',
//     deliveryAddress: '777 Innovation Circle, Floor 5, Denver, CO 80202',
//     addressShort: '777 Innovation Circle, Denver, CO',
//     courier: 'FedEx Standard',
//     trackingNumber: 'FDX3344556677',
//     requestedAt: 'Jun 9, 3:10 PM',
//     timeShort: 'Jun 9',
//     status: 'Pending',
//     emailSent: true,
//     aiSummary:
//       'Delivery request for utility bill documents to NovaTech LLC Denver office. Standard shipping selected. Package prepared and awaiting courier pickup. Expected delivery within 3-5 business days.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=utility%20bill%20envelope%20with%20expense%20documents%20on%20white%20background%20professional%20mail%20package%20scanned%20clean&width=160&height=100&seq=del-thumb-9&orientation=landscape',
//     starred: false,
//     read: true,
//     tag: 'Pending',
//     tagColor: 'bg-amber-100 text-amber-700',
//     requestedBy: 'Christopher Lee',
//     recipientName: 'Amanda White',
//     recipientPhone: '+1 (303) 555-0158',
//   },
//   {
//     id: 'DEL-010',
//     company: 'Vertex Partners',
//     companyEmail: 'ops@vertexpartners.com',
//     mailSubject: 'Partnership Agreement - Signed Documents',
//     deliveryAddress: '111 Business Center, Suite 700, Miami, FL 33101',
//     addressShort: '111 Business Center, Miami, FL',
//     courier: 'UPS Overnight',
//     trackingNumber: 'UPS6677889900',
//     requestedAt: 'Jun 8, 9:30 AM',
//     timeShort: 'Jun 8',
//     status: 'Delivered',
//     emailSent: true,
//     aiSummary:
//       'Signed partnership agreement documents delivered to Vertex Partners Miami office. Overnight delivery completed on June 8 at 10:15 AM. Legal documents confirmed received and filed.',
//     thumbnail:
//       'https://readdy.ai/api/search-image?query=partnership%20agreement%20envelope%20with%20signed%20legal%20documents%20on%20white%20background%20professional%20mail%20package%20scanned&width=160&height=100&seq=del-thumb-10&orientation=landscape',
//     starred: true,
//     read: true,
//     tag: 'Delivered',
//     tagColor: 'bg-green-100 text-[#2F8F3A]',
//     requestedBy: 'Amanda White',
//     recipientName: 'Daniel Brown',
//     recipientPhone: '+1 (305) 555-0143',
//   },
];

