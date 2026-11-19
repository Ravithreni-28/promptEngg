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
  getPromptsHistory,
  getPromptStats,
  getPromptById,
  updatePrompt,
  deletePrompt,
  deleteAllPrompts,
  toggleFavorite,
} = require('../controllers/promptController');

// Public / Protected Engine endpoints
router.post('/analyze', analyzePromptApi);
router.post('/optimize', optimizePromptApi);
router.post('/generate', generateResponseApi);
router.post('/evaluate', evaluateResponseApi);
router.post('/compare', comparePromptsApi);

// Prompt Management (History / Stats / Versions) - must come before /:id
router.use(protect);
router.get('/', getPrompts);
router.get('/history', getPromptsHistory);
router.get('/stats', getPromptStats);
router.post('/', createPrompt);
router.delete('/', deleteAllPrompts);
router.get('/:id', getPromptById);
router.put('/:id', updatePrompt);
router.delete('/:id', deletePrompt);
router.post('/:id/favorite', toggleFavorite);
router.put('/:id/favorite', toggleFavorite);

module.exports = router;
