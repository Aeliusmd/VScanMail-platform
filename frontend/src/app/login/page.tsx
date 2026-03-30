"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import styles from "./login.module.css"
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2"

export default function LoginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(email, password, remember)
  }

  return (

    <div className={styles.page}>

      {/* MOBILE TOP IMAGE */}
      <div className={styles.mobileTopImage}>
        <Image
          src="/images/Mask group.png"
          alt="VScan Mail"
          width={500}
          height={300}
          className="w-full h-auto md:hidden"
        />
      </div>

      {/* LEFT SIDE */}

      <div className={styles.leftSide}>

        <div className={styles.leftCard}>

          <h1 className={styles.leftTitle}>
            Sign in Account
          </h1>

          <p className={styles.leftSubtitle}>
            Fill the details to sign in the account
          </p>

          <img
            src="/images/signin.png"
            alt="VScan Mail Illustration"
            className={styles.leftImage}
          />

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className={styles.rightSide}>

        <div className={styles.formContainer}>

          <div className={styles.formCard}>

            {/* Header */}

            <div className={styles.header}>

              <h2 className={styles.heading}>
                Company Login
              </h2>

              <p className={styles.subheading}>
                Access your digital mailroom dashboard
              </p>

            </div>


            <form onSubmit={handleSubmit} className={styles.form}>

              {/* EMAIL */}

              <div className={styles.fieldGroup}>

                <label className={styles.label}>
                  Company Email
                </label>

                <div className={styles.inputWrapper}>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="company@example.com"
                    className={styles.input}
                  />

                  <span className={styles.inputIcon}><span className={styles.inputIconGlyph}><HiOutlineEnvelope /></span></span>

                </div>

              </div>


              {/* PASSWORD */}

              <div className={styles.fieldGroup}>

                <label className={styles.label}>
                  Password
                </label>

                <div className={styles.inputWrapper}>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`${styles.input} ${styles.inputPasswordPad}`}
                  />

                  <span className={styles.inputIcon}><span className={styles.inputIconGlyph}><HiOutlineLockClosed /></span></span>

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


              {/* REMEMBER */}

              <div className={styles.rememberRow}>

                <label className={styles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>

                <a className={styles.forgotLink}>
                  Forgot password?
                </a>

              </div>


              {/* BUTTON */}

              <button
                type="submit"
                className={styles.submitButton}
              >
                Sign In
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


