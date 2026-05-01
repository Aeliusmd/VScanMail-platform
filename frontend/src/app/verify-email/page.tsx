"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";

type RegistrationPlan = Awaited<ReturnType<typeof authApi.registrationPlans>>[number] & {
  icon: string;
  tagline: string;
  displayFeatures: string[];
  popular: boolean;
};

const iconByPlanId: Record<string, string> = {
  starter: "ri-seedling-line",
  professional: "ri-rocket-line",
  enterprise: "ri-building-2-line",
};

function formatScans(maxScans: number) {
  return maxScans >= 999999 ? "Unlimited scans/month" : `Up to ${maxScans.toLocaleString()} scans/month`;
}

function toRegistrationPlan(plan: Awaited<ReturnType<typeof authApi.registrationPlans>>[number]): RegistrationPlan {
  const baseFeatures = [
    formatScans(plan.max_scans),
    `${plan.storage} storage`,
    `Up to ${plan.max_companies.toLocaleString()} ${plan.max_companies === 1 ? "company" : "companies"}`,
    plan.ai_magic,
    plan.cheque_handling,
    ...(Array.isArray(plan.features) ? plan.features : []),
  ].filter(Boolean) as string[];

  return {
    ...plan,
    icon: iconByPlanId[plan.id] ?? "ri-price-tag-3-line",
    tagline: plan.badge || "Subscription plan",
    displayFeatures: Array.from(new Set(baseFeatures)),
    popular: plan.badge?.toLowerCase().includes("popular") || plan.id === "professional",
  };
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const planFromUrl = searchParams.get("plan");
  const checkout = searchParams.get("checkout");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpComplete, setOtpComplete] = useState(false);
  const [resumeWithoutOtp, setResumeWithoutOtp] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<RegistrationPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelHint, setCancelHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    void authApi
      .registrationPlans()
      .then((rows) => {
        if (cancelled) return;
        const tablePlans = rows.map(toRegistrationPlan);
        setPlans(tablePlans);
        const fromStorage = typeof window !== "undefined" ? localStorage.getItem("selectedPlanId") : null;
        const preselected = planFromUrl || fromStorage;
        if (preselected && tablePlans.some((plan) => plan.id === preselected)) {
          setSelectedPlan(preselected);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Could not load subscription plans.";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [planFromUrl]);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    void authApi
      .registrationStatus(email)
      .then((s) => {
        if (cancelled) return;
        if (s.emailVerified && s.clientPending) {
          setResumeWithoutOtp(true);
          setOtpComplete(true);
          setShowPlanModal(true);
          if (checkout === "cancel") {
            setCancelHint("Payment was cancelled. Choose your plan again to continue.");
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email, planFromUrl, checkout]);

  const preselectPlanAfterOtp = () => {
    setShowPlanModal(true);
    const fromStorage =
      typeof window !== "undefined" ? localStorage.getItem("selectedPlanId") : null;
    const pre = planFromUrl || fromStorage;
    if (pre && plans.some((plan) => plan.id === pre)) setSelectedPlan(pre);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Missing email in verification link.");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP code.");
      return;
    }

    try {
      setLoading(true);
      await authApi.verifyEmail(email, otp.trim());
      setOtpComplete(true);
      preselectPlanAfterOtp();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = async () => {
    if (!email || !selectedPlan) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const { url } = await authApi.registrationCheckout(
        email,
        selectedPlan
      );
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start checkout";
      setError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        {!otpComplete && (
          <form
            onSubmit={handleVerify}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          >
            <h1 className="text-lg font-bold text-slate-900">Verify your email</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the OTP sent to <span className="font-medium">{email || "your inbox"}</span>. After
              verification you&apos;ll choose a plan and complete payment before signing in.
            </p>

            <div className="mt-5">
              <label className="text-xs text-slate-500">OTP code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0A3D8F]/20 text-slate-900 placeholder:text-slate-400"
                placeholder="Enter 6-digit code"
              />
              {error && (
                <p className="text-sm text-red-600 mt-2" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#0A3D8F] text-white font-semibold text-sm hover:bg-[#083170] transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}

        {otpComplete && resumeWithoutOtp && !showPlanModal && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center text-slate-600 text-sm">
            Loading checkout…
          </div>
        )}

        {otpComplete && !resumeWithoutOtp && showPlanModal && (
          <p className="text-sm text-slate-600 text-center mb-4 max-w-md mx-auto">
            Email verified. Choose your subscription below.
          </p>
        )}

        {cancelHint && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {cancelHint}
          </div>
        )}

        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Choose a Subscription Plan</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Select the plan that best fits your business needs, then continue to secure checkout.
                  </p>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <p className="text-sm text-red-600 mb-4" role="alert">
                    {error}
                  </p>
                )}

                {plansLoading ? (
                  <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500 mb-6">
                    Loading plans…
                  </div>
                ) : plans.length === 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 mb-6">
                    No active subscription plans are available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const isFeatured = plan.popular;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPlan(plan.id);
                          }
                        }}
                        className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#0A3D8F] bg-[#0A3D8F]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isFeatured && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#0A3D8F] text-white text-xs font-bold rounded-full whitespace-nowrap">
                            Most Popular
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              isSelected ? "bg-[#0A3D8F]" : "bg-gray-100"
                            }`}
                          >
                            <i
                              className={`${plan.icon} text-base ${isSelected ? "text-white" : "text-gray-500"}`}
                            />
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-[#0A3D8F] rounded-full flex items-center justify-center">
                              <i className="ri-check-line text-white text-xs" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-0.5">{plan.name}</h3>
                        <p className="text-xs text-gray-400 mb-3">{plan.tagline}</p>
                        <div className="mb-4">
                          <span className="text-2xl font-extrabold text-gray-900">
                            ${Number(plan.price).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/mo</span>
                        </div>
                        <ul className="space-y-1.5">
                          {plan.displayFeatures.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                              <i className="ri-check-line text-[#2F8F3A] mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleContinueToPayment()}
                  disabled={!selectedPlan || checkoutLoading || plansLoading || plans.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] py-3 text-sm font-bold text-white transition-all hover:bg-[#083170] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {checkoutLoading ? (
                    "Redirecting…"
                  ) : (
                    <>
                      <i className="ri-bank-card-line" />
                      Continue to payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-600 text-sm">
          Loading…
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
