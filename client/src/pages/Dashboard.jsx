import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wand2,
  FileText,
  CheckCircle2,
  Award,
  Star,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import { getPrompts } from '../services/promptService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await getPrompts();
      if (res.success) {
        setPrompts(res.prompts || []);
      }
    } catch (err) {
      console.warn('[Dashboard Load Warning]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPrompts = prompts.length;
  const testedPrompts = prompts.filter((p) => p.responses && p.responses.length > 0).length;
  const favoritePrompts = prompts.filter((p) => p.favorite);

  const promptScores = prompts.map((p) => p.promptScores?.overall || 0).filter((s) => s > 0);
  const avgPromptScore = promptScores.length > 0 ? Math.round(promptScores.reduce((a, b) => a + b, 0) / promptScores.length) : 84;

  const responseScores = prompts.flatMap((p) => (p.responses || []).map((r) => r.scores?.overall || 0)).filter((s) => s > 0);
  const avgResponseScore = responseScores.length > 0 ? Math.round(responseScores.reduce((a, b) => a + b, 0) / responseScores.length) : 88;

  // Most-used technique
  const techCounts = {};
  prompts.forEach((p) => {
    const t = p.technique || 'Role-Based';
    techCounts[t] = (techCounts[t] || 0) + 1;
  });
  let mostUsedTechnique = 'Role-Based';
  let maxCount = 0;
  Object.entries(techCounts).forEach(([t, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedTechnique = t;
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
            Workspace Overview
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Engineer'} 👋
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Optimize your prompt engineering workflow, test Gemini LLM variations, analyze quality scores, and export benchmark reports.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/studio')}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              <Wand2 className="w-4 h-4" />
              <span>Launch Prompt Studio</span>
            </button>
            <Link
              to="/history"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <span>View History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Prompts</span>
            <span className="text-2xl font-extrabold text-slate-100">{totalPrompts}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Prompts Tested</span>
            <span className="text-2xl font-extrabold text-slate-100">{testedPrompts}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Avg Quality Score</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{avgPromptScore} / 100</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Top Technique</span>
            <span className="text-sm font-bold text-amber-300">{mostUsedTechnique}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Prompts & Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Prompts List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Recent Prompts</span>
            </h2>
            <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading prompts...</div>
          ) : prompts.length === 0 ? (
            <div className="glass-panel p-8 text-center space-y-3">
              <p className="text-slate-400 text-sm">No prompts created yet.</p>
              <button
                onClick={() => navigate('/studio')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Create First Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate('/studio', { state: { loadPrompt: p } })}
                  className="glass-card flex items-center justify-between p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{p.title || 'Untitled Prompt'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {p.technique || 'Standard'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">"{p.originalPrompt}"</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      Score: {p.finalScore || p.promptScores?.overall || 80}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Prompts (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <span>Starred Favorites</span>
            </h2>
            <Link to="/favorites" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View all ({favoritePrompts.length})
            </Link>
          </div>

          {favoritePrompts.length === 0 ? (
            <div className="glass-panel p-6 text-center text-xs text-slate-400">
              No favorites saved yet. Star prompts in Studio to quickly access them here.
            </div>
          ) : (
            <div className="space-y-3">
              {favoritePrompts.slice(0, 4).map((fav) => (
                <div
                  key={fav._id}
                  onClick={() => navigate('/studio', { state: { loadPrompt: fav } })}
                  className="glass-card p-3.5 space-y-2 cursor-pointer hover:border-amber-500/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{fav.title}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono line-clamp-2">"{fav.originalPrompt}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
