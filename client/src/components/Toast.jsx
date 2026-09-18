import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  const { type, message } = toast;

  const bgStyle =
    type === 'success'
      ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
      : type === 'error'
      ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
      : 'bg-slate-900/90 border-indigo-500/50 text-indigo-200';

  const icon =
    type === 'success' ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    ) : type === 'error' ? (
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
    ) : (
      <Info className="w-5 h-5 text-indigo-400 shrink-0" />
    );

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-slide-up ${bgStyle}`}>
      {icon}
      <span className="text-sm font-medium leading-relaxed flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
};

export default Toast;
