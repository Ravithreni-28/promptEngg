const Collection = require('../models/Collection');
const Prompt = require('../models/Prompt');
const { getDBStatus } = require('../config/db');

const inMemoryCollections = [
  { _id: 'col_1', name: 'Coding Prompts', description: 'Prompts for software development and debugging', color: '#3b82f6', icon: 'Code' },
  { _id: 'col_2', name: 'Study Prompts', description: 'Prompts for learning, summarizing & exam prep', color: '#10b981', icon: 'BookOpen' },
  { _id: 'col_3', name: 'Research Prompts', description: 'Academic analysis and paper summaries', color: '#8b5cf6', icon: 'Search' },
  { _id: 'col_4', name: 'Content Writing', description: 'Blogs, emails, and social media copy', color: '#f59e0b', icon: 'PenTool' },
];

// GET /api/collections
const getCollections = async (req, res) => {
  try {
    const userId = req.user._id;

    if (getDBStatus()) {
      const collections = await Collection.find({ userId }).sort({ createdAt: -1 });

      const collectionsWithCount = await Promise.all(
        collections.map(async (col) => {
          const count = await Prompt.countDocuments({ collectionId: col._id });
          return {
            ...col.toObject(),
            itemCount: count,
          };
        })
      );

      return res.json({ success: true, collections: collectionsWithCount });
    } else {
      const cols = inMemoryCollections.map((c) => ({ ...c, userId, itemCount: 2 }));
      return res.json({ success: true, collections: cols });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/collections
const createCollection = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Collection name is required.' });

    if (getDBStatus()) {
      const col = await Collection.create({
        name,
        description: description || '',
        color: color || '#3b82f6',
        icon: icon || 'Folder',
        userId: req.user._id,
      });

      return res.status(201).json({ success: true, collection: col });
    } else {
      const newCol = {
        _id: 'col_' + Date.now(),
        name,
        description: description || '',
        color: color || '#3b82f6',
        icon: icon || 'Folder',
        userId: req.user._id,
        itemCount: 0,
        createdAt: new Date(),
      };
      inMemoryCollections.push(newCol);
      return res.status(201).json({ success: true, collection: newCol });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/collections/:id
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const col = await Collection.findOneAndUpdate({ _id: id, userId: req.user._id }, req.body, { new: true });
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });
      return res.json({ success: true, collection: col });
    } else {
      const col = inMemoryCollections.find((c) => c._id === id);
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found.' });
      Object.assign(col, req.body);
      return res.json({ success: true, collection: col });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/collections/:id
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const deleted = await Collection.findOneAndDelete({ _id: id, userId: req.user._id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Collection not found.' });

      // Unassign prompts from this collection
      await Prompt.updateMany({ collectionId: id }, { collectionId: null });

      return res.json({ success: true, message: 'Collection deleted successfully.' });
    } else {
      const idx = inMemoryCollections.findIndex((c) => c._id === id);
      if (idx !== -1) inMemoryCollections.splice(idx, 1);
      return res.json({ success: true, message: 'Collection deleted.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};
