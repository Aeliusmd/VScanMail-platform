import { Icon } from '@iconify/react';
import Link from 'next/link';

interface QuickActionsProps {
  onNewScan?: () => void;
}

export default function QuickActions({ onNewScan }: QuickActionsProps) {
  const systemStatus = [
    { label: 'Scanner Status', status: 'Online', color: 'text-green-500', bg: 'bg-green-500' },
    { label: 'AI Processing', status: 'Active', color: 'text-green-500', bg: 'bg-green-500' },
    { label: 'Email Service', status: 'Running', color: 'text-green-500', bg: 'bg-green-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 w-full xl:w-[280px] flex-shrink-0 min-w-0">
      
      {/* Quick Actions Section */}
      <div>
        <h2 className="text-base font-bold text-gray-900 font-roboto mb-5">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          {/* New Scan */}
          <Link href="/admin/scan">
          <button
            onClick={onNewScan}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1E3A8A] text-white rounded-lg font-roboto font-medium text-sm hover:bg-[#1e40af] transition cursor-pointer whitespace-nowrap"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <Icon icon="ri:scan-2-line" className="text-base" />
            </div>
            <span>New Scan</span>
          </button>
          </Link>
          

          {/* View Requests */}
          <Link href="/admin/deposits">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-roboto font-medium text-sm hover:bg-gray-50 transition cursor-pointer whitespace-nowrap">
            <div className="flex items-center justify-center w-5 h-5">
              <Icon icon='ri:exchange-dollar-line' className="text-base text-gray-500" />
            </div>
            <span>View Requests</span>
          </button>
          </Link>

          {/* Manage Companies */}
          <Link href="/admin/companies">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-roboto font-medium text-sm hover:bg-gray-50 transition cursor-pointer whitespace-nowrap">
            <div className="flex items-center justify-center w-5 h-5">
              <Icon icon="ri:building-line" className="text-base text-gray-500" />
            </div>
            <span>Manage Companies</span>
          </button>
          </Link>
        </div>
      </div>

      {/* System Status Section */}
      <div>
        <h2 className="text-base font-bold text-gray-900 font-roboto mb-4">System Status</h2>
        <div className="flex flex-col gap-3">
          {systemStatus.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-roboto">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${item.bg} flex-shrink-0`}></span>
                <span className={`text-sm font-medium font-roboto ${item.color}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
