"use client";

import { useState } from "react";

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive';
  joined: string;
}

const initialAdmins: Admin[] = [
  { id: 1, name: 'Sarah Thompson', email: 'sarah.t@vscanmail.com', phone: '+1 (212) 555-0201', role: 'Admin', status: 'Active', joined: '2024-01-15' },
  { id: 2, name: 'Robert Chen', email: 'robert.c@vscanmail.com', phone: '+1 (212) 555-0345', role: 'Admin', status: 'Active', joined: '2024-03-08' },
  { id: 3, name: 'Maria Garcia', email: 'maria.g@vscanmail.com', phone: '+1 (212) 555-0412', role: 'Admin', status: 'Active', joined: '2024-05-22' },
  { id: 4, name: 'David Patel', email: 'david.p@vscanmail.com', phone: '+1 (212) 555-0567', role: 'Admin', status: 'Inactive', joined: '2023-11-30' },
  { id: 5, name: 'Emily Walsh', email: 'emily.w@vscanmail.com', phone: '+1 (212) 555-0689', role: 'Admin', status: 'Active', joined: '2025-01-10' },
];

const emptyForm = { name: '', email: '', phone: '', role: 'Admin', status: 'Active' as 'Active' | 'Inactive' };

export default function ManageAdminsTab() {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [showPanel, setShowPanel] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openAdd = () => {
    setEditingAdmin(null);
    setForm(emptyForm);
    setShowPanel(true);
  };

  const openEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name, email: admin.email, phone: admin.phone, role: admin.role, status: admin.status });
    setShowPanel(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingAdmin) {
      setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? { ...a, ...form } : a));
    } else {
      const newAdmin: Admin = { ...form, id: Date.now(), joined: new Date().toISOString().split('T')[0] };
      setAdmins(prev => [...prev, newAdmin]);
    }
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); setShowPanel(false); }, 1200);
  };

  const handleDelete = (id: number) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = ['from-[#0A3D8F] to-[#083170]', 'from-red-500 to-red-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-amber-600', 'from-violet-500 to-violet-700'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manage Admins</h2>
          <p className="text-sm text-slate-500 mt-0.5">Add, update, or remove admin accounts.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-user-add-line text-base"></i>
          <span>Add Admin</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Admins', value: admins.length, icon: 'ri-team-line', color: 'text-[#0A3D8F] bg-[#0A3D8F]/10' },
          { label: 'Active', value: admins.filter(a => a.status === 'Active').length, icon: 'ri-user-follow-line', color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Inactive', value: admins.filter(a => a.status === 'Inactive').length, icon: 'ri-user-unfollow-line', color: 'text-slate-500 bg-slate-100' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <i className={`${stat.icon} text-lg`}></i>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Admin</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((admin, idx) => (
              <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials(admin.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{admin.name}</p>
                      <p className="text-xs text-slate-400">{admin.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600 text-sm">{admin.email}</td>
                <td className="px-5 py-3.5 text-slate-600 text-sm">{admin.phone}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    admin.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {admin.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-sm">{admin.joined}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEdit(admin)}
                      className="p-1.5 hover:bg-[#0A3D8F]/10 text-[#0A3D8F] rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <i className="ri-edit-line text-base"></i>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(admin.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
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

      {/* Add/Edit Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setShowPanel(false)}></div>
          <div className="w-full sm:w-[420px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#0A3D8F]/10 rounded-lg flex items-center justify-center">
                  <i className="ri-user-settings-line text-[#0A3D8F] text-base"></i>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{editingAdmin ? 'Update Admin' : 'Add New Admin'}</h3>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <i className="ri-close-line text-slate-600 text-lg"></i>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@vscanmail.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (000) 000-0000"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  title="Admin status"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={!form.name || !form.email}
                className="w-full py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saveSuccess ? <><i className="ri-check-line mr-1"></i>Saved!</> : editingAdmin ? 'Update Admin' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-delete-bin-line text-red-500 text-xl"></i>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-sm">Delete Admin?</h3>
              <p className="text-xs text-slate-500 mt-1">This action cannot be undone. The admin will lose access immediately.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
