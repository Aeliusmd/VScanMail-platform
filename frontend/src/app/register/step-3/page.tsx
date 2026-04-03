"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiCheck, HiShieldCheck } from "react-icons/hi2";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import styles from "./register-step3.module.css";

const passwordRequirements = [
  { label: "At least 8 characters long", test: (p: string) => p.length >= 8 },
  { label: "Include uppercase and lowercase letters", test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { label: "Include at least one number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Include at least one special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterStep3() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});

  useEffect(() => {
    const step2Data = localStorage.getItem("registerStep2");
    if (!step2Data) router.push("/register/step-2");
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: undefined });
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!passwordRequirements.every((r) => r.test(formData.password)))
      newErrors.password = "Password does not meet all requirements.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the Terms of Service and Privacy Policy.";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const step1 = JSON.parse(localStorage.getItem("registerStep1") || "{}");
    const step2 = JSON.parse(localStorage.getItem("registerStep2") || "{}");
    console.log("Registration complete:", { ...step1, ...step2, password: formData.password });
    localStorage.removeItem("registerStep1");
    localStorage.removeItem("registerStep2");
    router.push("/login");
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
          <h1 className={styles.leftTitle}>Sign up Account</h1>
          <p className={styles.leftSubtitle}>Enter your personal data to create your account</p>
          <Image
            src="/images/signup.png"
            alt="VScan Mail Illustration"
            className={styles.leftImage}
            width={576}
            height={864}
          />
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.formCard}>
          <div className={styles.progressWrapper}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Step 3 of 3</span>
              <span className={styles.progressLabel}>100% Complete</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>

          <div className={styles.header}>
            <h2 className={styles.heading}>Account Security</h2>
            <p className={styles.subheading}>Create a secure password for your account</p>
          </div>

          <div className={styles.requirementsBanner}>
            <HiShieldCheck className={styles.requirementsIcon} />
            <div className={styles.requirementsContent}>
              <p className={styles.requirementsTitle}>Password Requirements:</p>
              <ul className={styles.requirementsList}>
                {passwordRequirements.map((req, idx) => {
                  const met = formData.password.length > 0 && req.test(formData.password);
                  return (
                    <li key={idx} className={`${styles.requirementItem} ${met ? styles.met : ""}`}>
                      <span className={`${styles.requirementDot} ${met ? styles.met : ""}`} />
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  required
                />
                <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                </button>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className={styles.termsCheckbox}
                />
                <span className={styles.termsText}>
                  I agree to the{" "}
                  <a href="#" className={styles.termsLink}>
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className={styles.termsLink}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeTerms && <p className={styles.errorText}>{errors.agreeTerms}</p>}
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={() => router.push("/register/step-2")} className={styles.backButton}>
                <HiArrowLeft /> Back
              </button>
              <button type="submit" className={styles.submitButton}>
                Complete Registration <HiCheck />
              </button>
            </div>
          </form>

          <div className={styles.signInText}>
            Already have an account?
            <Link href="/login" className={styles.signInLink}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
