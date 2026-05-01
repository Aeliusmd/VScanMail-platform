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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentUpdateHref, setPaymentUpdateHref] = useState<string | null>(null);
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);

  const finalizeRegistrationCheckout = async () => {
    if (!checkoutSuccess || !checkoutSessionId) return false;

    const result = await authApi.completeRegistrationCheckout(checkoutSessionId);
    setCheckoutBanner(
      result.active
        ? "Payment successful. Your subscription is active — sign in with your company email and password."
        : "Payment successful. Your subscription is still processing — please wait a moment before signing in."
    );

    return result.active;
  };

  useEffect(() => {
    if (checkoutSuccess && typeof window !== "undefined") {
      localStorage.removeItem("selectedPlanId");
      setCheckoutBanner("Payment successful. Finalizing your subscription...");

      if (checkoutSessionId) {
        finalizeRegistrationCheckout()
          .then((result) => {
            if (!result) {
              setCheckoutBanner(
                "Payment successful. Your subscription is still processing — please wait a moment before signing in."
              );
            }
          })
          .catch((err: unknown) => {
            const message =
              err instanceof Error
                ? err.message
                : "Payment was successful, but subscription activation is still processing.";
            setCheckoutBanner(message);
          });
      } else {
        setCheckoutBanner(
          "Payment successful. Your subscription is processing — please wait a moment before signing in."
        );
      }
    }
  }, [checkoutSessionId, checkoutSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPaymentUpdateHref(null);
    setLoading(true);

    try {
      await finalizeRegistrationCheckout();
      const response = await authApi.login(email, password);
      const token = response.session.access_token || response.session.accessToken;

      if (token) {
        localStorage.setItem("vscanmail_token", token);
        // Set cookie for middleware (7 days)
        document.cookie = `sb-access-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      }

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
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  <p>{error}</p>
                  {paymentUpdateHref && (
                    <Link
                      href={paymentUpdateHref}
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Update Payment Method
                    </Link>
                  )}
                </div>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Company Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="company@example.com"
                    className={styles.input}
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`${styles.input} ${styles.inputPasswordPad}`}
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

              <div className={styles.rememberRow}>
                <label className={styles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <a className={styles.forgotLink}>Forgot password?</a>
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
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
