"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi } from "../../lib/api/auth";
import styles from "./login.module.css";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials. Please try again.");
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
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
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
