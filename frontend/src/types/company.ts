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
  address_json?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  avatar_url?: string | null;
  chequeValue: number;
  notes: string;
  lastActivity: string;
  clientType?: 'manual' | 'subscription';
}