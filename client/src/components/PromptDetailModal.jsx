import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Star,
  Award,
  Sparkles,
  Folder,
  FileText,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

const PromptDetailModal = ({ prompt, onClose, onToggleFavorite }) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const navigate = useNavigate();

  if (!prompt) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenStudio = () => {
    onClose();
    navigate('/studio', { state: { loadPrompt: prompt } });
  };

  const colName =
    typeof prompt.collectionId === 'object' && prompt.collectionId !== null
      ? prompt.collectionId.name
      : null;

  const pScores = prompt.promptScores || {};
  const rScores = prompt.responseScores || {};
  const variations = prompt.variations || [];
  const responses = prompt.responses || [];
  const recommended = prompt.recommendedPrompt || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/80 sticky top-0 z-10">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white truncate">{prompt.title || 'Untitled Prompt'}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {prompt.technique || 'Standard'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">v{prompt.version || 1}</span>
              {colName && (
                <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>{colName}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Created {new Date(prompt.createdAt || Date.now()).toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(prompt._id)}
                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                title={prompt.favorite ? 'Unstar' : 'Star'}
              >
                <Star className={`w-4 h-4 ${prompt.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-300">
          {/* Section 1: Original Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Original Prompt</span>
              </span>
              <button
                onClick={() => handleCopy(prompt.originalPrompt, 'orig')}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copiedKey === 'orig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'orig' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-slate-100 whitespace-pre-wrap leading-relaxed select-all">
              {prompt.originalPrompt}
            </div>
          </div>

          {/* Section 2: Context & Metadata Grid */}
          {(prompt.task || prompt.context || prompt.desiredOutputFormat || prompt.tone || prompt.targetAudience) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              {prompt.task && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Task</span>
                  <span className="text-slate-200">{prompt.task}</span>
                </div>
              )}
              {prompt.context && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Context</span>
                  <span className="text-slate-200">{prompt.context}</span>
                </div>
              )}
              {prompt.desiredOutputFormat && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Output Format</span>
                  <span className="text-slate-200">{prompt.desiredOutputFormat}</span>
                </div>
              )}
              {prompt.tone && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tone</span>
                  <span className="text-slate-200">{prompt.tone}</span>
                </div>
              )}
              {prompt.targetAudience && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Target Audience</span>
                  <span className="text-slate-200">{prompt.targetAudience}</span>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Prompt Quality Scores */}
          {pScores.overall !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt Quality Evaluation</span>
                </span>
                <span className="font-bold text-emerald-400 text-sm">{pScores.overall || 0}/100</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Clarity', val: pScores.clarity },
                  { label: 'Specificity', val: pScores.specificity },
                  { label: 'Context', val: pScores.context },
                  { label: 'Completeness', val: pScores.completeness },
                  { label: 'Structure', val: pScores.structure },
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">{s.label}</span>
                    <strong className="text-xs text-white">{s.val ?? '-'}/20</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Recommended Best Prompt (if available) */}
          {recommended && recommended.promptText && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Recommended Best Prompt ({recommended.technique})</span>
                </span>
                <span className="font-bold text-amber-400">Final Score: {recommended.finalScore}/100</span>
              </div>
              <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap">
                {recommended.promptText}
              </p>
              {recommended.rationale && recommended.rationale.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-indigo-200/80 space-y-0.5">
                  {recommended.rationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Section 5: Optimized Variations (if available) */}
          {variations.length > 0 && (
            <div className="space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Optimized Variations ({variations.length})</span>
              </span>
              <div className="space-y-2">
                {variations.map((v, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-[11px]">{v.technique}</span>
                      <button
                        onClick={() => handleCopy(v.optimizedPrompt, 'var_' + idx)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === 'var_' + idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'var_' + idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-slate-200 leading-relaxed">{v.optimizedPrompt}</p>
                    {v.why && <p className="text-[10px] text-slate-400 italic">Why: {v.why}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: AI Responses (if available) */}
          {responses.length > 0 && (
            <div className="space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Gemini Responses ({responses.length})</span>
              </span>
              <div className="space-y-2">
                {responses.map((r, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{r.technique || 'AI Response'}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.model || 'gemini-2.5-flash'}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {r.responseText}
                    </div>
                    {r.scores && (
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                        <span>Relevance: {r.scores.relevance ?? '-'}/20</span>
                        <span>Clarity: {r.scores.clarity ?? '-'}/20</span>
                        <span>Completeness: {r.scores.completeness ?? '-'}/20</span>
                        <span>Score: <strong className="text-emerald-400">{r.scores.overall ?? '-'}/100</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 sticky bottom-0">
          <div className="text-xs text-slate-400 font-mono">
            Final Score: <strong className="text-amber-400">{prompt.finalScore || pScores.overall || 75}/100</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenStudio}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Reuse in Prompt Studio</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetailModal;

