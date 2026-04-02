"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HiArrowRight } from 'react-icons/hi2'
import styles from './register1.module.css'

export default function RegisterStep1() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    industry: '',
    companyEmail: '',
    companyPhone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('registerStep1', JSON.stringify(formData))
    router.push('/Register2')
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
              <span className={styles.progressLabel}>Step 1 of 3</span>
              <span className={styles.progressLabel}>33% Complete</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.heading}>Company Information</h2>
            <p className={styles.subheading}>Tell us about your company</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>

            {/* Company Name */}
            <div className={styles.fieldGroup}>
              <label htmlFor="companyName" className={styles.label}>
                Company Name <span className={styles.required}>*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className={styles.input}
                required
              />
            </div>

            {/* Registration Number & Industry */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="registrationNumber" className={styles.label}>
                  Registration Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="Company reg. number"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="industry" className={styles.label}>
                  Industry <span className={styles.required}>*</span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Company Email & Phone */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="companyEmail" className={styles.label}>
                  Company Email <span className={styles.required}>*</span>
                </label>
                <input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="companyPhone" className={styles.label}>
                  Company Phone <span className={styles.required}>*</span>
                </label>
                <input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Street Address */}
            <div className={styles.fieldGroup}>
              <label htmlFor="streetAddress" className={styles.label}>
                Street Address <span className={styles.required}>*</span>
              </label>
              <input
                id="streetAddress"
                name="streetAddress"
                type="text"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="123 Business Street"
                className={styles.input}
                required
              />
            </div>

            {/* City & State */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="city" className={styles.label}>
                  City <span className={styles.required}>*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="state" className={styles.label}>
                  State/Province <span className={styles.required}>*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* ZIP & Country */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="zipCode" className={styles.label}>
                  ZIP / Postal Code <span className={styles.required}>*</span>
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="country" className={styles.label}>
                  Country <span className={styles.required}>*</span>
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <div className={styles.submitRow}>
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
