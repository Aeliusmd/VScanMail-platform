"use client";

import { useEffect, useId, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { apiClient } from '@/lib/api-client';

/** Pill toggle: dark blue track + white knob when on; flat, no shadow (matches design). */
function NotificationToggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  const genId = useId();
  const inputId = id ?? genId;
  return (
    <label
      htmlFor={inputId}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
        checked ? 'bg-[#0A3D8F]' : 'bg-slate-200'
      } ${disabled ? 'pointer-events-none cursor-not-allowed opacity-40' : 'cursor-pointer'} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0A3D8F]/35 has-[:focus-visible]:ring-offset-2`}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className="pointer-events-none block h-6 w-6 translate-x-0 rounded-full bg-white transition-transform duration-200 ease-out peer-checked:translate-x-5"
        aria-hidden
      />
    </label>
  );
}

type Prefs = {
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
  updatedAt?: string;
};

type AuthMeResponse = {
  user: { id: string; email: string };
  role: string;
  clientId: string | null;
};

export default function NotificationPreferencesPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newMailScanned, setNewMailScanned] = useState(true);
  const [newChequeScanned, setNewChequeScanned] = useState(true);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);
  const [depositUpdates, setDepositUpdates] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  const prefsPayload: Prefs = useMemo(
    () => ({
      emailEnabled: emailNotifications,
      newMailScanned,
      newChequeScanned,
      deliveryUpdates,
      depositUpdates,
      weeklySummary,
    }),
    [emailNotifications, newMailScanned, newChequeScanned, deliveryUpdates, depositUpdates, weeklySummary]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const me = await apiClient<AuthMeResponse>('/api/auth/me', { method: 'GET' });
        if (!alive) return;
        if (!me.clientId) {
          setClientId(null);
          setError('No organization is linked to this account.');
          return;
        }
        setClientId(me.clientId);

        const prefs = await apiClient<Prefs>(`/api/clients/${me.clientId}/notification-preferences`, {
          method: 'GET',
        });
        if (!alive) return;

        setEmailNotifications(Boolean(prefs.emailEnabled));
        setNewMailScanned(Boolean(prefs.newMailScanned));
        setNewChequeScanned(Boolean(prefs.newChequeScanned));
        setDeliveryUpdates(Boolean(prefs.deliveryUpdates));
        setDepositUpdates(Boolean(prefs.depositUpdates));
        setWeeklySummary(Boolean(prefs.weeklySummary));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load notification preferences');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient<Prefs>(`/api/clients/${clientId}/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify(prefsPayload),
      });
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Notification Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Choose how and when you receive alerts.</p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            Loading preferences...
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Preferences saved.
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon icon="ri:mail-line" className="text-xl" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
              <p className="mt-1 text-xs text-slate-500">Get notified when an event happens.</p>
            </div>
          </div>
          <NotificationToggle
            id="pref-email-master"
            checked={emailNotifications}
            onChange={setEmailNotifications}
            disabled={loading || !clientId}
          />
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {[
            { label: 'New mail scanned', desc: 'Get notified when a new mail is scanned and processed', value: newMailScanned, onChange: setNewMailScanned },
            { label: 'New cheque scanned', desc: 'Get notified when a new cheque is scanned', value: newChequeScanned, onChange: setNewChequeScanned },
            { label: 'Delivery status updates', desc: 'Receive updates when delivery status changes', value: deliveryUpdates, onChange: setDeliveryUpdates },
            { label: 'Deposit status updates', desc: 'Receive updates when deposit status changes', value: depositUpdates, onChange: setDepositUpdates },
            { label: 'Weekly summary report', desc: 'Receive a weekly digest of all activity', value: weeklySummary, onChange: setWeeklySummary },
          ].map((item, i) => (
            <div key={item.label} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </div>
              <NotificationToggle
                id={`pref-row-${i}`}
                checked={item.value}
                onChange={item.onChange}
                disabled={loading || !clientId || !emailNotifications}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center sm:justify-start">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || !clientId}
            className="cursor-pointer rounded-xl bg-[#0A3D8F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083170] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
