const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyzePromptApi,
  optimizePromptApi,
  generateResponseApi,
  evaluateResponseApi,
  comparePromptsApi,
  createPrompt,
  getPrompts,
  getPromptById,
  updatePrompt,
  deletePrompt,
  toggleFavorite,
} = require('../controllers/promptController');

// Public / Protected Engine endpoints
router.post('/analyze', analyzePromptApi);
router.post('/optimize', optimizePromptApi);
router.post('/generate', generateResponseApi);
router.post('/evaluate', evaluateResponseApi);
router.post('/compare', comparePromptsApi);

// Prompt Management (History / Favorites / Versions)
router.use(protect);
router.get('/', getPrompts);
router.post('/', createPrompt);
router.get('/:id', getPromptById);
router.put('/:id', updatePrompt);
router.delete('/:id', deletePrompt);
router.post('/:id/favorite', toggleFavorite);

module.exports = router;
