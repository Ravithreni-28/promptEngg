import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, History as HistoryIcon, Star, Trash2, ExternalLink, ArrowUpDown } from 'lucide-react';
import { getPrompts, deletePrompt, toggleFavorite } from '../services/promptService';
import { useToast } from '../context/ToastContext';

const History = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [techniqueFilter, setTechniqueFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const collectionIdParam = queryParams.get('collectionId');

  useEffect(() => {
    fetchHistory();
  }, [searchTerm, techniqueFilter, sortBy, collectionIdParam]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getPrompts({ search: searchTerm, technique: techniqueFilter, sortBy, collectionId: collectionIdParam });
      if (res.success) {
        setPrompts(res.prompts || []);
      }
    } catch (err) {
      showToast('Failed to load prompt history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prompt from history?')) return;
    try {
      const res = await deletePrompt(id);
      if (res.success) {
        setPrompts(prompts.filter((p) => p._id !== id));
        showToast('Prompt deleted successfully.', 'success');
      }
    } catch (err) {
      showToast('Failed to delete prompt.', 'error');
    }
  };

  const handleToggleFav = async (id) => {
    try {
      const res = await toggleFavorite(id);
      if (res.success) {
        setPrompts(prompts.map((p) => (p._id === id ? { ...p, favorite: res.favorite } : p)));
        showToast(res.favorite ? 'Added to favorites!' : 'Removed from favorites', 'info');
      }
    } catch (err) {
      showToast('Failed to update favorite status.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-400" />
            <span>Prompt History & Logs</span>
          </h1>
          <p className="text-xs text-slate-400">Search, filter, inspect past runs, and view version histories</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt text, technique, or tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={techniqueFilter}
            onChange={(e) => setTechniqueFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Techniques</option>
            <option value="Role-Based">Role-Based</option>
            <option value="Step-by-Step">Step-by-Step</option>
            <option value="Clear & Concise">Clear & Concise</option>
            <option value="Structured">Structured</option>
            <option value="Detailed">Detailed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest_score">Sort: Highest Score</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            Search
          </button>
        </div>
      </form>

      {/* Prompts History Table / List */}
      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading history...</div>
      ) : prompts.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">No prompt executions found matching your query.</div>
      ) : (
        <div className="space-y-4">
          {prompts.map((p) => (
            <div key={p._id} className="glass-card p-5 space-y-4 hover:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-100">{p.title || 'Untitled Prompt'}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {p.technique || 'Standard'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{p.version || 1}</span>
                    {p.collectionId && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        📁 {p.collectionId.name || 'Collection'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed line-clamp-2">"{p.originalPrompt}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFav(p._id)}
                    className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${p.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => navigate('/studio', { state: { loadPrompt: p } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Studio</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scores Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-4 font-mono">
                  <span>Prompt Score: <strong className="text-emerald-400">{p.promptScores?.overall || 75}/100</strong></span>
                  <span>Responses: <strong className="text-purple-400">{p.responses ? p.responses.length : 0}</strong></span>
                  <span>Final Score: <strong className="text-amber-400">{p.finalScore || 75}/100</strong></span>
                </div>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
