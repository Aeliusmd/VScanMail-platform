"use client";

import { useState } from "react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  maxCompanies: number;
  maxScans: number;
  storage: string;
  badge?: string;
  badgeColor?: string;
}

interface ManualPlan {
  id: number;
  company: string;
  plan: string;
  price: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Pending';
  note: string;
}

const initialPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: 'month',
    features: ['Up to 5 companies', '500 scans/month', '10 GB storage', 'Email notifications', 'Basic AI summary'],
    maxCompanies: 5,
    maxScans: 500,
    storage: '10 GB',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    period: 'month',
    features: ['Up to 25 companies', '2,000 scans/month', '50 GB storage', 'Email + SMS notifications', 'Advanced AI summary', 'Priority support'],
    maxCompanies: 25,
    maxScans: 2000,
    storage: '50 GB',
    badge: 'Most Popular',
    badgeColor: 'bg-red-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    period: 'month',
    features: ['Unlimited companies', 'Unlimited scans', '200 GB storage', 'All notification channels', 'Custom AI workflows', 'Dedicated support', 'Custom integrations'],
    maxCompanies: 999,
    maxScans: 999999,
    storage: '200 GB',
  },
];

const initialManualPlans: ManualPlan[] = [
  { id: 1, company: 'Apex Logistics Inc.', plan: '3-Month Manual', price: 299, startDate: '2026-01-15', endDate: '2026-04-15', status: 'Active', note: 'Payment received via bank transfer on Jan 14' },
  { id: 2, company: 'Summit Holdings LLC', plan: '3-Month Manual', price: 299, startDate: '2026-02-01', endDate: '2026-05-01', status: 'Active', note: 'Quarterly renewal, paid by cheque' },
  { id: 3, company: 'BrightPath Financial', plan: '3-Month Manual', price: 299, startDate: '2025-12-01', endDate: '2026-03-01', status: 'Expired', note: 'Renewal pending — awaiting confirmation' },
  { id: 4, company: 'Metro Finance Group', plan: '3-Month Manual', price: 299, startDate: '2026-03-20', endDate: '2026-06-20', status: 'Pending', note: 'New registration, awaiting first payment' },
];

const emptyManualForm = { company: '', price: 299, startDate: '', note: '' };

