"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/customer-dashboard/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A3D8F] via-[#0A3D8F] to-[#083170] p-12 flex-col justify-between relative overflow-hidden">
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
          <h2 className="text-4xl font-bold text-white mb-6">Welcome Back to Your Digital Mailroom</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Access your scanned mails and cheques instantly. Manage your documents with ease and efficiency.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <i className="ri-mail-line text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Digital Mail Access</h3>
                <p className="text-blue-100 text-sm">View all your scanned mails with AI-powered summaries</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <i className="ri-bank-card-line text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Cheque Management</h3>
                <p className="text-blue-100 text-sm">Deposit or request pickup for your cheques online</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-check-line text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Secure & Reliable</h3>
                <p className="text-blue-100 text-sm">Bank-grade security for all your documents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-100 text-sm">© 2024 VScan Mail. All rights reserved.</div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/customer-dashboard">
              <img
                src="https://static.readdy.ai/image/306c0f034255580e0c7c21250ba38e98/448654b3ab8dbd6e9a6eacf64f18bab4.png"
                alt="VScan Mail"
                className="h-10 w-auto mx-auto"
              />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Login</h1>
              <p className="text-gray-600">Access your digital mailroom dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    <i className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-gray-400 hover:text-gray-600`}></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember_me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#0A3D8F] border-gray-300 rounded focus:ring-[#0A3D8F] cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#0A3D8F] hover:text-[#083170] whitespace-nowrap">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0A3D8F] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#083170] focus:outline-none focus:ring-2 focus:ring-[#0A3D8F] focus:ring-offset-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Sign In
                <i className="ri-arrow-right-line"></i>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/customer-dashboard/register"
                  className="font-medium text-[#0A3D8F] hover:text-[#083170] whitespace-nowrap"
                >
                  Register your company
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-[#0A3D8F] whitespace-nowrap">
              <i className="ri-admin-line mr-1"></i>
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
