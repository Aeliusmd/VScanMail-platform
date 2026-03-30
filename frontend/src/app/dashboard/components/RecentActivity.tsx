import { Icon } from '@iconify/react';
import Link from 'next/link';

const activities = [
  { id: 1, company: 'Tech Solutions Inc', type: 'Mail', time: '5 mins ago', status: 'Processed', statusColor: 'bg-[#DBEAFE] text-[#1E40AF]', icon: 'ri:mail-line' },
  { id: 2, company: 'Global Enterprises', type: 'Cheque', time: '12 mins ago', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-700', icon: 'iconamoon:cheque' },
  { id: 3, company: 'Innovate Corp', type: 'Mail', time: '25 mins ago', status: 'Delivered', statusColor: 'bg-green-100 text-green-700', icon: 'ri:mail-line' },
  { id: 4, company: 'Prime Industries', type: 'Cheque', time: '1 hour ago', status: 'Deposited', statusColor: 'bg-purple-100 text-purple-700', icon: 'iconamoon:cheque' },
  { id: 5, company: 'Summit LLC', type: 'Mail', time: '2 hours ago', status: 'Processed', statusColor: 'bg-[#DBEAFE] text-[#1E40AF]', icon: 'ri:mail-line' },
  { id: 6, company: 'Apex Holdings', type: 'Mail', time: '3 hours ago', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-700', icon: 'ri:mail-line' },
  { id: 7, company: 'Nexus Corp', type: 'Cheque', time: '4 hours ago', status: 'Deposited', statusColor: 'bg-purple-100 text-purple-700', icon: 'iconamoon:cheque' },
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-900 font-roboto">Recent Activity</h2>
        <Link href="/dashboard/mails" className="text-sm text-[#1E40AF] hover:underline cursor-pointer font-roboto whitespace-nowrap">View All</Link>
      </div>

      <div className="space-y-1">
        {activities.map((item) => (
          <Link
            key={item.id}
            href={item.type === 'Cheque' ? '/dashboard/cheques' : '/dashboard/mails'}
            className="flex items-center justify-between py-3 border-b border-gray-50 hover:bg-gray-50/60 rounded-lg px-2 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <Icon icon={item.icon} className="text-gray-500 text-base" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 font-roboto">{item.company}</p>
                <p className="text-xs text-gray-400 font-roboto">{item.type} &bull; {item.time}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${item.statusColor}`}>
              {item.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
