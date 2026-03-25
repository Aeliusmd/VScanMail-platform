

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return <LandingPage />;
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-white ${styles.landingRoot}`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FFFFFFF2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/images/A-4.png"
                alt="VScanMail"
                className="w-[139px] h-[72px] object-contain opacity-100"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-slate-700 hover:text-blue-600"
                }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-slate-700 hover:text-blue-600"
                }`}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-slate-700 hover:text-blue-600"
                }`}
              >
                Pricing
              </a>
              <Link
                href="/customer-dashboard/login"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled ? "text-slate-600 hover:text-blue-600" : "text-slate-700 hover:text-blue-600"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/customer-dashboard/register"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-slate-700 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <i className={`text-2xl ${mobileMenuOpen ? "ri-close-line" : "ri-menu-line"}`}></i>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-slate-700">
              Features
            </a>
            <a href="#how-it-works" className="block text-sm font-medium text-slate-700">
              How It Works
            </a>
            <a href="#pricing" className="block text-sm font-medium text-slate-700">
              Pricing
            </a>
            <Link href="/customer-dashboard/login" className="block text-sm font-medium text-slate-700">
              Sign In
            </Link>
            <Link
              href="/customer-dashboard/register"
              className="block w-full text-center bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-0 overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-red-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-blue-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-red-200/30 to-red-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div className="space-y-7 pb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                AI-Powered Document Management
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1]">
                Digitize Your
                <br />
                <span className="text-blue-600">Mail & Cheques</span>
                <br />
                Instantly
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                VScan Mail revolutionizes how businesses handle physical mail and cheques. AI-powered scanning that
                automatically processes, summarizes, and delivers your documents digitally.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/customer-dashboard/register"
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all whitespace-nowrap text-sm"
                >
                  Start Free Trial <i className="ri-arrow-right-line ml-1"></i>
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-white text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap text-sm"
                >
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-10 pt-2">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">10K+</div>
                  <div className="text-xs text-slate-500 font-medium">Documents Scanned</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">500+</div>
                  <div className="text-xs text-slate-500 font-medium">Active Companies</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">99.9%</div>
                  <div className="text-xs text-slate-500 font-medium">Accuracy Rate</div>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center items-end isolate">
              <img
                src="/images/IMG-60.png"
                alt="Mail scanning illustration"
                className="w-full max-w-lg object-contain object-bottom mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Trusted by leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-50">
            {["Acme Corp", "FinGroup", "TechNova", "StartFund", "MetroBank", "LegalEdge"].map((name) => (
              <span key={name} className="text-slate-600 font-bold text-sm tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold mb-4">
              Features
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              Powerful tools to modernize your mail and cheque operations from one place
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "ri-scan-2-line",
                title: "AI-Powered Scanning",
                desc: "Automatically identifies and processes mails and cheques with advanced OCR and AI recognition technology.",
                color: "bg-blue-600",
                bg: "from-blue-50 to-blue-100/40",
              },
              {
                icon: "ri-mail-open-line",
                title: "Smart Mail Summaries",
                desc: "Get AI-generated summaries of your mail content delivered instantly to your email for quick review.",
                color: "bg-red-600",
                bg: "from-red-50 to-red-100/40",
              },
              {
                icon: "ri-bank-card-line",
                title: "Cheque Management",
                desc: "View scanned cheques and choose to deposit directly to your bank account or request physical pickup.",
                color: "bg-blue-700",
                bg: "from-blue-50 to-slate-100/60",
              },
              {
                icon: "ri-shield-check-line",
                title: "Secure & Compliant",
                desc: "Bank-level security with encrypted storage and full compliance with financial regulations.",
                color: "bg-red-500",
                bg: "from-red-50 to-rose-100/40",
              },
              {
                icon: "ri-notification-3-line",
                title: "Real-Time Notifications",
                desc: "Receive instant email notifications when new mail or cheques arrive for your company.",
                color: "bg-blue-500",
                bg: "from-blue-50 to-sky-100/40",
              },
              {
                icon: "ri-dashboard-line",
                title: "Intuitive Dashboard",
                desc: "Manage all your documents from a clean, user-friendly dashboard with powerful search and filters.",
                color: "bg-red-700",
                bg: "from-red-50 to-red-100/30",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`p-7 bg-gradient-to-br ${f.bg} rounded-2xl hover:-translate-y-1 transition-all duration-200 cursor-default`}
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-5`}>
                  <i className={`${f.icon} text-xl text-white`}></i>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
              Process
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">How VScan Mail Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Simple 4-step process to digitize and manage your physical documents
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://readdy.ai/api/search-image?query=flat%20vector%20illustration%20showing%20a%20complete%20mail%20processing%20workflow%20with%20envelopes%20going%20through%20a%20digital%20scanner%20machine%20then%20transforming%20into%20digital%20files%20on%20a%20computer%20screen%20with%20arrows%20showing%20the%20flow%20AI%20brain%20icon%20processing%20documents%20and%20blue%20red%20checkmarks%20showing%20completion%20steps%20bright%20colorful%20navy%20blue%20and%20vivid%20red%20colors%20on%20light%20background%20modern%202D%20illustration%20style&width=620&height=500&seq=howitworks_blue_red_2&orientation=landscape"
                alt="How VScan Mail works illustration"
                className="w-full rounded-3xl object-contain"
              />
            </div>
            <div className="space-y-6">
              {[
                {
                  num: "01",
                  title: "Mail Arrives at Our Facility",
                  desc: "Your physical mail and cheques are received at our secure processing center, sorted and prepped for scanning.",
                  color: "text-blue-600",
                  border: "border-blue-200",
                  bg: "bg-blue-50",
                },
                {
                  num: "02",
                  title: "AI-Powered Scanning",
                  desc: "Our system scans front, back and document content separately — identifying type, sender, and key data automatically.",
                  color: "text-red-600",
                  border: "border-red-200",
                  bg: "bg-red-50",
                },
                {
                  num: "03",
                  title: "Instant Digital Delivery",
                  desc: "Scanned documents with AI summaries are sent to your email and dashboard in minutes.",
                  color: "text-blue-700",
                  border: "border-blue-200",
                  bg: "bg-blue-50",
                },
                {
                  num: "04",
                  title: "Take Action",
                  desc: "Request delivery, deposit cheques to your bank, or archive everything — all from your dashboard.",
                  color: "text-red-600",
                  border: "border-red-200",
                  bg: "bg-red-50",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`flex items-start gap-5 p-5 ${step.bg} border ${step.border} rounded-2xl`}
                >
                  <div className={`flex-shrink-0 text-2xl font-extrabold ${step.color} w-10`}>{step.num}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feature Highlight */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Mail Management
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Never Miss an Important
                <br />
                <span className="text-blue-600">Letter or Notice</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Every envelope is opened, scanned in full detail — front, back, and contents — then delivered to your inbox
                with a smart AI summary so you know what matters instantly.
              </p>
              <ul className="space-y-3">
                {[
                  "Full 3-part scan: front, back & inside content",
                  "AI summary highlighting key action items",
                  "Instant email + dashboard notification",
                  "Archive, forward, or flag for follow-up",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-check-line text-blue-600 text-xs"></i>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=flat%20vector%20illustration%20of%20digital%20mail%20management%20dashboard%20with%20colorful%20envelope%20icons%20letters%20and%20documents%20displayed%20on%20a%20modern%20computer%20interface%20with%20notification%20bubbles%20summary%20cards%20and%20blue%20checkmarks%20showing%20organized%20inbox%20categorized%20mail%20types%20and%20unread%20badges%20bright%20clean%20navy%20blue%20and%20white%20color%20palette%20with%20red%20accent%20highlights%202D%20illustration%20style&width=600&height=480&seq=mail_blue_red_3&orientation=landscape"
                alt="Mail management illustration"
                className="w-full rounded-3xl object-contain"
              />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl"></div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <img
                src="https://readdy.ai/api/search-image?query=flat%20vector%20illustration%20of%20a%20modern%20cheque%20processing%20system%20with%20colorful%20cheque%20documents%20being%20scanned%20and%20categorized%20bank%20icons%20deposit%20arrows%20and%20digital%20bank%20account%20interface%20showing%20successful%20deposit%20confirmations%20with%20vivid%20red%20and%20navy%20blue%20color%20scheme%20clean%202D%20digital%20illustration%20style%20with%20simple%20shapes%20and%20bold%20colors&width=600&height=480&seq=cheque_blue_red_4&orientation=landscape"
                alt="Cheque management illustration"
                className="w-full rounded-3xl object-contain"
              />
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-red-200/40 rounded-full blur-2xl"></div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                Cheque Processing
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Deposit Cheques Without
                <br />
                <span className="text-red-600">Visiting the Bank</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We scan your cheques with full detail and give you two options — request a digital bank deposit to your saved
                account, or schedule a physical pickup. Fast, easy, secure.
              </p>
              <ul className="space-y-3">
                {[
                  "High-res front & back cheque scanning",
                  "One-click deposit to saved bank accounts",
                  "Physical pickup scheduling",
                  "Full audit trail and history",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-check-line text-red-600 text-xs"></i>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold mb-4">
              Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Choose the plan that fits your business needs — no hidden fees
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:-translate-y-1 transition-all duration-200">
              <div className="mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                  <i className="ri-seedling-line text-slate-600 text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                <p className="text-slate-400 text-xs mt-1">Perfect for small businesses</p>
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-6">
                $49<span className="text-base text-slate-400 font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Up to 100 scans/month", "AI mail summaries", "Email notifications", "Basic support"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <i className="ri-check-line text-blue-500"></i> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/customer-dashboard/register"
                className="block w-full py-3 text-center bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-xl shadow-blue-200 relative -translate-y-3">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                Most Popular
              </div>
              <div className="mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <i className="ri-rocket-line text-white text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-white">Professional</h3>
                <p className="text-white/70 text-xs mt-1">For growing companies</p>
              </div>
              <div className="text-4xl font-extrabold text-white mb-6">
                $149<span className="text-base text-white/60 font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 500 scans/month",
                  "AI mail summaries",
                  "Priority notifications",
                  "Cheque deposit service",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white">
                    <i className="ri-check-line text-red-300"></i> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/customer-dashboard/register"
                className="block w-full py-3 text-center bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:-translate-y-1 transition-all duration-200">
              <div className="mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                  <i className="ri-building-2-line text-slate-600 text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
                <p className="text-slate-400 text-xs mt-1">For large organizations</p>
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-6">Custom</div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited scans",
                  "Advanced AI features",
                  "Custom integrations",
                  "Dedicated account manager",
                  "24/7 premium support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <i className="ri-check-line text-blue-500"></i> {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="block w-full py-3 text-center bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm whitespace-nowrap"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
              Testimonials
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900">Loved by Businesses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Mitchell",
                role: "CFO at FinGroup Ltd",
                quote:
                  "VScan Mail has completely eliminated our physical mail backlog. We deposit cheques the same day they arrive — it's been a game changer.",
                avatar: "SM",
                color: "bg-blue-600",
              },
              {
                name: "David Osei",
                role: "Operations Manager at TechNova",
                quote:
                  "The AI summaries are incredibly accurate. I can action 20 letters in the time it used to take me to read 3. Absolutely worth every penny.",
                avatar: "DO",
                color: "bg-red-600",
              },
              {
                name: "Priya Sharma",
                role: "MD at LegalEdge Partners",
                quote:
                  "Security was our biggest concern. VScan Mail's compliance features ticked every box our legal team needed. Highly recommended.",
                avatar: "PS",
                color: "bg-blue-700",
              },
            ].map((t) => (
              <div key={t.name} className="p-7 bg-slate-50 rounded-2xl">
                <div className="flex text-red-500 text-sm mb-4">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="ri-star-fill"></i>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6">
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="contact"
        className="py-24 px-6 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to Transform Your
                <br />
                Mail Management?
              </h2>
              <p className="text-white/80 mb-8 text-base leading-relaxed">
                Join hundreds of companies already using VScan Mail to streamline their operations and cut admin time by 80%.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/customer-dashboard/select-plan"
                  className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-all whitespace-nowrap text-sm"
                >
                  Start Free Trial <i className="ri-arrow-right-line ml-1"></i>
                </Link>
                <a
                  href="mailto:sales@vscanmail.com"
                  className="px-8 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all whitespace-nowrap text-sm"
                >
                  Contact Sales <i className="ri-mail-line ml-1"></i>
                </a>
              </div>
            </div>
            <div>
              <img
                src="https://readdy.ai/api/search-image?query=flat%20vector%20illustration%20of%20a%20happy%20business%20team%20celebrating%20successful%20digital%20transformation%20with%20envelopes%20floating%20upward%20transforming%20into%20digital%20files%20green%20checkmarks%20success%20icons%20and%20confetti%20in%20bright%20navy%20blue%20and%20vivid%20red%20white%20color%20scheme%20modern%202D%20illustration%20style%20clean%20simple%20shapes%20bold%20outlines%20joyful%20productive%20team%20scene&width=560&height=420&seq=cta_blue_red_5&orientation=landscape"
                alt="Success illustration"
                className="w-full rounded-3xl object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FFFFFFF2] text-slate-500 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/images/icon.jpg" alt="VScanMail" className="w-[72px] h-[72px] object-contain" />
              </div>
              <p className="text-xs leading-relaxed">
                Revolutionizing mail and cheque management with AI-powered scanning technology for modern businesses.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="#"
                  aria-label="Twitter/X"
                  className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <i className="ri-twitter-x-line text-sm"></i>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <i className="ri-linkedin-fill text-sm"></i>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <i className="ri-instagram-line text-sm"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-slate-700 font-bold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-blue-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-blue-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <Link href="/customer-dashboard/register" className="hover:text-blue-600 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-700 font-bold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-blue-600 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-700 font-bold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs">&copy; 2025 VScan Mail. All rights reserved.</p>
            <p className="text-xs mt-2 md:mt-0">Made with care for modern businesses</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

