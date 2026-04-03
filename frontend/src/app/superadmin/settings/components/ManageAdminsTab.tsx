"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  joined: string;
  lastLogin: string | null;
  initials: string;
  avatarColor: string;
}

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  status: "Active" as "Active" | "Inactive",
};

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vscanmail_token");
}

function apiFetch(path: string, options?: RequestInit) {
  const token = getAuthToken();
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
}

export default function ManageAdminsTab() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ------------------------------------------------------------------
  // Fetch admins from backend
  // ------------------------------------------------------------------
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admins");
      if (!res.ok) throw new Error("Failed to load admins");
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // ------------------------------------------------------------------
  // Panel helpers
  // ------------------------------------------------------------------
  const openAdd = () => {
    setPanelMode("add");
    setEditingAdmin(null);
    setForm(emptyForm);
    setSaveError("");
    setSaveSuccess(false);
    setShowPassword(false);
    setShowPanel(true);
  };

  const openEdit = (admin: Admin) => {
    setPanelMode("edit");
    setEditingAdmin(admin);
    setForm({
      fullName: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: "",
      status: admin.status,
    });
    setSaveError("");
    setSaveSuccess(false);
    setShowPanel(true);
  };

  // ------------------------------------------------------------------
  // Save (Add or Update)
  // ------------------------------------------------------------------
  const handleSave = async () => {
    if (!form.fullName || !form.email) return;
    if (panelMode === "add" && !form.password) {
      setSaveError("Password is required when creating a new admin.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      if (panelMode === "add") {
        const res = await apiFetch("/api/admins", {
          method: "POST",
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            password: form.password,
            status: form.status.toLowerCase(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add admin");
        setAdmins((prev) => [data.admin, ...prev]);
      } else if (editingAdmin) {
        const res = await apiFetch(`/api/admins/${editingAdmin.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            status: form.status,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update admin");
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === editingAdmin.id
              ? { ...a, name: form.fullName, phone: form.phone, status: form.status }
              : a
          )
        );
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowPanel(false);
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await apiFetch(`/api/admins/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete admin");
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const activeCount = admins.filter((a) => a.status === "Active").length;
  const inactiveCount = admins.filter((a) => a.status === "Inactive").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manage Admins</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Add, update, or remove admin accounts.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#083170] active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer"
        >
          <Icon icon="ri:user-add-line" className="text-base" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Admins",
            value: admins.length,
            icon: "ri:team-line",
            color: "text-[#0A3D8F] bg-[#0A3D8F]/10",
          },
          {
            label: "Active",
            value: activeCount,
            icon: "ri:user-follow-line",
            color: "text-emerald-600 bg-emerald-100",
          },
          {
            label: "Inactive",
            value: inactiveCount,
            icon: "ri:user-unfollow-line",
            color: "text-slate-500 bg-slate-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-3 shadow-sm"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}
            >
              <Icon icon={stat.icon} className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500 font-medium">
                        Loading admins...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                        <Icon
                          icon="ri:team-line"
                          className="text-2xl text-slate-400"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        No admins yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Click "Add Admin" to create your first admin account.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 bg-gradient-to-br ${admin.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}
                        >
                          {admin.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">
                            {admin.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {admin.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">
                      {admin.email}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">
                      {admin.phone || (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${admin.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${admin.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                            }`}
                        />
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">
                      {admin.joined}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {admin.lastLogin ? (
                        <div className="flex flex-col">
                          <span className="text-slate-600 font-medium">
                            {formatTimeAgo(admin.lastLogin)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(admin.lastLogin).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 hover:bg-[#0A3D8F]/10 text-[#0A3D8F] rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Icon icon="ri:edit-line" className="text-base" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(admin.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Icon
                            icon="ri:delete-bin-line"
                            className="text-base"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Slide-over Panel                                          */}
      {/* ------------------------------------------------------------------ */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPanel(false)}
          />
          <div className="w-full sm:w-[440px] bg-white h-full flex flex-col shadow-2xl animate-[slideInRight_0.25s_ease-out] rounded-l-2xl overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <Icon
                    icon={
                      panelMode === "add"
                        ? "ri:user-add-line"
                        : "ri:user-settings-line"
                    }
                    className="text-[#0A3D8F] text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {panelMode === "add" ? "Add New Admin" : "Update Admin"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {panelMode === "add"
                      ? "Create a new admin account"
                      : `Editing ${editingAdmin?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                <Icon icon="ri:close-line" className="text-slate-500 text-xl" />
              </button>
            </div>

            {/* Panel body */}
            {saveSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-[zoomIn_0.3s_ease]">
                  <Icon
                    icon="ri:check-line"
                    className="text-emerald-600 text-4xl"
                  />
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {panelMode === "add" ? "Admin Added!" : "Admin Updated!"}
                </p>
                <p className="text-sm text-slate-500 text-center">
                  {panelMode === "add"
                    ? "The admin account has been created and they can now sign in."
                    : "Changes have been saved successfully."}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Error alert */}
                {saveError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                    <Icon
                      icon="ri:error-warning-line"
                      className="text-red-500 text-lg mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Error
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">{saveError}</p>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    placeholder="e.g. John Smith"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/10 transition-all shadow-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon
                      icon="ri:mail-line"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      disabled={panelMode === "edit"}
                      placeholder="admin@vscanmail.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/10 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  {panelMode === "edit" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Email cannot be changed after account creation.
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Icon
                      icon="ri:phone-line"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
                    />
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+1 (000) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/10 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Password (Add only) */}
                {panelMode === "add" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Icon
                        icon="ri:lock-password-line"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, password: e.target.value }))
                        }
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/10 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Icon
                          icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"}
                          className="text-base"
                        />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      The admin will use this password to log in.
                    </p>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Account Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["Active", "Inactive"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, status: s }))}
                        className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all cursor-pointer ${form.status === s
                            ? s === "Active"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-400 bg-slate-50 text-slate-700"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Panel footer */}
            {!saveSuccess && (
              <div className="px-6 py-5 border-t border-slate-200 flex-shrink-0 bg-slate-50/80 space-y-3">
                {(!form.fullName || !form.email || (panelMode === "add" && !form.password)) && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Icon icon="ri:information-line" className="text-xs" />
                    {panelMode === "add"
                      ? "Name, email and password are required"
                      : "Name and email are required"}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPanel(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={
                      saving ||
                      !form.fullName ||
                      !form.email ||
                      (panelMode === "add" && !form.password)
                    }
                    className="flex-1 py-2.5 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-all text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon
                          icon={
                            panelMode === "add"
                              ? "ri:user-add-line"
                              : "ri:save-line"
                          }
                          className="text-sm"
                        />
                        {panelMode === "add" ? "Add Admin" : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Delete Confirmation Modal                                           */}
      {/* ------------------------------------------------------------------ */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-5 animate-[zoomIn_0.2s_ease]">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <Icon
                  icon="ri:delete-bin-line"
                  className="text-red-500 text-2xl"
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Remove Admin?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This action cannot be undone. The admin will immediately lose
                  access to the system.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Remove Admin"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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
        @keyframes zoomIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor(Math.abs(now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}