import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Folder,
  Trash2,
  Edit2,
  ArrowRight,
  ExternalLink,
  X,
  Star,
  MinusCircle,
  PlusCircle,
  Search,
  Eye,
} from 'lucide-react';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addPromptToCollection,
  removePromptFromCollection,
} from '../services/collectionService';
import { getPrompts } from '../services/promptService';
import PromptDetailModal from '../components/PromptDetailModal';
import { useToast } from '../context/ToastContext';

const COLOR_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [selectedDetailPrompt, setSelectedDetailPrompt] = useState(null);

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  // ── Edit Modal ────────────────────────────────────────────────────────────
  const [editingCollection, setEditingCollection] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  // ── Manage Modal (view/remove prompts inside a collection) ────────────────
  const [manageCollection, setManageCollection] = useState(null);
  const [collectionPrompts, setCollectionPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // ── Add-Prompts Sub-panel (pick from all user prompts) ────────────────────
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [allPrompts, setAllPrompts] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  // ── Fetch collections ─────────────────────────────────────────────────────
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCollections();
      if (res.success) setCollections(res.collections || []);
    } catch (err) {
      showToast('Failed to load collections.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Auto-refresh collections and counts when returning to this tab
  useEffect(() => {
    const onFocus = () => fetchCollections();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCollections]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Collection name is required.', 'error'); return; }
    setCreating(true);
    try {
      const res = await createCollection({ name: name.trim(), description: description.trim(), color });
      if (res.success) {
        setCollections([res.collection, ...collections]);
        setName(''); setDescription(''); setColor('#3b82f6');
        setShowCreateModal(false);
        showToast('Collection created successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to create collection.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleOpenEdit = (col) => {
    setEditingCollection(col);
    setEditName(col.name);
    setEditDescription(col.description || '');
    setEditColor(col.color || '#3b82f6');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCollection || !editName.trim()) { showToast('Collection name is required.', 'error'); return; }
    setSaving(true);
    try {
      const res = await updateCollection(editingCollection._id, {
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor,
      });
      if (res.success) {
        setCollections(collections.map((c) =>
          c._id === editingCollection._id ? { ...c, ...res.collection } : c
        ));
        setEditingCollection(null);
        showToast('Collection updated!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update collection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection? Prompts inside will NOT be deleted — only unassigned.')) return;
    try {
      const res = await deleteCollection(id);
      if (res.success) {
        setCollections(collections.filter((c) => c._id !== id));
        if (manageCollection?._id === id) setManageCollection(null);
        showToast('Collection deleted.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete collection.', 'error');
    }
  };

  // ── Open Manage Modal ─────────────────────────────────────────────────────
  const handleOpenManage = async (col) => {
    setManageCollection(col);
    setShowAddPanel(false);
    setAddSearch('');
    setLoadingPrompts(true);
    try {
      const res = await getPrompts({ collectionId: col._id });
      setCollectionPrompts(res.prompts || []);
    } catch (err) {
      showToast('Failed to load collection prompts.', 'error');
    } finally {
      setLoadingPrompts(false);
    }
  };

  // ── Remove a prompt from a collection ────────────────────────────────────
  const handleRemovePrompt = async (promptId) => {
    if (!manageCollection) return;
    try {
      const res = await removePromptFromCollection(manageCollection._id, promptId);
      if (res.success) {
        setCollectionPrompts(collectionPrompts.filter((p) => p._id !== promptId));
        // Update itemCount on the card
        setCollections(collections.map((c) =>
          c._id === manageCollection._id
            ? { ...c, itemCount: typeof res.itemCount === 'number' ? res.itemCount : Math.max(0, (c.itemCount || 1) - 1) }
            : c
        ));
        // Keep the manage modal's header in sync
        setManageCollection((prev) => ({
          ...prev,
          itemCount: typeof res.itemCount === 'number' ? res.itemCount : Math.max(0, (prev.itemCount || 1) - 1),
        }));
        showToast('Prompt removed from collection.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove prompt.', 'error');
    }
  };

  // ── Open "Add Prompts" sub-panel ──────────────────────────────────────────
  const handleOpenAddPanel = async () => {
    setShowAddPanel(true);
    setLoadingAll(true);
    try {
      const res = await getPrompts();
      setAllPrompts(res.prompts || []);
    } catch (err) {
      showToast('Failed to load prompts.', 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  // ── Add a prompt to the current collection ────────────────────────────────
  const handleAddPrompt = async (promptId) => {
    if (!manageCollection) return;
    // Already in this collection?
    if (collectionPrompts.some((p) => p._id === promptId)) {
      showToast('This prompt is already in the collection.', 'info');
      return;
    }
    try {
      const res = await addPromptToCollection(manageCollection._id, promptId);
      if (res.success) {
        // Refresh the collection prompts list
        const refreshed = await getPrompts({ collectionId: manageCollection._id });
        setCollectionPrompts(refreshed.prompts || []);
        // Update itemCount on card
        setCollections(collections.map((c) =>
          c._id === manageCollection._id
            ? { ...c, itemCount: typeof res.itemCount === 'number' ? res.itemCount : (c.itemCount || 0) + 1 }
            : c
        ));
        setManageCollection((prev) => ({
          ...prev,
          itemCount: typeof res.itemCount === 'number' ? res.itemCount : (prev.itemCount || 0) + 1,
        }));
        showToast('Prompt added to collection!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to add prompt.', 'error');
    }
  };

  // Prompts not yet in this collection (for the "add" panel)
  const inCollectionIds = new Set(collectionPrompts.map((p) => p._id));
  const addablePrompts = allPrompts.filter((p) => {
    if (inCollectionIds.has(p._id)) return false;
    if (!addSearch.trim()) return true;
    const s = addSearch.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(s)) ||
      (p.originalPrompt && p.originalPrompt.toLowerCase().includes(s))
    );
  });

  // Filter collections by search query
  const filteredCollections = collections.filter((c) => {
    if (!collectionSearch.trim()) return true;
    const q = collectionSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>Prompt Collections &amp; Organization</span>
          </h1>
          <p className="text-xs text-slate-400">
            Organize prompts by domain, course, or project category with custom tags and colors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search collections..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-105 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Collection Cards */}
      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="glass-panel p-8 text-center space-y-3">
          <p className="text-slate-400 text-sm">No collections created yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Create Your First Collection
          </button>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="glass-panel p-8 text-center space-y-2">
          <p className="text-slate-400 text-sm">No collections match "{collectionSearch}".</p>
          <button
            onClick={() => setCollectionSearch('')}
            className="text-xs text-indigo-400 hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((col) => (
            <div key={col._id} className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                    style={{ backgroundColor: col.color || '#3b82f6' }}
                  >
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(col)}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 transition-colors rounded-lg hover:bg-slate-800"
                      title="Edit Collection"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(col._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100">{col.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {col.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-mono font-semibold">
                  {col.itemCount || 0} Prompt{col.itemCount !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenManage(col)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => navigate(`/history?collectionId=${col._id}`)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 1. Create Modal ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-400" />
                <span>Create New Collection</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Research Prompts"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Prompts for AI system development and benchmarking"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
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
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {creating ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Edit Modal ─────────────────────────────────────────────────── */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <span>Edit Collection</span>
              </h3>
              <button onClick={() => setEditingCollection(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Manage Modal ───────────────────────────────────────────────── */}
      {manageCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: manageCollection.color || '#3b82f6' }}
                >
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{manageCollection.name}</h3>
                  <span className="text-xs text-slate-400">
                    {collectionPrompts.length} prompt{collectionPrompts.length !== 1 ? 's' : ''} in this collection
                  </span>
                </div>
              </div>
              <button
                onClick={() => setManageCollection(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle: show current prompts OR add-prompts panel */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowAddPanel(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !showAddPanel
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Collection Prompts
              </button>
              <button
                onClick={handleOpenAddPanel}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  showAddPanel
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Existing Prompts
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {/* ── Current Prompts panel ── */}
              {!showAddPanel && (
                <>
                  {loadingPrompts ? (
                    <div className="text-center py-8 text-xs text-slate-400">Loading prompts...</div>
                  ) : collectionPrompts.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-slate-400 text-xs">No prompts in this collection yet.</p>
                      <button
                        onClick={handleOpenAddPanel}
                        className="text-xs font-bold text-indigo-400 hover:underline"
                      >
                        + Add existing prompts
                      </button>
                    </div>
                  ) : (
                    collectionPrompts.map((p) => (
                      <div
                        key={p._id}
                        className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700"
                      >
                        <div className="space-y-1 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-200">{p.title || 'Untitled Prompt'}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              {p.technique || 'Standard'}
                            </span>
                            {p.favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-xs text-slate-400 font-mono line-clamp-2">"{p.originalPrompt}"</p>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Score: {p.finalScore || p.promptScores?.overall || 0}/100
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedDetailPrompt(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors"
                            title="View Full Prompt Details"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setManageCollection(null);
                              navigate('/studio', { state: { loadPrompt: p } });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition-colors"
                            title="Open in Prompt Studio"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Studio</span>
                          </button>
                          <button
                            onClick={() => handleRemovePrompt(p._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                            title="Remove from collection"
                          >
                            <MinusCircle className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* ── Add Prompts panel ── */}
              {showAddPanel && (
                <>
                  {/* Search box */}
                  <div className="relative mb-2 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Search prompts by title or text..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {loadingAll ? (
                    <div className="text-center py-8 text-xs text-slate-400">Loading your prompts...</div>
                  ) : addablePrompts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      {allPrompts.length === 0
                        ? 'No saved prompts found. Analyze a prompt in Prompt Studio first.'
                        : 'All your prompts are already in this collection.'}
                    </div>
                  ) : (
                    addablePrompts.map((p) => (
                      <div
                        key={p._id}
                        className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-4 hover:border-indigo-500/40"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-200 truncate">{p.title || 'Untitled Prompt'}</span>
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              {p.technique || 'Standard'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate">"{p.originalPrompt}"</p>
                        </div>
                        <button
                          onClick={() => handleAddPrompt(p._id)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>{collectionPrompts.length} prompt{collectionPrompts.length !== 1 ? 's' : ''} assigned</span>
              <button
                onClick={() => {
                  setManageCollection(null);
                  navigate(`/history?collectionId=${manageCollection._id}`);
                }}
                className="font-bold text-indigo-400 hover:underline"
              >
                Open in Full History View →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Prompt Detail Modal ────────────────────────────────────────── */}
      {selectedDetailPrompt && (
        <PromptDetailModal
          prompt={selectedDetailPrompt}
          onClose={() => setSelectedDetailPrompt(null)}
        />
      )}
    </div>
  );
};

export default Collections;
