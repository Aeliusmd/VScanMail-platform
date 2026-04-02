"use client";

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2"
import { authApi } from "@/lib/api/auth"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      setIsLoading(true)
      const res = await authApi.login(email, password)
      
      // Store session and user info
      if (res.session?.access_token) {
        window.localStorage.setItem("vscanmail_token", res.session.access_token)
      } else if (res.session?.accessToken) {
        window.localStorage.setItem("vscanmail_token", res.session.accessToken)
      }
      
      window.localStorage.setItem("vscanmail_user", JSON.stringify(res.user))

      // Dynamic Role-Based Routing
      const role = res.user.role
      if (role === "super_admin") {
        router.push("/super-admin-dashboard")
      } else if (role === "admin") {
        router.push("/superadmin/dashboard")
      } else {
        router.push("/customer-dashboard/dashboard")
      }
    } catch (err: any) {
      setError(err?.details?.error || err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.mobileTopImage}>
        <Image src="/images/Mask group.png" alt="VScan Mail" width={500} height={300} className="w-full h-auto md:hidden" />
      </div>
      <div className={styles.leftSide}>
        <div className={styles.leftCard}>
          <h1 className={styles.leftTitle}>Sign in Account</h1>
          <p className={styles.leftSubtitle}>Fill the details to sign in the account</p>
          <img src="/images/signin.png" alt="Illustration" className={styles.leftImage} />
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
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@vscanmail.com" className={styles.input} />
                  <span className={styles.inputIcon}><span className={styles.inputIconGlyph}><HiOutlineEnvelope /></span></span>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className={`${styles.input} ${styles.inputPasswordPad}`} />
                  <span className={styles.inputIcon}><span className={styles.inputIconGlyph}><HiOutlineLockClosed /></span></span>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                    <span className={styles.eyeIcon}>{showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}</span>
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
                  {error}
                </div>
              )}

              <div className={styles.rememberRow}>
                <label className={styles.rememberLabel}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
                </label>
                <a className={styles.forgotLink}>Forgot password?</a>
              </div>
              
              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>



              {/* REGISTER */}

              <p className={styles.registerText}>
                Don&apos;t have an account?
                <Link
                  href="/register1"
                  className={styles.registerLink}
                >
                  Register your company
                </Link>
              </p>


              {/* TERMS */}

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

  )

}


