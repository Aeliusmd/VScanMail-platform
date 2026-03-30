"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type AdminStatus = "Active" | "Inactive";

type Admin = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: AdminStatus;
  joined: string; // display-only for now
};

function StatusBadge({ status }: { status: AdminStatus }) {
  const cls =
    status === "Active"
      ? "bg-[#DCFCE7] text-[#2F8F3A] border border-[#86EFAC]"
      : "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

type AdminForm = {
  fullName: string;
  email: string;
  phone: string;
  status: AdminStatus;
};

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: 1,
      fullName: "Sarah Thompson",
      email: "sarah.t@vscanmail.com",
      phone: "+1 (212) 555-0201",
      status: "Active",
      joined: "2024-01-15",
    },
    {
      id: 2,
      fullName: "Robert Chen",
      email: "robert.c@vscanmail.com",
      phone: "+1 (212) 555-0345",
      status: "Active",
      joined: "2024-03-08",
    },
    {
      id: 3,
      fullName: "Maria Garcia",
      email: "maria.g@vscanmail.com",
      phone: "+1 (212) 555-0412",
      status: "Active",
      joined: "2024-05-22",
    },
    {
      id: 4,
      fullName: "David Patel",
      email: "david.p@vscanmail.com",
      phone: "+1 (212) 555-0567",
      status: "Inactive",
      joined: "2023-11-30",
    },
    {
      id: 5,
      fullName: "Emily Walsh",
      email: "emily.w@vscanmail.com",
      phone: "+1 (212) 555-0689",
      status: "Active",
      joined: "2025-01-10",
    },
  ]);

  const totalAdmins = admins.length;
  const { activeCount, inactiveCount } = useMemo(() => {
    const activeCount = admins.filter((a) => a.status === "Active").length;
    const inactiveCount = admins.filter((a) => a.status === "Inactive").length;
    return { activeCount, inactiveCount };
  }, [admins]);

  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<Admin | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);

  const [addForm, setAddForm] = useState<AdminForm>({
    fullName: "",
    email: "",
    phone: "",
    status: "Active",
  });

  const [updateForm, setUpdateForm] = useState<AdminForm>({
    fullName: "",
    email: "",
    phone: "",
    status: "Active",
  });

  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const resetModalState = () => setModalMessage(null);

  const openAdd = () => {
    resetModalState();
    setAddForm({ fullName: "", email: "", phone: "", status: "Active" });
    setShowAdd(true);
  };

  const openUpdate = (admin: Admin) => {
    resetModalState();
    setUpdateTarget(admin);
    setUpdateForm({
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      status: admin.status,
    });
    setShowUpdate(true);
  };

  const openDelete = (admin: Admin) => {
    resetModalState();
    setDeleteTarget(admin);
    setShowDelete(true);
  };

  const isFormValid = (f: AdminForm) => f.fullName.trim().length > 0 && f.email.trim().length > 0;

  const addAdmin = () => {
    if (!isFormValid(addForm)) return;

    const nextId = admins.length ? Math.max(...admins.map((a) => a.id)) + 1 : 1;
    const created: Admin = {
      id: nextId,
      fullName: addForm.fullName.trim(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim(),
      status: addForm.status,
      joined: new Date().toISOString().slice(0, 10),
    };
    setAdmins((prev) => [created, ...prev]);
    setModalMessage("Admin added successfully.");
    window.setTimeout(() => setShowAdd(false), 900);
  };

  const updateAdmin = () => {
    if (!updateTarget) return;
    if (!isFormValid(updateForm)) return;

    setAdmins((prev) =>
      prev.map((a) =>
        a.id === updateTarget.id
          ? {
              ...a,
              fullName: updateForm.fullName.trim(),
              email: updateForm.email.trim(),
              phone: updateForm.phone.trim(),
              status: updateForm.status,
            }
          : a
      )
    );
    setModalMessage("Admin updated successfully.");
    window.setTimeout(() => setShowUpdate(false), 900);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setModalMessage("Admin deleted successfully.");
    window.setTimeout(() => setShowDelete(false), 700);
  };

  const anyModalOpen = showAdd || showUpdate || showDelete;

  return (
    <div className="w-full">
      {/* Top counters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0A3D8F]/10 text-[#0A3D8F]">
            <Icon icon="ri:shield-user-line" className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Manage Admins</h1>
            <p className="text-xs sm:text-sm text-slate-500 -mt-0.5">Add, update, or remove admin accounts.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#083170] transition cursor-pointer"
        >
          <Icon icon="ri:add-line" className="text-base" />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Icon icon="ri:users-line" className="text-xl text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Admins</p>
              <p className="text-2xl font-bold text-slate-900">{totalAdmins}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Icon icon="ri:checkbox-circle-line" className="text-xl text-[#2F8F3A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Icon icon="ri:time-line" className="text-xl text-[#B45309]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Inactive</p>
              <p className="text-2xl font-bold text-slate-900">{inactiveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <th className="px-5 py-4">Admin</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const initials = admin.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p.charAt(0).toUpperCase())
                  .join("");

                const avatarCls =
                  admin.status === "Active"
                    ? "bg-[#0A3D8F]"
                    : "bg-amber-600";

                return (
                  <tr key={admin.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarCls}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{admin.fullName}</p>
                          <p className="text-xs text-slate-500">Admin</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{admin.email}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{admin.phone || "N/A"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={admin.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{admin.joined}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openUpdate(admin)}
                          className="text-[#0A3D8F] hover:text-[#083170] transition cursor-pointer"
                          aria-label={`Edit ${admin.fullName}`}
                        >
                          <Icon icon="ri:edit-2-line" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(admin)}
                          className="text-red-600 hover:text-red-700 transition cursor-pointer"
                          aria-label={`Delete ${admin.fullName}`}
                        >
                          <Icon icon="ri:delete-bin-line" className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end p-0"
          onClick={() => setShowAdd(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white w-full h-full max-w-lg shadow-2xl animate-[slideInRight_0.25s_ease-out] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <i className="ri:building-line text-[#0A3D8F] text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Admin</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in the admin details below</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="ri-close-line text-slate-600 text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
              {modalMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
                  {modalMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={addForm.fullName}
                    onChange={(e) => setAddForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g. John Smith"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@vscanmail.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                  <input
                    value={addForm.phone}
                    onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (000) 000-0000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select
                    aria-label="Status"
                    value={addForm.status}
                    onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value as AdminStatus }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all bg-white cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-7 py-5 border-t border-slate-200 bg-slate-50/80 flex-shrink-0">
              <button
                type="button"
                onClick={addAdmin}
                disabled={!isFormValid(addForm)}
                className="w-full py-3 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Admin Modal */}
      {showUpdate && updateTarget && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end p-0"
          onClick={() => setShowUpdate(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white w-full h-full max-w-lg shadow-2xl animate-[slideInRight_0.25s_ease-out] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <i className="ri:shield-user-line text-[#0A3D8F] text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Update Admin</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Update admin details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdate(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="ri-close-line text-slate-600 text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
              {modalMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
                  {modalMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={updateForm.fullName}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g. John Smith"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@vscanmail.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                  <input
                    value={updateForm.phone}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (000) 000-0000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select
                    aria-label="Status"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value as AdminStatus }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all bg-white cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-7 py-5 border-t border-slate-200 bg-slate-50/80 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpdate(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateAdmin}
                  disabled={!isFormValid(updateForm)}
                  className="flex-1 py-3 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Update Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          onClick={() => setShowDelete(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-6">
              {modalMessage && (
                <p className="text-sm font-semibold text-green-700 mb-3 text-center">{modalMessage}</p>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <i className="ri:delete-bin-line text-red-600 text-xl" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Delete Admin?</h2>
                <p className="text-sm text-slate-500">
                  This action cannot be undone. The admin will lose access immediately.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="w-32 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-32 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keep animation keyframes local to this page */}
      {anyModalOpen && (
        <style jsx>{`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0.6;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      )}
    </div>
  );
}

