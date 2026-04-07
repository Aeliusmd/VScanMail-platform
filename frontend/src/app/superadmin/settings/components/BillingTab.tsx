"use client";

import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api-client";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  max_companies: number;
  max_scans: number;
  storage: string;
  badge?: string | null;
  badge_color?: string | null;
  features: string[];
}

interface ManualPlan {
  id: string;
  client_id: string;
  company_name?: string;
  amount: number;
  payment_method: string;
  reference_no?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  payment_date: string;
  period_covered: string;
  duration_months: number;
  period_start: string;
  period_end: string;
}

interface CompanyOption {
  id: string;
  companyName: string;
  clientCode: string;
}


const emptyManualForm = { clientId: '', companyName: '', amount: 299, paymentDate: new Date().toISOString().split('T')[0], startDate: new Date().toISOString().split('T')[0], durationMonths: 3, notes: '', paymentMethod: 'bank_transfer' };

export default function BillingTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [manualPlans, setManualPlans] = useState<ManualPlan[]>([]);
  const [eligibleCompanies, setEligibleCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState<Partial<SubscriptionPlan>>({});
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [editManual, setEditManual] = useState<ManualPlan | null>(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyList, setShowCompanyList] = useState(false);
  
  const [savePlanSuccess, setSavePlanSuccess] = useState(false);
  const [saveManualSuccess, setSaveManualSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, manualData, companiesData] = await Promise.all([
        apiClient<SubscriptionPlan[]>("/api/billing/plans"),
        apiClient<ManualPlan[]>("/api/billing/manual-payments"),
        apiClient<CompanyOption[]>("/api/billing/eligible-companies")
      ]);
      setPlans(plansData);
      setManualPlans(manualData);
      setEligibleCompanies(companiesData);
    } catch (error) {
      console.error("Failed to fetch billing data", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditPlan(plan);
    setEditPlanForm({ ...plan });
  };

  const savePlanEdits = async () => {
    if (!editPlan) return;
    try {
      await apiClient(`/api/billing/plans?id=${editPlan.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editPlanForm),
      });
      setSavePlanSuccess(true);
      fetchData();
      setTimeout(() => { setSavePlanSuccess(false); setEditPlan(null); }, 1200);
    } catch (error) {
      console.error("Failed to save plan edits", error);
    }
  };

  const calculateEndDate = (start: string, months: number) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const openAddManual = () => {
    setEditManual(null);
    setManualForm({
      ...emptyManualForm,
      startDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
    });
    setCompanySearch("");
    setShowManualForm(true);
  };

  const openEditManual = (mp: ManualPlan) => {
    setEditManual(mp);
    setManualForm({ 
      clientId: mp.client_id, 
      companyName: mp.company_name || 'Unknown', 
      amount: mp.amount, 
      paymentDate: mp.payment_date.split('T')[0],
      startDate: mp.period_start.split('T')[0], 
      durationMonths: mp.duration_months,
      notes: mp.notes || '',
      paymentMethod: mp.payment_method || 'bank_transfer'
    });
    setCompanySearch(mp.company_name || "");
    setShowManualForm(true);
  };

  const saveManual = async () => {
    if (!manualForm.clientId || !manualForm.startDate) return;
    
    const endDate = calculateEndDate(manualForm.startDate, manualForm.durationMonths);
    const payload = {
      clientId: manualForm.clientId,
      amount: manualForm.amount,
      paymentMethod: manualForm.paymentMethod,
      paymentDate: manualForm.paymentDate,
      periodCovered: 'custom',
      durationMonths: manualForm.durationMonths,
      periodStart: manualForm.startDate,
      periodEnd: endDate,
      notes: manualForm.notes,
    };

    try {
      if (editManual) {
        await apiClient(`/api/billing/manual-payments?id=${editManual.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/api/billing/manual-payments", {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setSaveManualSuccess(true);
      fetchData();
      setTimeout(() => { setSaveManualSuccess(false); setShowManualForm(false); }, 1200);
    } catch (error) {
      console.error("Failed to save manual plan", error);
    }
  };

  const deleteManual = async (id: string) => {
    try {
      await apiClient(`/api/billing/manual-payments?id=${id}`, {
        method: 'DELETE',
      });
      fetchData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete manual payment", error);
    }
  };

  const getStatus = (mp: ManualPlan) => {
    const end = new Date(mp.period_end);
    const start = new Date(mp.period_start);
    const now = new Date();
    
    if (now > end) return 'Expired';
    if (now < start) return 'Pending';
    return 'Active';
  };

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Expired: 'bg-red-100 text-red-600',
    Pending: 'bg-amber-100 text-amber-700',
  };

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return eligibleCompanies;
    return eligibleCompanies.filter(c => 
      c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companySearch, eligibleCompanies]);

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
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-0.5 rounded-full ${plan.badge_color || 'bg-slate-500'}`}>
                  {plan.badge}
                </span>
              )}
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-xs text-slate-400">/ month</span>
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
                <i className="ri-edit-line mr-1"></i>Edit Plan Tier
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
                    value={editPlanForm.max_companies === 999 ? '' : editPlanForm.max_companies}
                    placeholder={editPlanForm.max_companies === 999 ? 'Unlimited' : ''}
                    onChange={e => setEditPlanForm(p => ({ ...p, max_companies: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Scans/Month</label>
                  <input
                    type="number"
                    value={editPlanForm.max_scans === 999999 ? '' : editPlanForm.max_scans}
                    placeholder={editPlanForm.max_scans === 999999 ? 'Unlimited' : ''}
                    onChange={e => setEditPlanForm(p => ({ ...p, max_scans: Number(e.target.value) }))}
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
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Duration</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manualPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">No manual billing records found.</td>
                </tr>
              ) : manualPlans.map(mp => (
                <tr key={mp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 text-sm">{mp.company_name || 'N/A'}</p>
                    {mp.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{mp.notes}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">${mp.amount}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{new Date(mp.period_start).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{mp.duration_months} months</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[getStatus(mp)]}`}>{getStatus(mp)}</span>
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
            <div className="w-full sm:w-[450px] bg-white h-full overflow-y-auto flex flex-col animate-[slideInRight_0.3s_ease] rounded-l-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <i className="ri-file-list-3-line text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{editManual ? 'Update Manual Plan' : 'Add Manual Plan'}</h3>
                    <p className="text-xs text-slate-500">Persist offline billing record</p>
                  </div>
                </div>
                <button onClick={() => setShowManualForm(false)} className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <i className="ri-close-line text-slate-600 text-xl"></i>
                </button>
              </div>

              <div className="flex-1 p-6 space-y-5">
                {/* Searchable Company Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Company Selection <span className="text-red-500">*</span></label>
                  {editManual ? (
                    <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold">
                      {manualForm.companyName}
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                          type="text"
                          value={companySearch}
                          onChange={e => {
                            setCompanySearch(e.target.value);
                            setShowCompanyList(true);
                          }}
                          onFocus={() => setShowCompanyList(true)}
                          placeholder="Search company or client code..."
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors focus:ring-2 focus:ring-[#0A3D8F]/10"
                        />
                      </div>
                      
                      {showCompanyList && companySearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                          {filteredCompanies.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">No eligible companies found.</div>
                          ) : (
                            filteredCompanies.map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setManualForm(p => ({ ...p, clientId: c.id, companyName: c.companyName }));
                                  setCompanySearch(c.companyName);
                                  setShowCompanyList(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{c.companyName}</p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Code: {c.clientCode}</p>
                                </div>
                                <i className="ri-arrow-right-s-line text-slate-300"></i>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Plan Amount ($) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={manualForm.amount}
                      onChange={e => setManualForm(p => ({ ...p, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Months Covered <span className="text-red-500">*</span></label>
                    <select
                      value={manualForm.durationMonths}
                      onChange={e => setManualForm(p => ({ ...p, durationMonths: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>1 Year (12m)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={manualForm.startDate}
                      onChange={e => setManualForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Payment Method</label>
                    <select
                      value={manualForm.paymentMethod}
                      onChange={e => setManualForm(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card / Terminal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-[#0A3D8F]/5 rounded-xl border border-[#0A3D8F]/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#0A3D8F] font-bold uppercase tracking-wider">Coverage Preview</span>
                    <i className="ri-calendar-event-line text-[#0A3D8F]"></i>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(manualForm.startDate).toLocaleDateString()} 
                    <i className="ri-arrow-right-line mx-2 text-slate-400"></i>
                    {new Date(calculateEndDate(manualForm.startDate, manualForm.durationMonths)).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Internal Notes</label>
                  <textarea
                    value={manualForm.notes}
                    onChange={e => setManualForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    placeholder="Reference numbers, payer info, etc."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors resize-none"
                  />
                  <p className="text-[10px] text-slate-400 text-right mt-1">{manualForm.notes.length}/500 characters</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={saveManual}
                  disabled={!manualForm.clientId || !manualForm.startDate}
                  className="w-full py-3 bg-[#0A3D8F] text-white text-sm font-bold rounded-xl hover:bg-[#083170] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#0A3D8F]/20 active:scale-[0.98]"
                >
                  {saveManualSuccess ? <><i className="ri-check-line mr-1"></i>Success!</> : editManual ? 'Update Billing Record' : 'Record Payment & Activate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl overflow-hidden p-6 w-80 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
              </div>
              <div className="text-center mb-6">
                <h3 className="font-bold text-slate-900 text-base">Remove Billing Record?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">This company&apos;s manual billing history will be permanently erased. This action cannot be undone.</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => deleteManual(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-red-500/20">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
