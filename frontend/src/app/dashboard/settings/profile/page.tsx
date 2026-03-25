"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function ProfileSettingsPage() {
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName] = useState('User');
  const [emailAddress, setEmailAddress] = useState('admin@vscanmail.com');
  const [phoneNumber, setPhoneNumber] = useState('+1 (212) 555-0100');
  const [role, setRole] = useState('Administrator');
  const [language, setLanguage] = useState('English');
  const [timeZone, setTimeZone] = useState('America/New_York');

  return (
    <div className="py-2">
      <div className="px-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Update your personal information and preferences.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0A3D8F] text-white flex items-center justify-center font-bold">
              AD
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Admin User</p>
              <p className="text-sm text-slate-500 mt-1">Change Avatar</p>
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
                <option>Administrator</option>
                <option>User</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Timezone</label>
              <select
                aria-label="Timezone"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
              >
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Los_Angeles</option>
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
                <option>English</option>
                <option>Spanish</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-lg bg-[#0A3D8F] text-white font-semibold text-sm hover:bg-[#083170] transition cursor-pointer">
              Save Changes
            </button>
            <button className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

