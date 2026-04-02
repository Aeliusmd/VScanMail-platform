"use client";

import { useState } from "react";

export default function ProfileTab() {
  const [profile, setProfile] = useState({
    firstName: 'James',
    lastName: 'Mitchell',
    email: 'james.mitchell@vscanmail.com',
    phone: '+1 (212) 555-0100',
    role: 'Super Admin',
    bio: 'Responsible for managing the V-Scan Mail system, overseeing all scanning operations, company accounts, and mail processing.',
    timezone: 'America/New_York',
    language: 'English',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePasswordSave = () => {
    if (passwordForm.newPass !== passwordForm.confirm) return;
    setPwSuccess(true);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPwSuccess(false), 2500);
  };

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Profile Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">View and update your personal information.</p>
      </div>

      {/* Avatar card */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-5 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-gradient-to-br from-[#0A3D8F] to-[#083170] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">{profile.firstName} {profile.lastName}</p>
          <p className="text-xs text-slate-500">{profile.role}</p>
          <button className="mt-1.5 text-xs text-[#0A3D8F] font-semibold hover:underline cursor-pointer whitespace-nowrap">
            Change Avatar
          </button>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-1">
          <i className="ri-user-line text-[#0A3D8F] text-base"></i>
          <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
            <input
              type="text"
              value={profile.role}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Language</label>
            <select
              title="Language"
              value={profile.language}
              onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Arabic</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Bio / Profile Information</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{profile.bio.length}/500</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors whitespace-nowrap cursor-pointer"
          >
            {saveSuccess ? <><i className="ri-check-line mr-1"></i>Saved!</> : 'Save Changes'}
          </button>
          <button className="px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer">
            Cancel
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-1">
          <i className="ri-lock-password-line text-[#0A3D8F] text-base"></i>
          <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
          <input
            type="password"
            value={passwordForm.current}
            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
            placeholder="Enter current password"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
              placeholder="New password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A3D8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Confirm password"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${
                passwordForm.confirm && passwordForm.confirm !== passwordForm.newPass
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 focus:border-[#0A3D8F]'
              }`}
            />
            {passwordForm.confirm && passwordForm.confirm !== passwordForm.newPass && (
              <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
            )}
          </div>
        </div>
        <button
          onClick={handlePasswordSave}
          disabled={!passwordForm.current || !passwordForm.newPass || passwordForm.newPass !== passwordForm.confirm}
          className="px-5 py-2 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pwSuccess ? <><i className="ri-check-line mr-1"></i>Password Updated!</> : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
