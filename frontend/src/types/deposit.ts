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

export interface Deposit {
  id: number;
  starred: boolean;
  flagged: boolean;
  companyColor: string;
  companyInitial: string;
  company: string;
  bankName: string;
  bankCode: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
  priority: 'Urgent' | 'Normal' | 'Low';
  requestedBy: string;
  time: string;
}
