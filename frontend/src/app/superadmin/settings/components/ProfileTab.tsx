"use client";

import { useEffect, useState, useRef } from "react";
import ImageCropperModal from "./ImageCropperModal";
import { getCroppedImg } from "@/lib/image-utils";
import { Area } from "react-easy-crop";
import { apiClient, apiUpload } from "@/lib/api-client";

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    language: 'English',
    avatarUrl: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient<any>("/api/profile/me");
        if (res?.user) {
        setProfile({
          firstName: res.user.firstName || '',
          lastName: res.user.lastName || '',
          email: res.user.email || '',
          phone: res.user.phone || '',
          role: res.role || 'Super Admin',
          bio: res.user.bio || '',
          language: res.user.language || 'English',
          avatarUrl: res.user.avatarUrl || '',
        });
      }
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
      setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaveSuccess(false);
    setError(null);
    try {
      await apiClient("/api/profile/update", { method: "POST", body: JSON.stringify(profile) });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) return;
    setPwSuccess(false);
    setPwError(null);
    try {
      await apiClient("/api/profile/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPass,
          confirmPassword: passwordForm.confirm,
        }),
      });
      setPwSuccess(true);
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 2500);
    } catch (e: any) {
      setPwError(e?.message || "Failed to update password");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCrop = async (croppedAreaPixels: Area) => {
    if (!imageToCrop) return;
    
    setShowCropper(false);
    setUploading(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.jpg");

      const res = await apiUpload<{ url?: string }>("/api/profile/avatar", formData);
      if (res?.url) {
        const avatarUrl = res.url;
        setProfile((p) => ({ ...p, avatarUrl }));
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        setError("Failed to upload avatar");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during cropping");
    } finally {
      setUploading(false);
      setImageToCrop(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D8F]"></div>
      </div>
    );
  }

  const initials = profile.firstName && profile.lastName 
    ? `${profile.firstName[0].toUpperCase()}${profile.lastName[0].toUpperCase()}`
    : 'SA';

  return (
    <div className="max-w-2xl space-y-6">
      {showCropper && imageToCrop && (
        <ImageCropperModal 
          image={imageToCrop}
          onConfirm={handleConfirmCrop}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
          }}
        />
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900">Profile Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">View and update your personal information.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Avatar card */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-5 bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-20 h-20 bg-gradient-to-br from-[#0A3D8F] to-[#083170] rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden shadow-inner ring-4 ring-white/50 group-hover:ring-[#0A3D8F]/20 transition-all">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <i className="ri-camera-line text-white text-2xl"></i>
            </div>
          </div>
          {uploading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-full z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3D8F]"></div>
             </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
        <div className="space-y-1">
          <p className="text-xl font-bold text-slate-900 tracking-tight">{profile.firstName || 'User'} {profile.lastName}</p>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0A3D8F]/10 text-[#0A3D8F] text-[10px] font-bold uppercase tracking-wider">
            {profile.role === 'super_admin' ? 'System Administrator' : profile.role.replace('_', ' ')}
          </div>
          <div className="block pt-1">
            <button 
                onClick={handleAvatarClick}
                className="text-xs text-[#0A3D8F] font-semibold hover:text-[#083170] hover:underline transition-colors cursor-pointer"
            >
                Edit Photo
            </button>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2.5 text-[#0A3D8F]">
            <div className="w-8 h-8 rounded-lg bg-[#0A3D8F]/10 flex items-center justify-center">
              <i className="ri-user-settings-line text-lg"></i>
            </div>
            <h3 className="text-base font-bold">Account Information</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              placeholder="Enter first name"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              placeholder="Enter last name"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="Enter email"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
            <input
              type="text"
              value={profile.role}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 cursor-not-allowed font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Language</label>
            <select
              title="Language"
              value={profile.language}
              onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] bg-white cursor-pointer"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Bio / Profile Information</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Write a short bio..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{profile.bio.length}/500</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] shadow-sm transition-all focus:scale-[0.98] active:scale-[0.96] cursor-pointer"
          >
            {saveSuccess ? <><i className="ri-check-line mr-1"></i>Saved!</> : 'Save Changes'}
          </button>
          <button 
             onClick={() => window.location.reload()}
             className="px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 pb-1 text-[#0A3D8F]">
          <i className="ri-lock-password-line text-lg"></i>
          <h3 className="text-sm font-bold">Change Password</h3>
        </div>
        
        {pwError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {pwError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
          <input
            type="password"
            value={passwordForm.current}
            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
            placeholder="Enter current password"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
              placeholder="Enter new password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none transition-all ${
                passwordForm.confirm && passwordForm.confirm !== passwordForm.newPass
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-[#0A3D8F] focus:ring-[#0A3D8F]/20'
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
          className="px-5 py-2 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] shadow-sm transition-all focus:scale-[0.98] active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {pwSuccess ? <><i className="ri-check-line mr-1"></i>Password Updated!</> : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
