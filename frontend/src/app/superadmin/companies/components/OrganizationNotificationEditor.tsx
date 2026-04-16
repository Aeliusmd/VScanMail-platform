"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

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
        checked ? "bg-[#0A3D8F]" : "bg-slate-200"
      } ${disabled ? "pointer-events-none cursor-not-allowed opacity-40" : "cursor-pointer"} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0A3D8F]/35 has-[:focus-visible]:ring-offset-2`}
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

type Capabilities = {
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
};

type PrefsApi = {
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
  capabilities: Capabilities;
  planTier: string | null;
  legacyPlan: boolean;
  updatedAt: string;
};

type DraftValue = { emailEnabled: boolean; newDocumentScanned: boolean };

export default function OrganizationNotificationEditor({
  clientId,
  mode = "existing",
  draftValue,
  onDraftChange,
  showSaveButton = true,
}: {
  clientId?: string;
  mode?: "existing" | "draft";
  draftValue?: DraftValue;
  onDraftChange?: (next: DraftValue) => void;
  showSaveButton?: boolean;
}) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [legacyPlan, setLegacyPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(draftValue?.emailEnabled ?? true);
  const [newDocumentScanned, setNewDocumentScanned] = useState(draftValue?.newDocumentScanned ?? true);

  const prefsPayload = useMemo(
    () => ({
      emailEnabled: emailNotifications,
      // one toggle controls both mail + cheque alerts
      newMailScanned: newDocumentScanned,
      newChequeScanned: newDocumentScanned,
      // Not implemented yet (kept false; UI shows Coming soon)
      deliveryUpdates: false,
      depositUpdates: false,
      weeklySummary: false,
    }),
    [emailNotifications, newDocumentScanned]
  );

  const load = useCallback(async () => {
    if (mode === "draft") {
      setCapabilities({
        emailEnabled: true,
        newMailScanned: true,
        newChequeScanned: true,
        deliveryUpdates: false,
        depositUpdates: false,
        weeklySummary: false,
      });
      setPlanTier(null);
      setLegacyPlan(true);
      setError(null);
      setSuccess(false);
      setLoading(false);
      return;
    }

    if (!clientId) {
      setError("Missing organization id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const prefs = await apiClient<PrefsApi>(`/api/clients/${clientId}/notification-preferences`, {
        method: "GET",
      });
      setCapabilities(prefs.capabilities);
      setPlanTier(prefs.planTier);
      setLegacyPlan(Boolean(prefs.legacyPlan));
      setEmailNotifications(Boolean(prefs.emailEnabled));
      setNewDocumentScanned(Boolean(prefs.newMailScanned) || Boolean(prefs.newChequeScanned));
    } catch (e: any) {
      setError(e?.message || "Failed to load notification preferences");
      setCapabilities(null);
      setPlanTier(null);
      setLegacyPlan(false);
    } finally {
      setLoading(false);
    }
  }, [clientId, mode]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange({ emailEnabled: emailNotifications, newDocumentScanned });
  }, [onDraftChange, emailNotifications, newDocumentScanned]);

  const handleSave = async () => {
    if (mode === "draft") return;
    if (!clientId) {
      setError("Missing organization id.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient<PrefsApi>(`/api/clients/${clientId}/notification-preferences`, {
        method: "PUT",
        body: JSON.stringify(prefsPayload),
      });
      await load();
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const cap = capabilities;
  const allowNewDocument = Boolean(cap?.newMailScanned || cap?.newChequeScanned);

  const rows: Array<{
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
    capKey: keyof Capabilities;
    comingSoon?: boolean;
  }> = [
    {
      label: "New document scanned",
      desc: "Cheque or letter — you’ll see the type in the email.",
      value: newDocumentScanned,
      onChange: setNewDocumentScanned,
      capKey: "newMailScanned",
    },
    {
      label: "Delivery status updates",
      desc: "Receive updates when delivery status changes",
      value: false,
      onChange: () => {},
      capKey: "deliveryUpdates",
      comingSoon: true,
    },
    {
      label: "Deposit status updates",
      desc: "Receive updates when deposit status changes",
      value: false,
      onChange: () => {},
      capKey: "depositUpdates",
      comingSoon: true,
    },
    {
      label: "Weekly summary report",
      desc: "Receive a weekly digest of all activity",
      value: false,
      onChange: () => {},
      capKey: "weeklySummary",
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="border-t border-slate-100" />

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-[#0A3D8F] rounded-md flex items-center justify-center flex-shrink-0">
            <i className="ri-mail-settings-line text-white text-xs" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Email notifications</h3>
        </div>

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            Loading notification preferences...
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Preferences saved.
          </div>
        )}

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon icon="ri:mail-line" className="text-xl" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Email notifications</p>
              <p className="mt-1 text-xs text-slate-500">Master switch for this organization.</p>
              {cap && !cap.emailEnabled && !legacyPlan ? (
                <p className="mt-1 text-xs text-amber-700">Not included in current plan.</p>
              ) : null}
            </div>
          </div>
          <NotificationToggle
            id="org-pref-email-master"
            checked={emailNotifications}
            onChange={setEmailNotifications}
            disabled={loading || !cap?.emailEnabled}
          />
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {rows.map((item, i) => {
            const allowed = item.label === "New document scanned" ? allowNewDocument : Boolean(cap ? cap[item.capKey] : false);
            const disabledRow =
              loading ||
              !emailNotifications ||
              !allowed ||
              !cap?.emailEnabled ||
              Boolean(item.comingSoon);
            return (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  {item.comingSoon ? (
                    <p className="mt-1 text-xs text-slate-400">Coming soon</p>
                  ) : null}
                  {cap && !allowed && !legacyPlan ? (
                    <p className="mt-1 text-xs text-amber-700">Not included in current plan.</p>
                  ) : null}
                </div>
                <NotificationToggle
                  id={`org-pref-row-${i}`}
                  checked={item.value}
                  onChange={item.onChange}
                  disabled={disabledRow}
                />
              </div>
            );
          })}
        </div>

        {showSaveButton ? (
          <div className="mt-5 flex items-center justify-start">
            {mode === "draft" ? (
              <p className="text-xs text-slate-500">Saved when you add the organization.</p>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving}
                className="cursor-pointer rounded-xl bg-[#0A3D8F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083170] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? "Saving..." : "Save notification preferences"}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">Saved when you click “Save Changes”.</p>
        )}
      </div>
    </div>
  );
}

