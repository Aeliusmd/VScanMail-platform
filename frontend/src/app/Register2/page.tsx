"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HiArrowRight, HiArrowLeft } from 'react-icons/hi2'
import { HiInformationCircle } from 'react-icons/hi2'
import styles from './register2.module.css'

export default function RegisterStep2() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    emailAddress: '',
    phoneNumber: '',
  })

  useEffect(() => {
    const step1Data = localStorage.getItem('registerStep1')
    if (!step1Data) {
      router.push('/register1')
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('registerStep2', JSON.stringify(formData))
    router.push('/Register3')
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

      {/* RIGHT SIDE */}
      <div className={styles.rightSide}>
        <div className={styles.formCard}>

          {/* Progress */}
          <div className={styles.progressWrapper}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Step 2 of 3</span>
              <span className={styles.progressLabel}>67% Complete</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.heading}>Contact Person</h2>
            <p className={styles.subheading}>Primary contact for your account</p>
          </div>

          {/* Info Banner */}
          <div className={styles.infoBanner}>
            <HiInformationCircle className={styles.infoIcon} />
            <p className={styles.infoText}>
              This person will be the main point of contact for all communications and will have full access to the account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>

            {/* Full Name */}
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

            {/* Job Title */}
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

            {/* Email & Phone */}
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
                  className={styles.input}
                  required
                />
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
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.buttonRow}>
              <button type="button" onClick={() => router.push('/register1')} className={styles.backButton}>
                <HiArrowLeft /> Back
              </button>
              <button type="submit" className={styles.submitButton}>
                Next Step <HiArrowRight />
              </button>
            </div>

          </form>

          {/* Sign In Link */}
          <div className={styles.signInText}>
            Already have an account?
            <Link href="/login" className={styles.signInLink}>Sign in here</Link>
          </div>

        </div>
      </div>

    </div>
  )
}
