import API from './api';

const STORAGE_KEY = 'ai_prompt_studio_collections';

const DEFAULT_INITIAL_COLLECTIONS = [
  { _id: 'col_1', name: 'Coding Prompts', description: 'Software development, algorithms, and refactoring prompts', color: '#3b82f6', icon: 'Code' },
  { _id: 'col_2', name: 'Study & Learning', description: 'Educational summaries, quizzes, and course outlines', color: '#10b981', icon: 'BookOpen' },
  { _id: 'col_3', name: 'Research Prompts', description: 'Academic analysis and paper summaries', color: '#8b5cf6', icon: 'Search' },
  { _id: 'col_4', name: 'Professional Writing', description: 'Emails, proposals, and communication templates', color: '#f59e0b', icon: 'PenTool' },
];

const getLocalCollections = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_COLLECTIONS));
    return DEFAULT_INITIAL_COLLECTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_INITIAL_COLLECTIONS;
  }
};

const setLocalCollections = (collections) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
};

export const getCollections = async () => {
  let collections = [];
  try {
    const response = await API.get('/collections');
    if (response.data?.success && Array.isArray(response.data?.collections)) {
      collections = response.data.collections;
    }
  } catch (err) {
    console.warn('[Collections API Warning]: Loading local state.');
  }

  if (!collections || collections.length === 0) {
    collections = getLocalCollections();
  } else {
    setLocalCollections(collections);
  }

  // Count prompt items per collection
  const storedPrompts = JSON.parse(localStorage.getItem('ai_prompt_studio_prompts') || '[]');

  const colsWithCounts = collections.map((col) => {
    const count = storedPrompts.filter(
      (p) => String(p.collectionId) === String(col._id) || String(p.collectionId?._id) === String(col._id)
    ).length;
    return {
      ...col,
      itemCount: count,
    };
  });

  return { success: true, collections: colsWithCounts };
};

export const createCollection = async (data) => {
  let newCol = null;
  try {
    const response = await API.post('/collections', data);
    if (response.data?.success) {
      newCol = response.data.collection;
    }
  } catch (err) {
    console.warn('[Create Collection API Warning]: Using local fallback.');
  }

  const collections = getLocalCollections();
  const created = newCol || {
    _id: 'col_' + Date.now(),
    name: data.name,
    description: data.description || '',
    color: data.color || '#3b82f6',
    icon: data.icon || 'Folder',
    createdAt: new Date().toISOString(),
  };

  collections.unshift(created);
  setLocalCollections(collections);
  return { success: true, collection: { ...created, itemCount: 0 } };
};

export const updateCollection = async (id, data) => {
  try {
    const response = await API.put(`/collections/${id}`, data);
    if (response.data?.success) return response.data;
  } catch (err) {
    // fallback
  }

  const collections = getLocalCollections();
  const idx = collections.findIndex((c) => c._id === id);
  if (idx !== -1) {
    collections[idx] = { ...collections[idx], ...data };
    setLocalCollections(collections);
    return { success: true, collection: collections[idx] };
  }
  return { success: false, message: 'Collection not found' };
};

export const deleteCollection = async (id) => {
  try {
    await API.delete(`/collections/${id}`);
  } catch (err) {
    // fallback
  }

  const collections = getLocalCollections();
  const updated = collections.filter((c) => c._id !== id);
  setLocalCollections(updated);
  return { success: true, message: 'Collection deleted' };
};
