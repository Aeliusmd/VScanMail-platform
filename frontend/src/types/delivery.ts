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
