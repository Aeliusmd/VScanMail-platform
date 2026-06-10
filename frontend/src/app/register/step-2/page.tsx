"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HiArrowRight, HiArrowLeft } from "react-icons/hi2";
import { HiInformationCircle } from "react-icons/hi2";
import styles from "./register-step2.module.css";
import { EMAIL_RE, PHONE_RE, PHONE_ERROR_MSG, EMAIL_ERROR_MSG } from "@/lib/validation";

export default function RegisterStep2() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    emailAddress: "",
    phoneNumber: "",
  });
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const step1Data = localStorage.getItem("registerStep1");
    if (!step1Data) {
      router.push("/register");
    }
  }, [router]);

  useEffect(() => {
    const raw = localStorage.getItem("registerStep2");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setFormData(parsed);
      }
    } catch {
      // ignore invalid storage payload
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "emailAddress") {
      setEmailError(value && !EMAIL_RE.test(value) ? EMAIL_ERROR_MSG : "");
    }
    if (name === "phoneNumber") {
      setPhoneError(value && !PHONE_RE.test(value) ? PHONE_ERROR_MSG : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.emailAddress && !EMAIL_RE.test(formData.emailAddress)) {
      setEmailError(EMAIL_ERROR_MSG);
      return;
    }
    if (formData.phoneNumber && !PHONE_RE.test(formData.phoneNumber)) {
      setPhoneError(PHONE_ERROR_MSG);
      return;
    }
    localStorage.setItem("registerStep2", JSON.stringify(formData));
    router.push("/register/step-3");
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
              <span className={styles.progressLabel}>Step 2 of 3</span>
              <span className={styles.progressLabel}>67% Complete</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>

          <div className={styles.header}>
            <h2 className={styles.heading}>Contact Person</h2>
            <p className={styles.subheading}>Primary contact for your account</p>
          </div>

          <div className={styles.infoBanner}>
            <HiInformationCircle className={styles.infoIcon} />
            <p className={styles.infoText}>
              This person will be the main point of contact for all communications and will have full access to the
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="jobTitle" className={styles.label}>
                Job Title <span className={styles.required}>*</span>
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g., Office Manager, CEO"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="emailAddress" className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  id="emailAddress"
                  name="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className={`${styles.input} ${emailError ? styles.inputError : ""}`}
                  required
                />
                {emailError && <p className={styles.fieldError}>{emailError}</p>}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="phoneNumber" className={styles.label}>
                  Phone Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`${styles.input} ${phoneError ? styles.inputError : ""}`}
                  required
                />
                {phoneError && <p className={styles.fieldError}>{phoneError}</p>}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={() => router.push("/register")} className={styles.backButton}>
                <HiArrowLeft /> Back
              </button>
              <button type="submit" className={styles.submitButton}>
                Next Step <HiArrowRight />
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
