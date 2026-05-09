"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi } from "../../lib/api/auth";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

type Step = "email" | "otp" | "password" | "done";

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Fair", color: "#f59e0b" };
  if (score === 3) return { score: 3, label: "Good", color: "#3b82f6" };
  return { score: 4, label: "Strong", color: "#22c55e" };
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Request OTP ──────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setResendCooldown(60);
      setStep("otp");
    } catch {
      // Always succeed on the frontend — no email enumeration
      setResendCooldown(60);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      // Light pre-check: if the code is completely wrong the reset-password
      // endpoint will reject it anyway. We proceed to the password step to
      // give the best UX (fewer round trips).
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set new password ─────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), otp.join(""), newPassword);
      setStep("done");
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setError("Your code was invalid or expired. Please request a new one.");
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
    } catch { /* silent */ } finally {
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      setLoading(false);
    }
  };

  const strength = getStrength(newPassword);

  // ── Shared left panel ────────────────────────────────────────────────────
  const LeftPanel = (
    <div className="hidden md:flex w-[420px] shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[#0A3D8F] to-[#0d4fbd] p-10 text-white">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
        <HiOutlineLockClosed className="text-3xl text-white" />
      </div>
      <h2 className="mb-3 text-center text-2xl font-bold leading-tight">
        Account Security
      </h2>
      <p className="mb-8 text-center text-sm text-blue-200 leading-relaxed">
        Verify your identity with a one-time code sent to your registered email address.
      </p>
      <div className="w-full space-y-3">
        {[
          { num: "1", text: "Enter your company email" },
          { num: "2", text: "Enter the 6-digit code" },
          { num: "3", text: "Create your new password" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {s.num}
            </span>
            <span className="text-sm text-blue-100">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step renderers ───────────────────────────────────────────────────────
  const renderEmail = () => (
    <form onSubmit={handleSendCode} className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your company email and we&apos;ll send you a verification code.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0 text-base">⚠</span>
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Company Email</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="company@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A3D8F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
          />
          <HiOutlineEnvelope className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d4fbd] disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending code…
          </>
        ) : (
          "Send Verification Code"
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-[#0A3D8F] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );

  const renderOtp = () => (
    <form onSubmit={handleVerifyOtp} className="w-full space-y-5">
      <div>
        <button
          type="button"
          onClick={() => { setStep("email"); setError(""); }}
          className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <HiOutlineArrowLeft className="text-base" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0 text-base">⚠</span>
          {error}
        </div>
      )}

      {/* 6-digit OTP boxes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Verification Code</label>
        <div className="flex gap-2.5" onPaste={handleOtpPaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className={`h-14 w-full rounded-xl border text-center text-xl font-bold transition focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/20 ${
                digit
                  ? "border-[#0A3D8F] bg-[#eff6ff] text-[#0A3D8F]"
                  : "border-gray-200 bg-gray-50 text-gray-900"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || otp.join("").length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d4fbd] disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Verifying…
          </>
        ) : (
          "Verify Code"
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
          className="font-semibold text-[#0A3D8F] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );

  const renderPassword = () => (
    <form onSubmit={handleResetPassword} className="w-full space-y-5">
      <div>
        <button
          type="button"
          onClick={() => { setStep("otp"); setError(""); setNewPassword(""); setConfirmPassword(""); }}
          className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <HiOutlineArrowLeft className="text-base" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0 text-base">⚠</span>
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A3D8F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {newPassword && (
              <span className="text-xs font-semibold" style={{ color: strength.color }}>
                {strength.label}
              </span>
            )}
            <button type="button" onClick={() => setShowNew(!showNew)} className="text-gray-400 hover:text-gray-600">
              {showNew ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
            </button>
          </div>
        </div>
        {newPassword && (
          <div className="flex gap-1 pt-0.5">
            {[1, 2, 3, 4].map((lvl) => (
              <div
                key={lvl}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: strength.score >= lvl ? strength.color : "#e5e7eb",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/20 ${
              confirmPassword && confirmPassword !== newPassword
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-[#0A3D8F] focus:bg-white"
            }`}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirm ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
          </button>
        </div>
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d4fbd] disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Resetting password…
          </>
        ) : (
          "Reset Password"
        )}
      </button>
    </form>
  );

  const renderDone = () => (
    <div className="w-full space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <HiOutlineCheckCircle className="text-5xl text-green-500" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Password reset!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d4fbd]"
      >
        Back to Sign In
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile top image */}
      <div className="absolute inset-x-0 top-0 md:hidden">
        <Image
          src="/images/Mask group.png"
          alt="VScanMail"
          width={500}
          height={120}
          className="h-32 w-full object-cover"
        />
      </div>

      {LeftPanel}

      {/* Right side */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-16 md:py-8">
        {/* Logo */}
        <div className="mb-8 md:mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A3D8F]">
              <span className="text-sm font-black text-white">V</span>
            </div>
            <span className="text-lg font-bold text-gray-900">VScanMail</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Step indicator */}
          {step !== "done" && (
            <div className="mb-6 flex items-center gap-1.5">
              {(["email", "otp", "password"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step === s
                        ? "bg-[#0A3D8F] text-white"
                        : (["otp", "password"] as string[]).indexOf(step) > i
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {(["otp", "password"] as string[]).indexOf(step) > i ? "✓" : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-0.5 w-8 rounded-full transition-all ${
                        (["otp", "password"] as string[]).indexOf(step) > i ? "bg-green-500" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === "email" && renderEmail()}
          {step === "otp" && renderOtp()}
          {step === "password" && renderPassword()}
          {step === "done" && renderDone()}
        </div>
      </div>
    </div>
  );
}
