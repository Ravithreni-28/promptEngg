import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { getPrompts, toggleFavorite } from '../services/promptService';
import PromptDetailModal from '../components/PromptDetailModal';
import { useToast } from '../context/ToastContext';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedDetailPrompt, setSelectedDetailPrompt] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Auto-refresh favorites when returning to this tab
  useEffect(() => {
    const onFocus = () => fetchFavorites();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await getPrompts({ favorite: 'true' });
      if (res.success) setFavorites(res.prompts || []);
    } catch (err) {
      showToast('Failed to load favorite prompts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Prompt copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveFavorite = async (id) => {
    try {
      const res = await toggleFavorite(id);
      if (res.success) {
        setFavorites(favorites.filter((f) => f._id !== id));
        showToast('Removed from favorites.', 'info');
      }
    } catch (err) {
      showToast('Failed to remove favorite.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
          <span>Starred Favorite Prompts</span>
        </h1>
        <p className="text-xs text-slate-400">Quick access library for your highest-scoring prompts</p>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">
          No favorite prompts starred yet. Star prompts in Studio to keep them pinned here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((fav) => (
            <div key={fav._id} className="glass-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-slate-100">{fav.title}</span>
                  <button onClick={() => handleRemoveFavorite(fav._id)} className="p-1 text-amber-400 hover:opacity-75">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </button>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-28 overflow-y-auto">
                  "{fav.originalPrompt}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="font-mono text-emerald-400 font-bold">
                  Score: {fav.finalScore || fav.promptScores?.overall || 85}/100
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDetailPrompt(fav)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Full Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => handleCopy(fav.originalPrompt, fav._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedId === fav._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === fav._id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => navigate('/studio', { state: { loadPrompt: fav } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold hover:bg-indigo-600/30 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailPrompt && (
        <PromptDetailModal
          prompt={selectedDetailPrompt}
          onClose={() => setSelectedDetailPrompt(null)}
          onToggleFavorite={(id, isFav) => {
            if (!isFav) {
              setFavorites((prev) => prev.filter((p) => p._id !== id));
            }
          }}
        />
      )}
    </div>
  );
};

export default Favorites;
