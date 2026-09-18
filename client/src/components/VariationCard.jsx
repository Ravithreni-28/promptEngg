import React, { useState } from 'react';
import { Copy, Check, Play, Sparkles, HelpCircle, Layers } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const VariationCard = ({ variation, onSelectForTesting, isSelected }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(variation.optimizedPrompt);
    setCopied(true);
    showToast('Optimized prompt copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTechniqueBadge = (tech) => {
    switch (tech) {
      case 'Role-Based':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Step-by-Step':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Clear & Concise':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'Structured':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div
      className={`glass-card relative flex flex-col justify-between space-y-4 transition-all duration-200 ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-800/90' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTechniqueBadge(variation.technique)}`}>
            {variation.technique}
          </span>
          {variation.promptScore && (
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">
              Score: {variation.promptScore}/100
            </span>
          )}
        </div>

        {/* Optimized Prompt Text */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
          {variation.optimizedPrompt}
        </div>

        {/* Why & Expected Use Case */}
        <div className="space-y-2 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
          <p>
            <strong className="text-slate-300 font-semibold">Why: </strong>
            {variation.why}
          </p>
          {variation.expectedUseCase && (
            <p>
              <strong className="text-indigo-300 font-semibold">Best Use Case: </strong>
              {variation.expectedUseCase}
            </p>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          onClick={() => onSelectForTesting && onSelectForTesting(variation)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>{isSelected ? 'Selected' : 'Test Prompt'}</span>
        </button>
      </div>
    </div>
  );
};

export default VariationCard;
