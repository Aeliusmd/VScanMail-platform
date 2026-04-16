import { Icon } from '@iconify/react';
import Link from 'next/link';

export type ActivityItem = {
  id: string;
  clientId?: string;
  company: string;
  type: string;
  time: string;
  status: string;
  statusColor: string;
  icon: string;
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-900 font-roboto">Recent Activity</h2>
        <Link href="/admin/mails" className="text-sm text-[#1E40AF] hover:underline cursor-pointer font-roboto whitespace-nowrap">View All</Link>
      </div>

      <div className="space-y-1">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No recent activity found.</p>
        ) : activities.map((item) => (
          <Link
            key={item.id}
            href={
              item.clientId
                ? `${item.type === 'Cheque' ? '/admin/cheques' : '/admin/mails'}?clientId=${encodeURIComponent(item.clientId)}`
                : item.type === 'Cheque'
                  ? '/admin/cheques'
                  : '/admin/mails'
            }
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
