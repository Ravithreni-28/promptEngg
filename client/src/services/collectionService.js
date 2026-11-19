import API from './api';

// ─── Get All Collections (with real itemCounts from backend) ──────────────────
export const getCollections = async () => {
  const response = await API.get('/collections');
  if (response.data?.success && Array.isArray(response.data?.collections)) {
    return { success: true, collections: response.data.collections };
  }
  return { success: false, collections: [] };
};

// ─── Get Collection By ID (with prompts) ─────────────────────────────────────
export const getCollectionById = async (id) => {
  try {
    const response = await API.get(`/collections/${id}`);
    return response.data;
  } catch (err) {
    return { success: false, collection: null };
  }
};

// ─── Create Collection ────────────────────────────────────────────────────────
export const createCollection = async (data) => {
  const response = await API.post('/collections', data);
  if (response.data?.success && response.data?.collection) {
    return { success: true, collection: response.data.collection };
  }
  throw new Error(response.data?.message || 'Failed to create collection.');
};

// ─── Update Collection ────────────────────────────────────────────────────────
export const updateCollection = async (id, data) => {
  const response = await API.put(`/collections/${id}`, data);
  if (response.data?.success) return response.data;
  throw new Error(response.data?.message || 'Failed to update collection.');
};

// ─── Delete Collection ────────────────────────────────────────────────────────
export const deleteCollection = async (id) => {
  const response = await API.delete(`/collections/${id}`);
  if (response.data?.success) return response.data;
  throw new Error(response.data?.message || 'Failed to delete collection.');
};

// ─── Add Prompt to Collection ─────────────────────────────────────────────────
export const addPromptToCollection = async (collectionId, promptId) => {
  const response = await API.post(`/collections/${collectionId}/prompts`, { promptId });
  if (response.data?.success) return response.data;
  throw new Error(response.data?.message || 'Failed to add prompt to collection.');
};

// ─── Remove Prompt from Collection ───────────────────────────────────────────
export const removePromptFromCollection = async (collectionId, promptId) => {
  const response = await API.delete(`/collections/${collectionId}/prompts/${promptId}`);
  if (response.data?.success) return response.data;
  throw new Error(response.data?.message || 'Failed to remove prompt from collection.');
};
