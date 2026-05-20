"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api-client";
import styles from "./login.module.css";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const checkoutSessionId = searchParams.get("session_id");
  const checkoutEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastErrorAtMs, setLastErrorAtMs] = useState<number | null>(null);
  const [paymentUpdateHref, setPaymentUpdateHref] = useState<string | null>(null);
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);
  // True while we're activating the account after Stripe redirect — hides the login form.
  const [activating, setActivating] = useState(checkoutSuccess && !!checkoutSessionId);

  const finalizeRegistrationCheckout = async () => {
    if (!checkoutSuccess || !checkoutSessionId || !checkoutEmail) return false;

    const result = await authApi.completeRegistrationCheckout(checkoutSessionId, checkoutEmail);

    if (result.active && result.autoLoggedIn && result.user) {
      localStorage.setItem("vscanmail_last_activity", new Date().toISOString());
      const role = result.user.role;
      if (role === "super_admin") {
        router.replace("/superadmin/dashboard");
      } else if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace(result.user.clientId ? `/customer/${result.user.clientId}/dashboard` : "/customer");
      }
      return true;
    }

    setCheckoutBanner(
      result.active
        ? "Payment successful. Your subscription is active — sign in with your company email and password."
        : "Payment successful. Your subscription is still processing — please wait a moment before signing in."
    );

    return result.active;
  };

  useEffect(() => {
    if (!checkoutSuccess || typeof window === "undefined") return;

    localStorage.removeItem("selectedPlanId");

    if (!checkoutSessionId || !checkoutEmail) {
      setActivating(false);
      setCheckoutBanner("Payment successful. Your subscription is processing — please sign in to continue.");
      return;
    }

    finalizeRegistrationCheckout()
      .then((result) => {
        // If auto-login redirected, this branch never runs.
        setActivating(false);
        if (!result) {
          setCheckoutBanner("Payment successful. Your subscription is still processing — please sign in to continue.");
        }
      })
      .catch((err: unknown) => {
        setActivating(false);
        const message =
          err instanceof Error
            ? err.message
            : "Payment was successful, but subscription activation is still processing.";
        setCheckoutBanner(message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutEmail, checkoutSessionId, checkoutSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Keep the last error visible a bit longer so users can read it,
    // especially if they immediately retry the login.
    const MIN_ERROR_VISIBLE_MS = 6000;
    const canClearErrorNow =
      !error || lastErrorAtMs === null || Date.now() - lastErrorAtMs >= MIN_ERROR_VISIBLE_MS;
    if (canClearErrorNow) {
      setError("");
      setPaymentUpdateHref(null);
      setLastErrorAtMs(null);
    }
    setLoading(true);

    try {
      if (mfaTempToken && totpCode.length !== 6) {
        setError("Please enter the 6-digit Google Authenticator code.");
        setLastErrorAtMs(Date.now());
        return;
      }

      const response = mfaTempToken
        ? await authApi.verifyMfa(mfaTempToken, totpCode)
        : await authApi.login(email, password);

      if ("requiresMfa" in response && response.requiresMfa) {
        setMfaTempToken(response.tempToken || "");
        setShowTotpInput(true);
        setTotpCode("");
        setError("");
        return;
      }

      localStorage.setItem("vscanmail_last_activity", new Date().toISOString());
      if (!response.user) throw new Error("Login failed");
      const role = response.user.role;
      if (role === "super_admin") {
        router.push("/superadmin/dashboard");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        // Customer (client)
        router.push("/customer");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      if (
        err instanceof ApiError &&
        err.status === 402 &&
        err.details?.code === "payment_overdue"
      ) {
        const clientId = typeof err.details?.clientId === "string" ? err.details.clientId : null;
        setPaymentUpdateHref(
          clientId
            ? `/customer/${clientId}/account?tab=billing`
            : "/customer/account?tab=billing"
        );
      }
      
      if (err instanceof ApiError && err.status === 401 && (message.toLowerCase().includes("2fa") || message.toLowerCase().includes("code"))) {
        setShowTotpInput(true);
      }
      
      setError(message);
      setLastErrorAtMs(Date.now());
    } finally {
      setLoading(false);
    }
  };

  // Show a full-screen loading state while activating the account post-payment.
  // This prevents the login form from flashing before the auto-login redirect fires.
  if (activating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-semibold text-base">Activating your account…</p>
          <p className="text-slate-500 text-sm mt-1">Please wait while we set up your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.mobileTopImage}>
        <Image
          src="/images/Mask group.png"
          alt="VScan Mail"
          width={500}
          height={300}
          className="w-full h-auto md:hidden"
        />
      </div>

      <div className={styles.leftSide}>
        <div className={styles.leftCard}>
          <h1 className={styles.leftTitle}>Sign in Account</h1>
          <p className={styles.leftSubtitle}>Fill the details to sign in the account</p>
          <img src="/images/signin.png" alt="VScan Mail Illustration" className={styles.leftImage} />
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.formContainer}>
          <div className={styles.formCard}>
            <div className={styles.header}>
              <h2 className={styles.heading}>Company Login</h2>
              <p className={styles.subheading}>Access your digital mailroom dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {checkoutBanner && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm mb-4">
                  {checkoutBanner}
                </div>
              )}
              {error && (
                <div key={error} className={styles.errorBanner}>
                  <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75 2.5a.875.875 0 110-1.75.875.875 0 010 1.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className={styles.errorText}>{error}</p>
                    {paymentUpdateHref && (
                      <Link
                        href={paymentUpdateHref}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Update Payment Method
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Company Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMfaTempToken("");
                      setShowTotpInput(false);
                      setTotpCode("");
                    }}
                    placeholder="company@example.com"
                    className={styles.input}
                    disabled={Boolean(mfaTempToken)}
                  />
                  <span className={styles.inputIcon}>
                    <span className={styles.inputIconGlyph}>
                      <HiOutlineEnvelope />
                    </span>
                  </span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMfaTempToken("");
                      setShowTotpInput(false);
                      setTotpCode("");
                    }}
                    placeholder="Enter your password"
                    className={`${styles.input} ${styles.inputPasswordPad}`}
                    disabled={Boolean(mfaTempToken)}
                  />
                  <span className={styles.inputIcon}>
                    <span className={styles.inputIconGlyph}>
                      <HiOutlineLockClosed />
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                  >
                    <span className={styles.eyeIcon}>
                      {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                    </span>
                  </button>
                </div>
              </div>

              {showTotpInput && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Google Authenticator Code</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit Google Authenticator code"
                      className={styles.input}
                      maxLength={6}
                      required
                    />
                    <span className={styles.inputIcon}>
                      <span className={styles.inputIconGlyph}>
                        <HiOutlineLockClosed />
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <Link href="/recover" className="text-xs text-blue-600 hover:underline">
                      Lost Google Authenticator access? Recover account
                    </Link>
                  </div>
                </div>
              )}

              <div className={styles.rememberRow}>
                <span aria-hidden="true" />
                <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinnerIcon} />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <p className={styles.registerText}>
                Don&apos;t have an account?
                <Link href="/register" className={styles.registerLink}>
                  Register your company
                </Link>
              </p>

              <div className={styles.termsWrapper}>
                <p className={styles.termsText}>
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} aria-hidden />}>
      <LoginForm />
    </Suspense>
  );
}
