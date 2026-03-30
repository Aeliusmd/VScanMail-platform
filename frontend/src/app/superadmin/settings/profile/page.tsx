"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

export default function SuperAdminProfileSettingsPage() {
  const [firstName, setFirstName] = useState("James");
  const [lastName, setLastName] = useState("Mitchell");
  const [emailAddress, setEmailAddress] = useState("james.mitchell@vscanmail.com");
  const [phoneNumber, setPhoneNumber] = useState("+1 (212) 555-0100");
  const [role, setRole] = useState("Super Admin");
  const [language, setLanguage] = useState("English");
  const [bio, setBio] = useState(
    "Responsible for managing the V-Scan Mail system, overseeing all scanning operations, company accounts, and mail processing."
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const bioCount = bio.length;
  const bioMax = 500;
  const canSave = useMemo(() => firstName.trim() && lastName.trim() && emailAddress.trim(), [firstName, lastName, emailAddress]);

  const pwValid = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const saveChanges = () => {
    if (!canSave) return;
    setSaveMessage("Profile updated (demo).");
    window.setTimeout(() => setSaveMessage(null), 1500);
  };

  const updatePassword = () => {
    if (!pwValid || currentPassword.length === 0) return;
    setPwMessage("Password updated (demo).");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    window.setTimeout(() => setPwMessage(null), 1500);
  };

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">View and update your personal information.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0A3D8F] text-white flex items-center justify-center font-bold text-sm">
              JM
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">James Mitchell</p>
              <p className="text-sm text-slate-500">Super Admin</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0A3D8F] hover:text-[#083170] cursor-pointer"
              >
                <Icon icon="ri:edit-2-line" className="text-base" />
                Change Avatar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-sm font-semibold text-slate-900 mb-4">Personal Information</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">First Name</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Last Name</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Email Address</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Phone Number</label>
              <input
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Role</label>
              <select
                aria-label="Role"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Language</label>
              <select
                aria-label="Language"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Bio / Profile Information</label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, bioMax))}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20 resize-none min-h-[92px]"
                />
                <div className="absolute right-3 bottom-2 text-[10px] text-slate-400">{bioCount}/{bioMax}</div>
              </div>
            </div>
          </div>

          {saveMessage && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-semibold">
              {saveMessage}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={saveChanges}
              disabled={!canSave}
              className="px-5 py-2.5 rounded-lg bg-[#0A3D8F] text-white font-semibold text-sm hover:bg-[#083170] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setSaveMessage(null);
                setFirstName("James");
                setLastName("Mitchell");
                setEmailAddress("james.mitchell@vscanmail.com");
                setPhoneNumber("+1 (212) 555-0100");
                setRole("Super Admin");
                setLanguage("English");
                setBio(
                  "Responsible for managing the V-Scan Mail system, overseeing all scanning operations, company accounts, and mail processing."
                );
              }}
              className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="ri:lock-2-line" className="text-[#0A3D8F] text-xl" />
            <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
          </div>

          {pwMessage && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-semibold">
              {pwMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              disabled={!pwValid || currentPassword.length === 0}
              onClick={updatePassword}
              className="px-5 py-2.5 rounded-lg bg-[#E5E7EB] text-slate-500 font-semibold text-sm hover:bg-[#E5E7EB] transition cursor-not-allowed disabled:opacity-100 disabled:cursor-not-allowed disabled:hover:bg-[#E5E7EB] sm:float-left"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

