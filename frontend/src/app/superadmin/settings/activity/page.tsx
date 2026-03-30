"use client";

export default function SuperAdminActivityLogPage() {
  return (
    <div className="py-2">
      <h1 className="text-lg sm:text-xl font-bold text-slate-900">Activity Log</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">System activity and admin actions will appear here.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">This is a frontend-only placeholder. Connect it to your backend audit log later.</p>
      </div>
    </div>
  );
}

