import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wand2,
  History,
  FolderKanban,
  Star,
  BarChart3,
  User,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAdmin, logoutUser } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Prompt Studio', path: '/studio', icon: Wand2, highlight: true },
    { label: 'History', path: '/history', icon: History },
    { label: 'Collections', path: '/collections', icon: FolderKanban },
    { label: 'Favorites', path: '/favorites', icon: Star },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Dashboard', path: '/admin', icon: ShieldCheck, admin: true });
  }

  return (
    <aside className="w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800 shrink-0 flex flex-col justify-between py-6 px-4 hidden md:flex">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                        : 'bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className={`w-4 h-4 ${item.admin ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer info & Logout */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">B.Tech Project 2026</p>
          <p className="text-slate-500">AI Prompt Engineering Platform</p>
        </div>

        <button
          onClick={logoutUser}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
