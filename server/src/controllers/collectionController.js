const Collection = require('../models/Collection');
const Prompt = require('../models/Prompt');
const { getDBStatus } = require('../config/db');
const memoryStore = require('../config/memoryStore');

const getPromptCollectionId = (p) => {
  if (!p || !p.collectionId) return null;
  if (typeof p.collectionId === 'object') return p.collectionId._id ? String(p.collectionId._id) : null;
  return String(p.collectionId);
};

// ─── GET /api/collections ─────────────────────────────────────────────────────
const getCollections = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const collections = await Collection.find({ userId }).sort({ createdAt: -1 });
      const collectionsWithCount = await Promise.all(
        collections.map(async (col) => {
          const count = await Prompt.countDocuments({ collectionId: col._id, userId });
          return { ...col.toObject(), itemCount: count };
        })
      );
      return res.json({ success: true, collections: collectionsWithCount });
    } else {
      const userCollections = memoryStore.collections.filter(
        (c) => String(c.userId) === String(userId)
      );
      const collectionsWithCount = userCollections.map((col) => {
        const count = memoryStore.prompts.filter(
          (p) => String(p.userId) === String(userId) && getPromptCollectionId(p) === String(col._id)
        ).length;
        return { ...col, itemCount: count };
      });
      return res.json({ success: true, collections: collectionsWithCount });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/collections/:id ─────────────────────────────────────────────────
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const col = await Collection.findOne({ _id: id, userId });
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });
      const count = await Prompt.countDocuments({ collectionId: id, userId });
      return res.json({ success: true, collection: { ...col.toObject(), itemCount: count } });
    } else {
      const col = memoryStore.collections.find(
        (c) => String(c._id) === String(id) && String(c.userId) === String(userId)
      );
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });
      const count = memoryStore.prompts.filter(
        (p) => String(p.userId) === String(userId) && getPromptCollectionId(p) === String(id)
      ).length;
      return res.json({ success: true, collection: { ...col, itemCount: count } });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/collections ────────────────────────────────────────────────────
