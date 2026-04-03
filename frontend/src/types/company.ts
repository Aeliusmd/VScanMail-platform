export interface Company {
  id: string;
  starred: boolean;
  flagged: boolean;
  name: string;
  initial: string;
  avatarColor: string;
  industry: string;
  industryBadge: string;
  contact: string;
  email: string;
  mails: number;
  cheques: number;
  status: 'Active' | 'Pending' | 'Inactive';
  time: string;
  joined: string;
  phone: string;
  address: string;
  chequeValue: number;
  notes: string;
  lastActivity: string;
}
