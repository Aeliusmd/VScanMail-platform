"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "../../lib/api/auth";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowLeft, HiOutlineShieldExclamation, HiOutlineCheckCircle } from "react-icons/hi";

export default function RecoverPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [recoveryType, setRecoveryType] = useState<"email" | "code" | null>(null);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your primary account email.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authApi.sendRecoveryOTP(email);
      setOtpSent(true);
      setSuccess("Verification code sent to your backup email address.");
    } catch (err: any) {
      setError(err.message || "Failed to send recovery code. Check that the email is correct and has a backup email configured.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your primary account email.");
      return;
    }
    if (!code) {
      setError("Please enter the recovery code or OTP.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authApi.recoverAccount(email, recoveryType!, code);
      setSuccess("Account recovered successfully! Google Authenticator has been disabled. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Recovery failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setRecoveryType(null);
    setOtpSent(false);
    setCode("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          Account Recovery
        </h2>
        <p className="mt-2 text-sm text-slate-450">
          Recover access to your VScanMail account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-md py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-sm animate-fade-in flex items-start gap-2">
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Step 1: Select Method */}
          {recoveryType === null && (
            <div className="space-y-6 animate-scale-in">
              <div className="text-center">
                <HiOutlineShieldExclamation className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-slate-100">Select Recovery Method</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Choose a backup option below to disable Google Authenticator and log in.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-350">
                  Primary Account Email
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <HiOutlineMail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="company@example.com"
                    className="block w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-650 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => email ? setRecoveryType("email") : setError("Please enter your primary email first.")}
                  className="flex flex-col items-center justify-center p-5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl transition-all text-center group"
                >
                  <HiOutlineMail className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-slate-200">Backup Recovery Email</span>
                  <span className="text-xs text-slate-500 mt-1">Send a verification OTP code to your backup inbox.</span>
                </button>

                <button
                  type="button"
                  onClick={() => email ? setRecoveryType("code") : setError("Please enter your primary email first.")}
                  className="flex flex-col items-center justify-center p-5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl transition-all text-center group"
                >
                  <HiOutlineLockClosed className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-slate-200">Use Recovery Code</span>
                  <span className="text-xs text-slate-500 mt-1">Enter one of the 12-character setup codes.</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-blue-400 hover:underline">
                  Back to login page
                </Link>
              </div>
            </div>
          )}

          {/* Recovery Type: Email */}
          {recoveryType === "email" && (
            <div className="space-y-6 animate-scale-in">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <button type="button" onClick={resetFlow} className="hover:text-white flex items-center gap-1">
                  <HiOutlineArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>

              <div className="text-center">
                <HiOutlineMail className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-slate-100">Recovery Backup Email</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Primary account: <span className="font-semibold text-slate-350">{email}</span>
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white rounded-lg shadow-lg transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Send Recovery OTP"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Enter 6-digit verification code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 123456"
                      className="mt-1.5 block w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg py-2.5 px-3 text-center text-xl font-mono tracking-widest text-white outline-none"
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white rounded-lg shadow-lg transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Verify & Disable Google Authenticator"
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button type="button" onClick={handleSendOtp} disabled={loading} className="text-xs text-blue-400 hover:underline">
                      Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Recovery Type: Code */}
          {recoveryType === "code" && (
            <div className="space-y-6 animate-scale-in">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <button type="button" onClick={resetFlow} className="hover:text-white flex items-center gap-1">
                  <HiOutlineArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>

              <div className="text-center">
                <HiOutlineLockClosed className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-slate-100">Recovery Code Verification</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Enter one of the 12-character recovery codes generated during your Google Authenticator setup.
                </p>
              </div>

              <form onSubmit={handleRecover} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-350">
                    Recovery Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="mt-1.5 block w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg py-2.5 px-3 text-center text-lg font-mono tracking-widest text-white outline-none"
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !code}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white rounded-lg shadow-lg transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Verify & Disable Google Authenticator"
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
