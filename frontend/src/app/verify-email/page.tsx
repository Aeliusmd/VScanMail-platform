"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authApi } from "@/lib/api/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Missing email in verification link.")
      return
    }
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP code.")
      return
    }

    try {
      setLoading(true)
      await authApi.verifyEmail(email, otp.trim())
      router.push("/login")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold text-slate-900">Verify your email</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter the OTP sent to <span className="font-medium">{email}</span>
        </p>

        <div className="mt-5">
          <label className="text-xs text-slate-500">OTP code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
            placeholder="123456"
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
    </div>
  )
}

