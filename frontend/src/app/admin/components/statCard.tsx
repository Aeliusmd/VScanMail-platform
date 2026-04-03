import { Icon } from '@iconify/react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  iconClass?: string;
  iconifyId?: string;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({ title, value, subtitle, iconClass, iconifyId, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between flex-1 min-w-0">
      <div>
        <p className="text-sm text-gray-500 font-roboto mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-roboto leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-1 font-roboto">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} flex-shrink-0`}>
        {iconifyId ? (
          <Icon icon={iconifyId} className={`text-2xl ${iconColor}`} />
        ) : (
          <i className={`${iconClass} text-2xl ${iconColor}`}></i>
        )}
      </div>
    </div>
  );
}
