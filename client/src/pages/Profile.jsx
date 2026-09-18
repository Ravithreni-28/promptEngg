import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Cpu, Key, Database, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    API.get('/health')
      .then((res) => setHealthStatus(res.data))
      .catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>User Profile & System Info</span>
        </h1>
        <p className="text-xs text-slate-400">Account metadata, Gemini SDK connection status, and viva project architecture</p>
      </div>

      {/* Account Info Panel */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user?.name || 'User Name'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {user?.role || 'user'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        {/* System & Gemini Health Check */}
        <div className="space-y-3">
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
                  {healthStatus.geminiConfigured ? 'Active (API Key Present)' : 'Demo Mode (No API Key)'}
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
      </div>

      {/* Viva Explanation / System Architecture */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-400" />
          <span>System Architecture & Data Flow (Viva Reference)</span>
        </h3>

        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
          <p className="text-indigo-400 font-semibold">
            React Frontend (Vite) ➔ Axios API Call ➔ Express REST Server ➔ Gemini Service (@google/genai) ➔ Google Gemini API
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Security Boundary:</strong> GEMINI_API_KEY is stored solely inside backend <code className="text-amber-300">server/.env</code>. Zero client-side API key exposure.</li>
            <li><strong>Modular Heuristics:</strong> Prompt Quality & Response Quality scoring logic are separate heuristic engines run deterministically on backend utilities.</li>
            <li><strong>Mongoose Data Storage:</strong> User, Prompt, Collection, PromptVersion, and Activity models stored in MongoDB.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
