"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/super-admin-dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Mobile / tablet: compact brand strip */}
      <div className="lg:hidden shrink-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-5 sm:py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_#4a6fa5_1px,_transparent_0)] bg-[length:40px_40px]"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/A-4.png" alt="VScan Mail" className="h-9 sm:h-10 object-contain brightness-0 invert max-w-[140px]" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 bg-[#0A3D8F]/25 border border-[#0A3D8F]/35 rounded-full text-blue-200 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
              <i className="ri-shield-star-line mr-1.5 sm:mr-2"></i>
              Super Admin Portal
            </span>
          </div>
        </div>
        <p className="relative z-10 mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
          Highest-level access to manage companies, admins, and all system requests.
        </p>
      </div>

      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_#4a6fa5_1px,_transparent_0)] bg-[length:40px_40px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0A3D8F]/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0A3D8F]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3 mb-16">
            <img src="/images/A-4.png" alt="VScan Mail" className="h-10 object-contain brightness-0 invert" />
          </Link>

          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 bg-[#0A3D8F]/20 border border-[#0A3D8F]/30 rounded-full text-blue-300 text-xs font-semibold tracking-wider uppercase">
              <i className="ri-shield-star-line mr-2"></i>
              Super Admin Portal
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Full System
            <br />
            Control Center
          </h1>
          <p className="text-slate-300 leading-relaxed text-sm">
            Highest-level access to manage companies, admins, and all system requests.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#0A3D8F] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-building-4-line text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 text-sm">Manage All Companies</h3>
              <p className="text-slate-400 text-xs">Oversee every registered company and their activity</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#0A3D8F] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-user-settings-line text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 text-sm">Admin Management</h3>
              <p className="text-slate-400 text-xs">Add, remove, and monitor all admin accounts</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-[#0A3D8F] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-bar-chart-grouped-line text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 text-sm">Full Analytics</h3>
              <p className="text-slate-400 text-xs">System-wide insights across all operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-stretch sm:items-center justify-center px-4 py-6 sm:p-8 bg-slate-50">
        <div className="w-full max-w-md my-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm sm:shadow-none">
            <div className="mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0A3D8F] to-[#083170] rounded-xl flex items-center justify-center mb-4 sm:mb-5">
                <i className="ri-shield-star-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Super Admin Login</h2>
              <p className="text-slate-500 text-xs sm:text-sm">Restricted access - authorised personnel only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-slate-400 text-sm"></i>
                  </div>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent outline-none transition-all text-sm"
                    placeholder="superadmin@vscanmail.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-2-line text-slate-400 text-sm"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D8F] focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                  >
                    <i
                      className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-slate-400 hover:text-slate-600 text-sm`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 border-slate-300 rounded cursor-pointer accent-[#0A3D8F] shrink-0" />
                  <span className="ml-2 text-sm text-slate-600">Keep me signed in</span>
                </label>
                <a href="#" className="text-sm text-[#0A3D8F] hover:text-[#083170] font-medium whitespace-nowrap self-start sm:self-auto">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-70 whitespace-nowrap flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access Control Panel
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6">
              <Link
                href="/login"
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 py-1.5 sm:py-0"
              >
                <i className="ri-admin-line"></i>
                Admin Login
              </Link>
              <Link
                href="/customer-dashboard/login"
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 py-1.5 sm:py-0"
              >
                <i className="ri-user-line"></i>
                Customer Portal
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            <i className="ri-shield-check-line mr-1"></i>
            All access attempts are logged and monitored
          </p>
        </div>
      </div>
    </div>
  );
}
