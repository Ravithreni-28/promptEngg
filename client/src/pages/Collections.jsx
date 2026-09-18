import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Folder, Trash2, ArrowRight } from 'lucide-react';
import { getCollections, createCollection, deleteCollection } from '../services/collectionService';
import { useToast } from '../context/ToastContext';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await getCollections();
      if (res.success) setCollections(res.collections || []);
    } catch (err) {
      showToast('Failed to load collections.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      const res = await createCollection({ name, description, color });
      if (res.success) {
        setCollections([res.collection, ...collections]);
        setName('');
        setDescription('');
        setShowCreateModal(false);
        showToast('Collection created!', 'success');
      }
    } catch (err) {
      showToast('Failed to create collection.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection? Prompts inside will not be deleted.')) return;
    try {
      const res = await deleteCollection(id);
      if (res.success) {
        setCollections(collections.filter((c) => c._id !== id));
        showToast('Collection deleted.', 'info');
      }
    } catch (err) {
      showToast('Failed to delete collection.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>Prompt Collections</span>
          </h1>
          <p className="text-xs text-slate-400">Organize your prompts by domain, course, or project category</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">No collections created yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div key={col._id} className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: col.color || '#3b82f6' }}>
                    <Folder className="w-5 h-5" />
                  </div>
                  <button onClick={() => handleDelete(col._id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100">{col.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{col.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-mono font-semibold">{col.itemCount || 0} Prompts</span>
                <button
                  onClick={() => navigate(`/history?collectionId=${col._id}`)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  <span>View Prompts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="font-bold text-lg text-slate-100">Create New Collection</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Coding Prompts"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Prompts for software engineering"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