const createCollection = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required.' });
    }

    if (getDBStatus()) {
      // Prevent duplicate name for same user
      const existing = await Collection.findOne({ userId, name: name.trim() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A collection with this name already exists.' });
      }
      const col = await Collection.create({
        name: name.trim(),
        description: description ? description.trim() : '',
        color: color || '#3b82f6',
        icon: icon || 'Folder',
        userId,
      });
      return res.status(201).json({ success: true, collection: { ...col.toObject(), itemCount: 0 } });
    } else {
      // Prevent duplicate name in memory
      const existing = memoryStore.collections.find(
        (c) => String(c.userId) === String(userId) && c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) {
        return res.status(409).json({ success: false, message: 'A collection with this name already exists.' });
      }
      const newCol = {
        _id: 'col_' + Date.now(),
        userId: String(userId),
        name: name.trim(),
        description: description ? description.trim() : '',
        color: color || '#3b82f6',
        icon: icon || 'Folder',
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.collections.unshift(newCol);
      memoryStore.logActivity(userId, 'CREATE_COLLECTION', `Created collection "${newCol.name}"`);
      memoryStore.persist();
      return res.status(201).json({ success: true, collection: newCol });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/collections/:id ─────────────────────────────────────────────────
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const { name, description, color, icon } = req.body;

    if (getDBStatus()) {
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (color) updateData.color = color;
      if (icon) updateData.icon = icon;

      const col = await Collection.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });

      const count = await Prompt.countDocuments({ collectionId: col._id, userId });
      return res.json({ success: true, collection: { ...col.toObject(), itemCount: count } });
    } else {
      const col = memoryStore.collections.find(
        (c) => String(c._id) === String(id) && String(c.userId) === String(userId)
      );
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });

      if (name) col.name = name.trim();
      if (description !== undefined) col.description = description.trim();
      if (color) col.color = color;
      if (icon) col.icon = icon;
      col.updatedAt = new Date().toISOString();

      const count = memoryStore.prompts.filter(
        (p) => String(p.userId) === String(userId) && getPromptCollectionId(p) === String(col._id)
      ).length;

      memoryStore.logActivity(userId, 'UPDATE_COLLECTION', `Updated collection "${col.name}"`);
      memoryStore.persist();
      return res.json({ success: true, collection: { ...col, itemCount: count } });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/collections/:id ─────────────────────────────────────────────
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const deleted = await Collection.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, message: 'Collection not found.' });
      // Unassign prompts — do NOT delete them
      await Prompt.updateMany({ collectionId: id, userId }, { collectionId: null });
      return res.json({ success: true, message: 'Collection deleted successfully.' });
    } else {
      const idx = memoryStore.collections.findIndex(
        (c) => String(c._id) === String(id) && String(c.userId) === String(userId)
      );
      if (idx === -1) return res.status(404).json({ success: false, message: 'Collection not found.' });
      const removed = memoryStore.collections.splice(idx, 1)[0];
      // Unassign prompts — do NOT delete them
      memoryStore.prompts.forEach((p) => {
        if (String(p.userId) === String(userId) && getPromptCollectionId(p) === String(id)) {
          p.collectionId = null;
          p.updatedAt = new Date().toISOString();
        }
      });
      memoryStore.logActivity(userId, 'DELETE_COLLECTION', `Deleted collection "${removed.name}"`);
      memoryStore.persist();
      return res.json({ success: true, message: 'Collection deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/collections/:id/prompts  (Add prompt to collection) ─────────────
const addPromptToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { promptId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!promptId) return res.status(400).json({ success: false, message: 'promptId is required.' });

    if (getDBStatus()) {
      const col = await Collection.findOne({ _id: id, userId });
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });

      const prompt = await Prompt.findOne({ _id: promptId, userId });
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });

      prompt.collectionId = id;
      await prompt.save();

      const count = await Prompt.countDocuments({ collectionId: id, userId });
      return res.json({ success: true, message: 'Prompt added to collection.', itemCount: count });
    } else {
      const col = memoryStore.collections.find(
        (c) => String(c._id) === String(id) && String(c.userId) === String(userId)
      );
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });

      const prompt = memoryStore.prompts.find(
        (p) => String(p._id) === String(promptId) && String(p.userId) === String(userId)
      );
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });

      prompt.collectionId = String(id);
      prompt.updatedAt = new Date().toISOString();

      const count = memoryStore.prompts.filter(
        (p) => String(p.userId) === String(userId) && getPromptCollectionId(p) === String(id)
      ).length;

      memoryStore.logActivity(userId, 'ADD_TO_COLLECTION', `Added prompt to "${col.name}"`);
      memoryStore.persist();
      return res.json({ success: true, message: 'Prompt added to collection.', itemCount: count });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/collections/:id/prompts/:promptId  (Remove from collection) ──
const removePromptFromCollection = async (req, res) => {
  try {
    const { id, promptId } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: promptId, userId, collectionId: id });
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found in collection.' });

      prompt.collectionId = null;
      await prompt.save();

      const count = await Prompt.countDocuments({ collectionId: id, userId });
      return res.json({ success: true, message: 'Prompt removed from collection.', itemCount: count });
    } else {
      const prompt = memoryStore.prompts.find(
        (p) =>
          String(p._id) === String(promptId) &&
          String(p.userId) === String(userId) &&
          getPromptCollectionId(p) === String(id)
      );
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found in collection.' });

      prompt.collectionId = null;
      prompt.updatedAt = new Date().toISOString();

      const col = memoryStore.collections.find(
        (c) => String(c._id) === String(id) && String(c.userId) === String(userId)
      );
      const count = memoryStore.prompts.filter(
        (p) => String(p.userId) === String(userId) && getPromptCollectionId(p) === String(id)
      ).length;

      if (col) memoryStore.logActivity(userId, 'REMOVE_FROM_COLLECTION', `Removed prompt from "${col.name}"`);
      memoryStore.persist();
      return res.json({ success: true, message: 'Prompt removed from collection.', itemCount: count });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addPromptToCollection,
  removePromptFromCollection,
};
