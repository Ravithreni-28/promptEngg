import React, { useState } from 'react';
import { Bot, Copy, Check, RefreshCw, Download, Award, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ResponseCard = ({ responseData, onRegenerate, onExport }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!responseData) return null;

  const { responseText, model, timestamp, scores, isDemo } = responseData;

  const handleCopy = () => {
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    showToast('AI Response copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-6 space-y-6 border-indigo-500/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-100">AI Response Output</h3>
              {isDemo && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                  Demo Response
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Model: {model || 'gemini-2.5-flash'} • {new Date(timestamp || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Output Box */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-96 overflow-y-auto">
        {responseText}
      </div>

      {/* Response Quality Heuristic Score Card */}
      {scores && (
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-slate-200">Response Evaluation Quality</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/30">
              {scores.overall} / 100
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg text-center">
              <span className="text-slate-400 block">Relevance</span>
              <span className="font-bold text-slate-200">{scores.relevance}/20</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg text-center">
              <span className="text-slate-400 block">Completeness</span>
              <span className="font-bold text-slate-200">{scores.completeness}/20</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg text-center">
              <span className="text-slate-400 block">Clarity</span>
              <span className="font-bold text-slate-200">{scores.clarity}/20</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg text-center">
              <span className="text-slate-400 block">Structure</span>
              <span className="font-bold text-slate-200">{scores.structure}/20</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg text-center">
              <span className="text-slate-400 block">Instruction</span>
              <span className="font-bold text-slate-200">{scores.instructionFollowing}/20</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseCard;
