/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    tagline: 'Perfect for small businesses',
    icon: 'ri-seedling-line',
    color: 'blue',
    features: [
      'Up to 100 scans/month',
      'AI mail summaries',
      'Email notifications',
      'Dashboard access',
      'Basic support',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149',
    period: '/mo',
    tagline: 'For growing companies',
    icon: 'ri-rocket-line',
    color: 'featured',
    features: [
      'Up to 500 scans/month',
      'AI mail summaries',
      'Priority notifications',
      'Cheque deposit service',
      'Advanced dashboard',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For large organizations',
    icon: 'ri-building-2-line',
    color: 'red',
    features: [
      'Unlimited scans',
      'Advanced AI features',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      '24/7 premium support',
    ],
    popular: false,
  },
];

export default function SelectPlan() {
  const router = useRouter();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@vscanmail.com';
      return;
    }
    router.push(`/register1?plan=${encodeURIComponent(planId)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-red-50 flex flex-col">

      {/* Top bar */}
      <header className="w-full px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/images/A-4.png"
            alt="VScanMail"
            className="w-auto h-full object-contain opacity-100"
          />
          
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Already have an account?</span>
          <Link
            href="/customer/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            <i className="ri-login-box-line"></i>
            Sign In
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Headline */}
        <div className="text-center mb-12 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Step 1 of 2 — Choose Your Plan
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 leading-tight">
            Select a Subscription Plan
          </h1>
          <p className="text-slate-500 text-base">
            Pick the plan that fits your business. You can always upgrade later.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isFeatured = plan.color === 'featured';
            const isHovered = hoveredPlan === plan.id;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative flex flex-col rounded-3xl transition-all duration-300 cursor-default
                  ${isFeatured
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-200 -translate-y-3'
                    : `bg-white border ${isHovered ? '-translate-y-2' : ''} border-slate-200`
                  }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Icon + name */}
                  <div className="mb-6">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4
                        ${isFeatured ? 'bg-white/20' : plan.color === 'red' ? 'bg-red-50' : 'bg-blue-50'}`}
                    >
                      <i
                        className={`${plan.icon} text-xl
                          ${isFeatured ? 'text-white' : plan.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}
                      ></i>
                    </div>
                    <h2
                      className={`text-lg font-bold mb-0.5 ${isFeatured ? 'text-white' : 'text-slate-900'}`}
                    >
                      {plan.name}
                    </h2>
                    <p className={`text-xs ${isFeatured ? 'text-white/70' : 'text-slate-400'}`}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span
                      className={`text-4xl font-extrabold ${isFeatured ? 'text-white' : 'text-slate-900'}`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={`text-sm font-normal ml-1 ${isFeatured ? 'text-white/60' : 'text-slate-400'}`}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                            ${isFeatured ? 'bg-white/20' : plan.color === 'red' ? 'bg-red-100' : 'bg-blue-100'}`}
                        >
                          <i
                            className={`ri-check-line text-xs
                              ${isFeatured ? 'text-white' : plan.color === 'red' ? 'text-red-500' : 'text-blue-600'}`}
                          ></i>
                        </div>
                        <span className={isFeatured ? 'text-white' : 'text-slate-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap
                      ${isFeatured
                        ? 'bg-white text-blue-700 hover:bg-blue-50'
                        : plan.color === 'red'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {plan.id === 'enterprise' ? (
                      <>Contact Sales <i className="ri-mail-line ml-1"></i></>
                    ) : (
                      <>Get Started <i className="ri-arrow-right-line ml-1"></i></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom login nudge */}
        <div className="mt-10 flex items-center gap-3">
          <div className="h-px w-16 bg-slate-200"></div>
          <p className="text-sm text-slate-500">
            Already a member?{' '}
            <Link
              href="/customer/login"
              className="text-blue-600 font-semibold hover:underline whitespace-nowrap"
            >
              Sign in to your account
            </Link>
          </p>
          <div className="h-px w-16 bg-slate-200"></div>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex items-center gap-6 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5">
            <i className="ri-shield-check-line text-sm"></i>
            <span>Bank-level encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <i className="ri-time-line text-sm"></i>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <i className="ri-customer-service-2-line text-sm"></i>
            <span>Expert support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
