import React, { useEffect, useState } from 'react';
import {
  User,
  ShieldCheck,
  Cpu,
  Key,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile as apiUpdateProfile, updatePassword as apiUpdatePassword } from '../services/authService';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [healthStatus, setHealthStatus] = useState(null);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Update Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    API.get('/health')
      .then((res) => setHealthStatus(res.data))
      .catch(() => setHealthStatus({ status: 'offline' }));
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiUpdateProfile({ name: name.trim(), email: email.trim() });
      if (res.success && res.user) {
        updateUser(res.user);
        showToast('Profile information updated successfully!', 'success');
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await apiUpdatePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>User Profile & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage your account credentials, update security keys, and monitor Gemini API system status
        </p>
      </div>

      {/* Account Info Header Banner */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user?.name || 'User Name'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {user?.role || 'user'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email || 'user@example.com'}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Administrator Privileges</span>
          </span>
        )}
      </div>

      {/* Forms Grid: Edit Profile & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. Edit Profile Information */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-slate-100">Edit Profile Information</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
              <input
                type="text"
                disabled
                value={user?.role === 'admin' ? 'Administrator' : 'Standard User / Student'}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Change Security Password */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-slate-100">Change Password</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password *</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password *</label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {updatingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Security Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* System & Gemini Health Check */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Gemini API Backend Integration Status</span>
        </h3>

        {healthStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Express Server</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Online (Port 5000)
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Gemini SDK Configured</span>
              <span className={healthStatus.geminiConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {healthStatus.geminiConfigured ? 'Active (API Key Present)' : 'Demo Mode (No API Key in .env)'}
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Active Model</span>
              <span className="text-indigo-300 font-bold">{healthStatus.model || 'gemini-2.5-flash'}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Checking server health...</div>
        )}
      </div>

      {/* Viva Explanation / System Architecture */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-400" />
          <span>System Architecture & Data Flow (Viva Capstone Reference)</span>
        </h3>

        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
          <p className="text-indigo-400 font-semibold">
            React Frontend (Vite) ➔ Axios API Call ➔ Express REST Server ➔ Gemini Service (@google/genai) ➔ Google Gemini API
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>
              <strong>Security Protocol:</strong> GEMINI_API_KEY is stored solely inside backend <code className="text-amber-300">server/.env</code>. Zero client-side API key exposure.
            </li>
            <li>
              <strong>Modular Heuristics:</strong> Prompt Quality & Response Quality scoring logic are deterministic heuristic engines run strictly on backend utilities.
            </li>
            <li>
              <strong>Mongoose Data Persistence:</strong> User, Prompt, Collection, PromptVersion, and Activity models stored in MongoDB.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
