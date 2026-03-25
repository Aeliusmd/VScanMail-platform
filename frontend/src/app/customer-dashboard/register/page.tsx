"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    industry: '',
    companyEmail: '',
    companyPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setSubmitStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    const submitData = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'agreeTerms') {
        submitData.append(key, value ? 'Yes' : 'No');
      } else {
        submitData.append(key, String(value));
      }
    });

    try {
      const response = await fetch('https://readdy.ai/api/public/form/submit/customer-register-vscan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: submitData.toString(),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          router.push("/customer-dashboard/dashboard");
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage('Registration failed. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-[#0A3D8F] via-[#0A3D8F] to-[#083170] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
        <Link href="/customer-dashboard">
            <img
              src="\images\A-4.png"
              alt="VScan Mail"
              className="w-[139px] h-[72px] object-contain opacity-100"
            />
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join VScan Mail Today
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            Transform your mail and cheque management with our digital solution. Get started in minutes.
          </p>

          {/* Registration Steps */}
          <div className="space-y-4">
            <div className={`flex items-center gap-4 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 1 ? 'bg-[#0A3D8F]' : 'bg-white/20'}`}>
                {step > 1 ? (
                  <i className="ri-check-line text-white text-xl"></i>
                ) : (
                  <span className="text-white font-semibold">1</span>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">Company Information</h3>
                <p className="text-blue-100 text-sm">Basic company details</p>
              </div>
            </div>

            <div className={`flex items-center gap-4 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 2 ? 'bg-[#0A3D8F]' : 'bg-white/20'}`}>
                {step > 2 ? (
                  <i className="ri-check-line text-white text-xl"></i>
                ) : (
                  <span className="text-white font-semibold">2</span>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">Contact Person</h3>
                <p className="text-blue-100 text-sm">Primary contact details</p>
              </div>
            </div>

            <div className={`flex items-center gap-4 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 3 ? 'bg-[#0A3D8F]' : 'bg-white/20'}`}>
                <span className="text-white font-semibold">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Account Security</h3>
                <p className="text-blue-100 text-sm">Set up your password</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-100 text-sm">
          © 2024 VScan Mail. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <img 
                src="https://static.readdy.ai/image/306c0f034255580e0c7c21250ba38e98/448654b3ab8dbd6e9a6eacf64f18bab4.png" 
                alt="VScan Mail" 
                className="h-10 w-auto mx-auto"
              />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
                <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-[#0A3D8F] h-2 rounded-full transition-all duration-300 ${
                    step === 1
                      ? "w-[33.33%]"
                      : step === 2
                      ? "w-[66.66%]"
                      : "w-full"
                  }`}
                ></div>
              </div>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <i className="ri-checkbox-circle-fill text-green-600 text-xl"></i>
                <span className="text-green-800 text-sm font-medium">
                  Registration successful! Redirecting to your dashboard...
                </span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <i className="ri-error-warning-fill text-red-600 text-xl"></i>
                <span className="text-red-800 text-sm font-medium">{errorMessage}</span>
              </div>
            )}

            <form id="customer-register-form" data-readdy-form onSubmit={handleSubmit}>
              {/* Step 1: Company Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
                    <p className="text-gray-600">Tell us about your company</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="Enter company name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="Company reg. number"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Email *
                      </label>
                      <input
                        type="email"
                        id="companyEmail"
                        name="companyEmail"
                        value={formData.companyEmail}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="company@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Phone *
                      </label>
                      <input
                        type="tel"
                        id="companyPhone"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="123 Business Street"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="City"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="State"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP/Postal Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="12345"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="Country"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#0A3D8F] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#083170] focus:outline-none focus:ring-2 focus:ring-[#0A3D8F] focus:ring-offset-2 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      Next Step
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Person */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Person</h2>
                    <p className="text-gray-600">Primary contact for your account</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <i className="ri-information-line text-[#0A3D8F] text-xl flex-shrink-0 mt-0.5"></i>
                    <p className="text-sm text-blue-900">
                      This person will be the main point of contact for all communications and will have full access to the account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="contactPersonName"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="contactPersonTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        id="contactPersonTitle"
                        name="contactPersonTitle"
                        value={formData.contactPersonTitle}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="e.g., Office Manager, CEO"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="contactPersonEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="contactPersonEmail"
                        name="contactPersonEmail"
                        value={formData.contactPersonEmail}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="john@company.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="contactPersonPhone"
                        name="contactPersonPhone"
                        value={formData.contactPersonPhone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <i className="ri-arrow-left-line"></i>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-[#0A3D8F] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#083170] focus:outline-none focus:ring-2 focus:ring-[#0A3D8F] focus:ring-offset-2 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      Next Step
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Account Security */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Security</h2>
                    <p className="text-gray-600">Create a secure password for your account</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <i className="ri-shield-check-line text-[#0A3D8F] text-xl flex-shrink-0 mt-0.5"></i>
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Password Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>At least 8 characters long</li>
                        <li>Include uppercase and lowercase letters</li>
                        <li>Include at least one number</li>
                        <li>Include at least one special character</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all pr-10"
                          placeholder="Create a strong password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        >
                          <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all pr-10"
                          placeholder="Re-enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        >
                          <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#0A3D8F] border-gray-300 rounded focus:ring-[#0A3D8F] cursor-pointer mt-1"
                          required
                        />
                        <span className="ml-3 text-sm text-gray-600">
                          I agree to the{' '}
                          <a href="#" className="text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap">
                            Terms of Service
                          </a>
                          {' '}and{' '}
                          <a href="#" className="text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap">
                            Privacy Policy
                          </a>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <i className="ri-arrow-left-line"></i>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0A3D8F] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#083170] focus:outline-none focus:ring-2 focus:ring-[#0A3D8F] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Complete Registration
                          <i className="ri-check-line"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
            <Link href="/customer-dashboard/login" className="font-medium text-[#0A3D8F] hover:text-[#083170] whitespace-nowrap">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
