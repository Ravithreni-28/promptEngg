const Prompt = require('../models/Prompt');
const PromptVersion = require('../models/PromptVersion');
const Activity = require('../models/Activity');
const { analyzePrompt: heuristicAnalyze } = require('../services/promptEvaluator');
const { generatePromptVariations, generateAIResponse } = require('../services/geminiService');
const { evaluateResponse: heuristicEvaluateResponse, comparePromptResults } = require('../services/responseEvaluator');
const { getDBStatus } = require('../config/db');

// In-Memory store fallback
const inMemoryPrompts = [];

// POST /api/prompts/analyze
const analyzePromptApi = async (req, res) => {
  try {
    const { prompt, task, context, desiredOutputFormat, tone, targetAudience } = req.body;
    const scores = heuristicAnalyze({ prompt, task, context, desiredOutputFormat, tone, targetAudience });
    return res.json({
      success: true,
      scores,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/optimize
const optimizePromptApi = async (req, res) => {
  try {
    const { prompt, task, context, desiredOutputFormat, tone, targetAudience } = req.body;
    if (!prompt && !task) {
      return res.status(400).json({ success: false, message: 'Please provide a prompt or task to optimize.' });
    }

    const variations = await generatePromptVariations(prompt || task, {
      task,
      context,
      desiredOutputFormat,
      tone,
      targetAudience,
    });

    const evaluatedVariations = variations.map((v) => {
      const pScore = heuristicAnalyze({ prompt: v.optimizedPrompt });
      return {
        ...v,
        promptScore: pScore.overall,
        promptScores: pScore,
      };
    });

    return res.json({
      success: true,
      variations: evaluatedVariations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/generate
const generateResponseApi = async (req, res) => {
  try {
    const { promptText } = req.body;
    if (!promptText) {
      return res.status(400).json({ success: false, message: 'Please provide promptText.' });
    }

    const aiResult = await generateAIResponse(promptText);
    const scores = heuristicEvaluateResponse(aiResult.responseText, promptText);

    return res.json({
      success: true,
      result: {
        ...aiResult,
        scores,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/evaluate
const evaluateResponseApi = async (req, res) => {
  try {
    const { responseText, promptText } = req.body;
    const scores = heuristicEvaluateResponse(responseText, promptText);
    return res.json({
      success: true,
      scores,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/compare
const comparePromptsApi = async (req, res) => {
  try {
    const { items } = req.body; // Array of { technique, promptText, responseText }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of items to compare.' });
    }

    const evaluatedItems = items.map((item) => {
      const pScores = heuristicAnalyze({ prompt: item.promptText });
      const rScores = heuristicEvaluateResponse(item.responseText || '', item.promptText);

      return {
        technique: item.technique || 'Custom',
        promptText: item.promptText,
        responseText: item.responseText,
        promptScore: pScores.overall,
        promptScores: pScores,
        responseScore: rScores.overall,
        responseScores: rScores,
      };
    });

    const comparisonResult = comparePromptResults(evaluatedItems);

    return res.json({
      success: true,
      comparison: comparisonResult,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts (Save Prompt)
const createPrompt = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      originalPrompt,
      task,
      context,
      desiredOutputFormat,
      tone,
      targetAudience,
      creativityLevel,
      promptScores,
      variations,
      selectedPrompt,
      technique,
      responses,
      responseScores,
      recommendedPrompt,
      finalScore,
      favorite,
      collectionId,
      tags,
    } = req.body;

    if (!originalPrompt) {
      return res.status(400).json({ success: false, message: 'Original prompt is required.' });
    }

    if (getDBStatus()) {
      const promptObj = await Prompt.create({
        userId,
        title: title || 'Untitled Prompt',
        originalPrompt,
        task,
        context,
        desiredOutputFormat,
        tone,
        targetAudience,
        creativityLevel,
        promptScores,
        variations,
        selectedPrompt,
        technique,
        responses,
        responseScores,
        recommendedPrompt,
        finalScore: finalScore || (promptScores ? promptScores.overall : 0),
        favorite: !!favorite,
        collectionId: collectionId || null,
        tags: tags || [],
        version: 1,
      });

      // Version v1 history
      await PromptVersion.create({
        promptId: promptObj._id,
        versionNumber: 1,
        promptText: originalPrompt,
        technique: technique || 'Standard',
        promptScores: promptScores || {},
        changeSummary: 'Initial prompt creation',
      });

      await Activity.create({
        userId,
        type: 'CREATE_PROMPT',
        description: `Created new prompt "${promptObj.title}"`,
      }).catch(() => {});

      return res.status(201).json({ success: true, prompt: promptObj });
    } else {
      // In-Memory Fallback
      const newPrompt = {
        _id: 'prompt_' + Date.now(),
        userId,
        title: title || 'Untitled Prompt',
        originalPrompt,
        task,
        context,
        desiredOutputFormat,
        tone,
        targetAudience,
        creativityLevel,
        promptScores,
        variations: variations || [],
        selectedPrompt,
        technique: technique || 'Standard',
        responses: responses || [],
        responseScores: responseScores || {},
        recommendedPrompt: recommendedPrompt || {},
        finalScore: finalScore || 75,
        favorite: !!favorite,
        collectionId: collectionId || null,
        tags: tags || [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryPrompts.push(newPrompt);
      return res.status(201).json({ success: true, prompt: newPrompt });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts (History / List)
const getPrompts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, technique, favorite, collectionId, sortBy } = req.query;

    if (getDBStatus()) {
      const query = { userId };

      if (favorite === 'true') query.favorite = true;
      if (collectionId) query.collectionId = collectionId;
      if (technique) query.technique = technique;

      if (search) {
        query.$or = [
          { originalPrompt: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { technique: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sortBy === 'oldest') sortOption = { createdAt: 1 };
      if (sortBy === 'highest_score') sortOption = { finalScore: -1 };
      if (sortBy === 'lowest_score') sortOption = { finalScore: 1 };

      const prompts = await Prompt.find(query).sort(sortOption).populate('collectionId', 'name color icon');
      return res.json({ success: true, prompts });
    } else {
      let filtered = inMemoryPrompts.filter((p) => String(p.userId) === String(userId));
      if (favorite === 'true') filtered = filtered.filter((p) => p.favorite);
      if (collectionId) filtered = filtered.filter((p) => String(p.collectionId) === String(collectionId));
      if (technique) filtered = filtered.filter((p) => p.technique === technique);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.originalPrompt.toLowerCase().includes(s) || (p.title && p.title.toLowerCase().includes(s))
        );
      }
      return res.json({ success: true, prompts: filtered });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts/:id
const getPromptById = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId: req.user._id }).populate('collectionId', 'name color icon');
      if (!prompt) {
        return res.status(404).json({ success: false, message: 'Prompt not found.' });
      }

      const versions = await PromptVersion.find({ promptId: id }).sort({ versionNumber: -1 });

      return res.json({ success: true, prompt, versions });
    } else {
      const prompt = inMemoryPrompts.find((p) => p._id === id);
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      return res.json({ success: true, prompt, versions: [] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/prompts/:id (Update & Versioning)
const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId });
      if (!prompt) {
        return res.status(404).json({ success: false, message: 'Prompt not found.' });
      }

      const isContentChanged = req.body.originalPrompt && req.body.originalPrompt !== prompt.originalPrompt;
      const newVersionNumber = isContentChanged ? prompt.version + 1 : prompt.version;

      Object.assign(prompt, req.body);
      if (isContentChanged) prompt.version = newVersionNumber;

      await prompt.save();

      if (isContentChanged) {
        await PromptVersion.create({
          promptId: prompt._id,
          versionNumber: newVersionNumber,
          promptText: prompt.originalPrompt,
          technique: prompt.technique || 'Standard',
          promptScores: prompt.promptScores || {},
          changeSummary: req.body.changeSummary || `Updated to version v${newVersionNumber}`,
        });
      }

      return res.json({ success: true, prompt });
    } else {
      const prompt = inMemoryPrompts.find((p) => p._id === id);
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      Object.assign(prompt, req.body);
      return res.json({ success: true, prompt });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/prompts/:id
const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const deleted = await Prompt.findOneAndDelete({ _id: id, userId: req.user._id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      await PromptVersion.deleteMany({ promptId: id });
      return res.json({ success: true, message: 'Prompt deleted successfully.' });
    } else {
      const idx = inMemoryPrompts.findIndex((p) => p._id === id);
      if (idx !== -1) inMemoryPrompts.splice(idx, 1);
      return res.json({ success: true, message: 'Prompt deleted.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId: req.user._id });
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      prompt.favorite = !prompt.favorite;
      await prompt.save();
      return res.json({ success: true, favorite: prompt.favorite, prompt });
    } else {
      const prompt = inMemoryPrompts.find((p) => p._id === id);
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      prompt.favorite = !prompt.favorite;
      return res.json({ success: true, favorite: prompt.favorite, prompt });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
