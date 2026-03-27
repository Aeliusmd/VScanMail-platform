"use client";

import { useState } from 'react';

export default function NotificationPreferencesPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newMailScanned, setNewMailScanned] = useState(true);
  const [newChequeScanned, setNewChequeScanned] = useState(true);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);
  const [depositUpdates, setDepositUpdates] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Notification Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Choose how and when you receive alerts.</p>
      </div>

      <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
            <p className="text-xs text-slate-500 mt-1">Get notified when an event happens.</p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-5 w-10 accent-[#0A3D8F]"
          />
        </div>

        <div className="mt-4 space-y-3">
          {[
            { label: 'New mail scanned', desc: 'Get notified when a new mail is scanned and processed', value: newMailScanned, onChange: setNewMailScanned },
            { label: 'New cheque scanned', desc: 'Get notified when a new cheque is scanned', value: newChequeScanned, onChange: setNewChequeScanned },
            { label: 'Delivery status updates', desc: 'Receive updates when delivery status changes', value: deliveryUpdates, onChange: setDeliveryUpdates },
            { label: 'Deposit status updates', desc: 'Receive updates when deposit status changes', value: depositUpdates, onChange: setDepositUpdates },
            { label: 'Weekly summary report', desc: 'Receive a weekly digest of all activity', value: weeklySummary, onChange: setWeeklySummary },
          ].map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.onChange(e.target.checked)}
                disabled={!emailNotifications}
                className="h-5 w-10 accent-[#0A3D8F]"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center sm:justify-start">
          <button className="px-6 py-2.5 rounded-lg bg-[#0A3D8F] text-white font-semibold text-sm hover:bg-[#083170] transition cursor-pointer">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

