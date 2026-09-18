import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, PlusCircle, User, LogOut, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              AI Prompt Studio
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Create better prompts. Get better AI responses.
            </p>
          </div>
        </Link>
      </div>

      {/* Model & Quick Actions */}
      <div className="flex items-center gap-4">
        {/* Model Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-indigo-300 font-medium">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini 2.5 Flash</span>
        </div>

        {/* Create New Prompt Button */}
        <button
          onClick={() => navigate('/studio')}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Prompt</span>
        </button>

        {/* User Info / Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-sm font-semibold text-slate-200">{user?.name || 'User'}</span>
            <span className="text-xs text-slate-400 flex items-center justify-end gap-1">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
              {user?.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>

          <button
            onClick={logoutUser}
            title="Logout"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
