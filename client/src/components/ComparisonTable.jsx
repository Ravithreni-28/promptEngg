import React from 'react';
import { Trophy, CheckCircle2, ArrowRight, Sparkles, Star } from 'lucide-react';

const ComparisonTable = ({ comparisonData, onUsePrompt }) => {
  if (!comparisonData || !comparisonData.recommendedPrompt) return null;

  const { items = [], recommendedPrompt } = comparisonData;

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Recommended Best Prompt Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-500/40 rounded-2xl p-6 relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                  Recommended Best Prompt
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Top Ranked
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                Technique: {recommendedPrompt.technique}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Final Score</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {recommendedPrompt.finalScore} / 100
            </span>
          </div>
        </div>

        {/* Prompt Preview */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 font-mono text-sm text-slate-200 leading-relaxed">
          "{recommendedPrompt.promptText}"
        </div>

        {/* Why this prompt was recommended */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why this prompt was recommended:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
              {recommendedPrompt.rationale.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => onUsePrompt && onUsePrompt(recommendedPrompt.promptText)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <span>Use This Prompt</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transparent Formula Note */}
      <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
        <span>
          <strong className="text-slate-300">Transparent Ranking Formula:</strong> Final Score = (Prompt Quality Score × 0.4) + (Response Quality Score × 0.6)
        </span>
        <span className="text-slate-500 hidden md:inline">Application Heuristic Evaluator</span>
      </div>

      {/* Comparison Grid */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-200 text-sm">All Compared Variations ({items.length})</h4>
        <div className="grid grid-cols-1 gap-3">
          {items.map((item, index) => {
            const isWinner = item.technique === recommendedPrompt.technique;
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isWinner ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">{item.technique}</span>
                    {isWinner && (
                      <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                        Winner
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-300 line-clamp-2">"{item.promptText}"</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-center bg-slate-950/60 px-3 py-1.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Prompt Q.</span>
                    <span className="font-bold text-indigo-300">{item.promptScore}</span>
                  </div>
                  <div className="text-center bg-slate-950/60 px-3 py-1.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Response Q.</span>
                    <span className="font-bold text-purple-300">{item.responseScore}</span>
                  </div>
                  <div className="text-center bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Final</span>
                    <span className="font-extrabold text-amber-400">{item.finalScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
