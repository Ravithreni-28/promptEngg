import React from 'react';
import { X, FileText, FileCode, FileSpreadsheet, Download } from 'lucide-react';
import { exportToTXT, exportToJSON, exportToCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';

const ExportModal = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();

  if (!isOpen || !data) return null;

  const handleExport = (format) => {
    try {
      if (format === 'txt') exportToTXT(data);
      if (format === 'json') exportToJSON(data);
      if (format === 'csv') exportToCSV(data);

      showToast(`Exported report as ${format.toUpperCase()} successfully!`, 'success');
      onClose();
    } catch (err) {
      showToast(`Failed to export: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-100">Export Prompt Results</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Select your preferred file format to download the prompt, quality scores, variations, AI response, and recommendation details.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleExport('txt')}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-300">Plain Text (.txt)</h4>
                <p className="text-xs text-slate-400">Human-readable structured text report</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </button>

          <button
            onClick={() => handleExport('json')}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 hover:bg-purple-600/20 border border-slate-700/60 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200 group-hover:text-purple-300">JSON Data (.json)</h4>
                <p className="text-xs text-slate-400">Complete raw structured data payload</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200 group-hover:text-emerald-300">CSV Table (.csv)</h4>
                <p className="text-xs text-slate-400">Tabular format for Excel / Google Sheets</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
