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

export const mails: Mail[] = [
  // {
  //   id: 1,
  //   starred: false,
  //   flagged: false,
  //   senderColor: 'bg-blue-500',
  //   senderInitial: 'T',
  //   sender: 'Tech Solutions Inc',
  //   tag: 'Inbox',
  //   subject: 'Monthly Invoice #2049',
  //   preview: 'Please find attached the invoice for...',
  //   hasAttachment: true,
  //   company: 'Acme Corp',
  //   time: '10:30 AM',
  // },
  // {
  //   id: 2,
  //   starred: true,
  //   flagged: false,
  //   senderColor: 'bg-green-500',
  //   senderInitial: 'G',
  //   sender: 'Global Logistics API',
  //   tag: 'Delivered',
  //   subject: 'System Upgrade Notification',
  //   preview: 'We will be upgrading our systems...',
  //   hasAttachment: false,
  //   company: 'Globex',
  //   time: 'Yesterday',
  // },
  // {
  //   id: 3,
  //   starred: false,
  //   flagged: true,
  //   senderColor: 'bg-purple-500',
  //   senderInitial: 'H',
  //   sender: 'HR Department',
  //   tag: 'Pending',
  //   subject: 'Action Required: Benefit Signups',
  //   preview: 'Your benefit selection window is closing...',
  //   hasAttachment: false,
  //   company: 'Internal',
  //   time: '2 days ago',
  // },
  // {
  //   id: 4,
  //   starred: false,
  //   flagged: false,
  //   senderColor: 'bg-yellow-500',
  //   senderInitial: 'S',
  //   sender: 'Stripe Support',
  //   tag: 'Inbox',
  //   subject: 'Payment Failed',
  //   preview: 'We were unable to process the payment...',
  //   hasAttachment: false,
  //   company: 'Stripe',
  //   time: 'Jul 12',
  // },
];
