import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Award, Zap, CheckCircle2, FileText } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getPrompts } from '../services/promptService';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // 1. Try backend API first
      const res = await API.get('/analytics');
      if (res.data.success && res.data.metrics) {
        setData(res.data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[Analytics API Warning]: Using local metrics calculation.');
    }

    // 2. Local State Calculation
    try {
      const promptsRes = await getPrompts();
      const prompts = promptsRes.prompts || [];

      if (prompts.length === 0) {
        setData({ isEmpty: true });
        setLoading(false);
        return;
      }

      const totalPrompts = prompts.length;
      const totalTested = prompts.filter((p) => p.responses && p.responses.length > 0).length;

      const pScores = prompts.map((p) => p.promptScores?.overall || 0).filter((s) => s > 0);
      const avgPromptScore = pScores.length > 0 ? Math.round(pScores.reduce((a, b) => a + b, 0) / pScores.length) : 0;

      // Technique counts and performance
      const techCounts = {};
      const techScores = {};

      prompts.forEach((p) => {
        const t = p.technique || 'Standard';
        techCounts[t] = (techCounts[t] || 0) + 1;
        if (!techScores[t]) techScores[t] = [];
        if (p.finalScore || p.promptScores?.overall) {
          techScores[t].push(p.finalScore || p.promptScores.overall);
        }
      });

      let bestPerformingTechnique = 'Role-Based';
      let maxAvg = 0;
      Object.entries(techScores).forEach(([tech, scores]) => {
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg > maxAvg) {
            maxAvg = avg;
            bestPerformingTechnique = tech;
          }
        }
      });

      // Chart 1: Prompts Over Time
      const timeMap = {};
      prompts.forEach((p) => {
        const dateStr = new Date(p.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!timeMap[dateStr]) {
          timeMap[dateStr] = { date: dateStr, count: 0, scores: [] };
        }
        timeMap[dateStr].count += 1;
        if (p.finalScore || p.promptScores?.overall) {
          timeMap[dateStr].scores.push(p.finalScore || p.promptScores.overall);
        }
      });

      const promptsOverTime = Object.values(timeMap).map((d) => ({
        date: d.date,
        avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 75,
      }));

      // Chart 2: Technique Breakdown
      const techniqueBreakdown = Object.entries(techCounts).map(([name, count]) => {
        const scores = techScores[name] || [];
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
        return { name, count, avgScore: avg };
      });

      setData({
        isEmpty: false,
        metrics: {
          totalPrompts,
          totalTested,
          avgPromptScore,
          bestPerformingTechnique,
        },
        charts: {
          promptsOverTime,
          techniqueBreakdown,
        },
      });
    } catch (err) {
      showToast('Failed to calculate analytics.', 'error');
      setData({ isEmpty: true });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading analytics metrics...</div>;
  }

  if (!data || data.isEmpty) {
    return (
      <div className="glass-panel p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Analytics Yet</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Create, analyze, and test your first prompt in <strong>Prompt Studio</strong> to unlock real-time benchmarking analytics.
        </p>
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Analytics & Benchmarks</span>
        </h1>
        <p className="text-xs text-slate-400">Quantitative insights on prompt performance and LLM technique accuracy</p>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Total Prompts</span>
            <span className="text-2xl font-extrabold text-slate-100">{metrics.totalPrompts}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Tested with Gemini</span>
            <span className="text-2xl font-extrabold text-slate-100">{metrics.totalTested}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Avg Quality Score</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{metrics.avgPromptScore}/100</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Best Technique</span>
            <span className="text-sm font-bold text-amber-300">{metrics.bestPerformingTechnique}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Prompts Created & Score Trend */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Prompt Quality Score Trend Over Time</span>
            </h3>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.promptsOverTime}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Technique Performance Breakdown */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Technique Performance Comparison</span>
            </h3>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.techniqueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="avgScore" name="Avg Heuristic Score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
