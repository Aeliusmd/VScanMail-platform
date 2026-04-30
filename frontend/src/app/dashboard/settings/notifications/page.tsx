"use client";

import { useEffect, useId, useState } from 'react';
import { Icon } from '@iconify/react';

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

export default function NotificationPreferencesPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newMailScanned, setNewMailScanned] = useState(true);
  const [newChequeScanned, setNewChequeScanned] = useState(true);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);
  const [depositUpdates, setDepositUpdates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch("/api/auth/me", { method: "GET" });
        if (!meRes.ok) {
          throw new Error("Failed to load session.");
        }
        const me = await meRes.json();
        const nextClientId = me?.clientId as string | null;

        if (!nextClientId) {
          setClientId(null);
          setError("This page is only available for customer accounts.");
          return;
        }

        if (cancelled) return;
        setClientId(nextClientId);

        const prefsRes = await fetch(
          `/api/clients/${encodeURIComponent(nextClientId)}/notification-preferences`,
          { method: "GET" }
        );
        if (!prefsRes.ok) {
          const body = await prefsRes.json().catch(() => null);
          throw new Error(body?.error || "Failed to load notification preferences.");
        }

        const prefs = await prefsRes.json();
        if (cancelled) return;

        setEmailNotifications(Boolean(prefs?.emailEnabled));
        setNewMailScanned(Boolean(prefs?.newMailScanned));
        setNewChequeScanned(Boolean(prefs?.newChequeScanned));
        setDeliveryUpdates(Boolean(prefs?.deliveryUpdates));
        setDepositUpdates(Boolean(prefs?.depositUpdates));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load notification preferences.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const savePreferences = async () => {
    setError(null);
    if (!clientId) {
      setError("This page is only available for customer accounts.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/notification-preferences`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailEnabled: emailNotifications,
            newMailScanned,
            newChequeScanned,
            deliveryUpdates,
            depositUpdates,
            weeklySummary: false,
          }),
        }
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Failed to save preferences.");
      }

      // Sync state from response
      setEmailNotifications(Boolean(body?.emailEnabled));
      setNewMailScanned(Boolean(body?.newMailScanned));
      setNewChequeScanned(Boolean(body?.newChequeScanned));
      setDeliveryUpdates(Boolean(body?.deliveryUpdates));
      setDepositUpdates(Boolean(body?.depositUpdates));

      setSavedMsg(true);
      window.setTimeout(() => setSavedMsg(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences.");
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
          />
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-full rounded bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            [
              { label: 'New mail scanned', desc: 'Get notified when a new mail is scanned and processed', value: newMailScanned, onChange: setNewMailScanned },
              { label: 'New cheque scanned', desc: 'Get notified when a new cheque is scanned', value: newChequeScanned, onChange: setNewChequeScanned },
              { label: 'Delivery status updates', desc: 'Receive updates when delivery status changes', value: deliveryUpdates, onChange: setDeliveryUpdates },
              { label: 'Deposit status updates', desc: 'Receive updates when deposit status changes', value: depositUpdates, onChange: setDepositUpdates },
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
                  disabled={!emailNotifications}
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-center sm:justify-start">
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void savePreferences()}
            className="cursor-pointer rounded-xl bg-[#0A3D8F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083170] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        {savedMsg && (
          <p className="mt-3 text-xs font-medium text-[#2F8F3A]">Preferences saved</p>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
