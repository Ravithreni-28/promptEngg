const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} = require('../controllers/collectionController');

router.use(protect);

router.get('/', getCollections);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

module.exports = router;
