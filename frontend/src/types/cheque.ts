export interface Cheque {
  id: number;
  starred: boolean;
  flagged: boolean;
  companyColor: string;
  companyInitial: string;
  company: string;
  industryColor: string;
  industry: string;
  contact: string;
  email: string;
  mails: number;
  cheques: number;
  status: 'Active' | 'Pending' | 'Inactive' | 'Pending Deposit' | 'Deposited' | 'Rejected' | 'On Hold';
  bankName: string;
  chequeNumber: string;
  amount: number;
  description: string;
  recipient: string;
  time: string;
}
