import React from 'react';
import { Award, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

const ScoreCard = ({ scores }) => {
  if (!scores) return null;

  const { overall = 0, clarity = 0, specificity = 0, context = 0, completeness = 0, structure = 0, suggestions = [] } = scores;

  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (val >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getProgressColor = (val) => {
    if (val >= 16) return 'bg-emerald-500';
    if (val >= 12) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const categories = [
    { label: 'Clarity', score: clarity, desc: 'Direct instructions & verb usage' },
    { label: 'Specificity', score: specificity, desc: 'Constraints & exact guidelines' },
    { label: 'Context', score: context, desc: 'Background & persona role definition' },
    { label: 'Completeness', score: completeness, desc: 'Format, audience & task coverage' },
    { label: 'Structure', score: structure, desc: 'Paragraphs, headers & bullet steps' },
  ];

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Prompt Quality Analysis</h3>
            <p className="text-xs text-slate-400">Heuristic assessment across 5 core engineering dimensions</p>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${getScoreColor(overall)}`}>
          <span className="text-2xl font-extrabold">{overall}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.label} className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-200">{cat.label}</span>
              <span className="font-mono text-xs font-bold text-slate-300">{cat.score} / 20</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(cat.score)}`}
                style={{ width: `${(cat.score / 20) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{cat.desc}</p>
          </div>
        ))}
      </div>

      {/* Improvement Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <span>Recommended Improvements</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-slate-300">
            {suggestions.map((sug, idx) => (
              <li key={idx} className="leading-relaxed">{sug}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
