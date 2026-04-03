export interface Mail {
  id: number;
  starred: boolean;
  flagged: boolean;
  senderColor: string;
  senderInitial: string;
  sender: string;
  tag: 'Inbox' | 'Delivered' | 'Pending';
  subject: string;
  preview: string;
  hasAttachment: boolean;
  company: string;
  time: string;
}