export default function BillingTab() {
  const [plans] = useState<SubscriptionPlan[]>(initialPlans);
  const [manualPlans, setManualPlans] = useState<ManualPlan[]>(initialManualPlans);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState<Partial<SubscriptionPlan>>({});
  const [showManualForm, setShowManualForm] = useState(false);
  const [editManual, setEditManual] = useState<ManualPlan | null>(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [savePlanSuccess, setSavePlanSuccess] = useState(false);
  const [saveManualSuccess, setSaveManualSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditPlan(plan);
    setEditPlanForm({ ...plan });
  };

  const savePlanEdits = () => {
    setSavePlanSuccess(true);
    setTimeout(() => { setSavePlanSuccess(false); setEditPlan(null); }, 1200);
  };

  const addThreeMonths = (start: string) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };

  const openAddManual = () => {
    setEditManual(null);
    setManualForm(emptyManualForm);
    setShowManualForm(true);
  };

  const openEditManual = (mp: ManualPlan) => {
    setEditManual(mp);
    setManualForm({ company: mp.company, price: mp.price, startDate: mp.startDate, note: mp.note });
    setShowManualForm(true);
  };

  const saveManual = () => {
    if (!manualForm.company || !manualForm.startDate) return;
    const end = addThreeMonths(manualForm.startDate);
    if (editManual) {
      setManualPlans(prev => prev.map(m => m.id === editManual.id
        ? { ...m, company: manualForm.company, price: manualForm.price, startDate: manualForm.startDate, endDate: end, note: manualForm.note }
        : m
      ));
    } else {
      const newEntry: ManualPlan = {
        id: Date.now(),
        company: manualForm.company,
        plan: '3-Month Manual',
        price: manualForm.price,
        startDate: manualForm.startDate,
        endDate: end,
        status: 'Pending',
        note: manualForm.note,
      };
      setManualPlans(prev => [...prev, newEntry]);
    }
    setSaveManualSuccess(true);
    setTimeout(() => { setSaveManualSuccess(false); setShowManualForm(false); }, 1200);
  };

  const deleteManual = (id: number) => {
    setManualPlans(prev => prev.filter(m => m.id !== id));
    setDeleteConfirm(null);
  };

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Expired: 'bg-red-100 text-red-600',
    Pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-8">
      {/* ── Subscription Plans ── */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Billing & Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage subscription plans and manual billing accounts.</p>
        </div>

        <div className="flex items-center space-x-2 pb-1">
          <div className="w-6 h-6 bg-[#0A3D8F]/10 rounded-md flex items-center justify-center">
            <i className="ri-vip-crown-line text-[#0A3D8F] text-xs"></i>
          </div>
          <h3 className="text-sm font-bold text-slate-800">Subscription Plans</h3>
          <span className="text-xs text-slate-400">Monthly billing</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-5 flex flex-col relative transition-all ${
                plan.id === 'professional' ? 'border-[#0A3D8F]' : 'border-slate-200'
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-0.5 rounded-full ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
              )}
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-xs text-slate-400">/ {plan.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <i className="ri-check-line text-emerald-500 text-sm mt-0.5 flex-shrink-0"></i>
                    <span className="text-xs text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openEditPlan(plan)}
                className="w-full py-2 text-xs font-semibold rounded-lg border border-[#0A3D8F]/30 text-[#0A3D8F] hover:bg-[#0A3D8F]/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-edit-line mr-1"></i>Edit Plan
              </button>
            </div>
          ))}
        </div>

        {/* Edit plan modal */}
        {editPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl overflow-hidden w-96 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Edit {editPlan.name} Plan</h3>
                <button onClick={() => setEditPlan(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <i className="ri-close-line text-slate-500 text-lg"></i>
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editPlanForm.name || ''}
                  onChange={e => setEditPlanForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($/month)</label>
                  <input
                    type="number"
                    value={editPlanForm.price || 0}
                    onChange={e => setEditPlanForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Companies</label>
                  <input
                    type="number"
                    value={editPlanForm.maxCompanies === 999 ? '' : editPlanForm.maxCompanies}
                    placeholder={editPlanForm.maxCompanies === 999 ? 'Unlimited' : ''}
                    onChange={e => setEditPlanForm(p => ({ ...p, maxCompanies: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Scans/Month</label>
                  <input
                    type="number"
                    value={editPlanForm.maxScans === 999999 ? '' : editPlanForm.maxScans}
                    placeholder={editPlanForm.maxScans === 999999 ? 'Unlimited' : ''}
                    onChange={e => setEditPlanForm(p => ({ ...p, maxScans: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Storage</label>
                  <input
                    type="text"
                    value={editPlanForm.storage || ''}
                    onChange={e => setEditPlanForm(p => ({ ...p, storage: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-1">
                <button onClick={() => setEditPlan(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={savePlanEdits} className="flex-1 py-2 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors cursor-pointer whitespace-nowrap">
                  {savePlanSuccess ? <><i className="ri-check-line mr-1"></i>Saved!</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Manual Plans ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
              <i className="ri-file-list-3-line text-red-600 text-xs"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Manual Plan</h3>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">3-Month Plan</span>
          </div>
          <button
            onClick={openAddManual}
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line text-sm"></i>
            <span>Add Manual Plan</span>
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <i className="ri-information-line text-amber-600 text-base flex-shrink-0 mt-0.5"></i>
          <div>
            <p className="text-xs font-semibold text-amber-800">Manual Plan Info</p>
            <p className="text-xs text-amber-700 mt-0.5">Manual plans are used for companies registered directly by the Super Admin. Payments are handled manually (bank transfer, cheque, etc.) and each plan covers a 3-month period.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">End Date</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manualPlans.map(mp => (
                <tr key={mp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 text-sm">{mp.company}</p>
                    {mp.note && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{mp.note}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">${mp.price}</span>
                    <span className="text-xs text-slate-400 ml-1">/ 3 months</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{mp.startDate}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{mp.endDate}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[mp.status]}`}>{mp.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => openEditManual(mp)} className="p-1.5 hover:bg-[#0A3D8F]/10 text-[#0A3D8F] rounded-lg transition-colors cursor-pointer" title="Edit">
                        <i className="ri-edit-line text-base"></i>
                      </button>
                      <button onClick={() => setDeleteConfirm(mp.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer" title="Delete">
                        <i className="ri-delete-bin-line text-base"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Manual plan slide-in */}
        {showManualForm && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={() => setShowManualForm(false)}></div>
            <div className="w-full sm:w-[400px] bg-white h-full overflow-y-auto flex flex-col animate-[slideInRight_0.3s_ease] rounded-l-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="ri-file-list-3-line text-red-600 text-base"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{editManual ? 'Update Manual Plan' : 'Add Manual Plan'}</h3>
                    <p className="text-xs text-slate-500">3-month billing period</p>
                  </div>
                </div>
                <button onClick={() => setShowManualForm(false)} className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <i className="ri-close-line text-slate-600 text-lg"></i>
                </button>
              </div>

              <div className="flex-1 p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={manualForm.company}
                    onChange={e => setManualForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="e.g. Apex Logistics Inc."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Amount ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={manualForm.price}
                    onChange={e => setManualForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">This covers a 3-month period</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={manualForm.startDate}
                    onChange={e => setManualForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
                  />
                  {manualForm.startDate && (
                    <p className="text-xs text-[#0A3D8F] mt-0.5 font-medium">
                      End date: {addThreeMonths(manualForm.startDate)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                  <textarea
                    value={manualForm.note}
                    onChange={e => setManualForm(p => ({ ...p, note: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    placeholder="Payment method, reference notes..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors resize-none"
                  />
                  <p className="text-xs text-slate-400 text-right">{manualForm.note.length}/500</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <button
                  onClick={saveManual}
                  disabled={!manualForm.company || !manualForm.startDate}
                  className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {saveManualSuccess ? <><i className="ri-check-line mr-1"></i>Saved!</> : editManual ? 'Update Plan' : 'Add Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl overflow-hidden p-6 w-80 space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <i className="ri-delete-bin-line text-red-500 text-xl"></i>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900 text-sm">Remove Manual Plan?</h3>
                <p className="text-xs text-slate-500 mt-1">This company&apos;s manual billing record will be permanently deleted.</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={() => deleteManual(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 cursor-pointer whitespace-nowrap">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
