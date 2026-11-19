const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addPromptToCollection,
  removePromptFromCollection,
} = require('../controllers/collectionController');

router.use(protect);

router.get('/', getCollections);
router.post('/', createCollection);
router.get('/:id', getCollectionById);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);
router.post('/:id/prompts', addPromptToCollection);
router.delete('/:id/prompts/:promptId', removePromptFromCollection);

module.exports = router;
