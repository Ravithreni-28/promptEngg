const Prompt = require('../models/Prompt');
const PromptVersion = require('../models/PromptVersion');
const Activity = require('../models/Activity');
const { analyzePrompt: heuristicAnalyze } = require('../services/promptEvaluator');
const { generatePromptVariations, generateAIResponse, generateGeminiSuggestions } = require('../services/geminiService');
const { evaluateResponse: heuristicEvaluateResponse, comparePromptResults } = require('../services/responseEvaluator');
const { getDBStatus } = require('../config/db');
const memoryStore = require('../config/memoryStore');

const sanitizeCollectionId = (cid) => {
  if (!cid) return null;
  if (typeof cid === 'object') return cid._id ? String(cid._id) : null;
  return String(cid);
};

// POST /api/prompts/analyze
const analyzePromptApi = async (req, res) => {
  try {
    const { prompt, task, context, desiredOutputFormat, tone, targetAudience } = req.body;
    const scores = heuristicAnalyze({ prompt, task, context, desiredOutputFormat, tone, targetAudience });

    // Enhance with Gemini suggestions if Gemini API is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
      const geminiSug = await generateGeminiSuggestions(prompt || task, scores);
      if (geminiSug && geminiSug.length > 0) {
        scores.suggestions = [...geminiSug, ...scores.suggestions].slice(0, 4);
      }
    }

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
    const promptText = req.body.promptText || req.body.prompt || req.body.originalPrompt;
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
    const responseText = req.body.responseText || req.body.response;
    const promptText = req.body.promptText || req.body.prompt || req.body.originalPrompt || '';
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
    let items = req.body.items || req.body.variations; // Array of { technique, promptText, responseText }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of items to compare.' });
    }

    const evaluatedItems = items.map((item) => {
      const pText = item.promptText || item.optimizedPrompt || item.prompt || '';
      const rText = item.responseText || item.response || item.content || '';
      const pScores = heuristicAnalyze({ prompt: pText });
      const rScores = heuristicEvaluateResponse(rText, pText);

      return {
        technique: item.technique || 'Custom',
        promptText: pText,
        responseText: rText,
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

// POST /api/prompts (Save or Upsert Prompt)
const createPrompt = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      _id,
      promptId,
      id,
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

    const targetId = _id || promptId || id;
    const cleanCollectionId = sanitizeCollectionId(collectionId);

    if (!originalPrompt && !targetId) {
      return res.status(400).json({ success: false, message: 'Original prompt is required.' });
    }

    const calculatedFinalScore =
      finalScore ||
      (recommendedPrompt && recommendedPrompt.finalScore) ||
      (promptScores ? promptScores.overall : 75);

    if (getDBStatus()) {
      // Check if updating an existing prompt
      if (targetId) {
        let existingPrompt = null;
        try {
          existingPrompt = await Prompt.findOne({ _id: targetId, userId });
        } catch (e) {}

        if (existingPrompt) {
          if (title !== undefined) existingPrompt.title = title;
          if (originalPrompt !== undefined) existingPrompt.originalPrompt = originalPrompt;
          if (task !== undefined) existingPrompt.task = task;
          if (context !== undefined) existingPrompt.context = context;
          if (desiredOutputFormat !== undefined) existingPrompt.desiredOutputFormat = desiredOutputFormat;
          if (tone !== undefined) existingPrompt.tone = tone;
          if (targetAudience !== undefined) existingPrompt.targetAudience = targetAudience;
          if (creativityLevel !== undefined) existingPrompt.creativityLevel = creativityLevel;
          if (promptScores !== undefined) existingPrompt.promptScores = promptScores;
          if (variations !== undefined) existingPrompt.variations = variations;
          if (selectedPrompt !== undefined) existingPrompt.selectedPrompt = selectedPrompt;
          if (technique !== undefined) existingPrompt.technique = technique;
          if (responses !== undefined && Array.isArray(responses)) existingPrompt.responses = responses;
          if (responseScores !== undefined) existingPrompt.responseScores = responseScores;
          if (recommendedPrompt !== undefined) existingPrompt.recommendedPrompt = recommendedPrompt;
          if (calculatedFinalScore !== undefined) existingPrompt.finalScore = calculatedFinalScore;
          if (favorite !== undefined) existingPrompt.favorite = !!favorite;
          if (collectionId !== undefined) existingPrompt.collectionId = cleanCollectionId;
          if (tags !== undefined) existingPrompt.tags = tags;

          await existingPrompt.save();
          return res.status(200).json({ success: true, prompt: existingPrompt, isUpdate: true });
        }
      }

      // Create new prompt
      const promptObj = await Prompt.create({
        userId,
        title: title || (originalPrompt ? originalPrompt.substring(0, 30) : 'Untitled Prompt'),
        originalPrompt,
        task: task || '',
        context: context || '',
        desiredOutputFormat: desiredOutputFormat || '',
        tone: tone || 'Standard',
        targetAudience: targetAudience || 'General',
        creativityLevel: creativityLevel || 'Balanced',
        promptScores: promptScores || {},
        variations: variations || [],
        selectedPrompt: selectedPrompt || originalPrompt,
        technique: technique || 'Standard',
        responses: responses || [],
        responseScores: responseScores || {},
        recommendedPrompt: recommendedPrompt || {},
        finalScore: calculatedFinalScore,
        favorite: !!favorite,
        collectionId: cleanCollectionId,
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
      }).catch(() => {});

      await Activity.create({
        userId,
        type: 'CREATE_PROMPT',
        description: `Created prompt "${promptObj.title}"`,
      }).catch(() => {});

      return res.status(201).json({ success: true, prompt: promptObj });
    } else {
      // Memory Store Fallback
      if (targetId) {
        const existingPrompt = memoryStore.prompts.find(
          (p) => String(p._id) === String(targetId) && String(p.userId) === String(userId)
        );

        if (existingPrompt) {
          if (title !== undefined) existingPrompt.title = title;
          if (originalPrompt !== undefined) existingPrompt.originalPrompt = originalPrompt;
          if (task !== undefined) existingPrompt.task = task;
          if (context !== undefined) existingPrompt.context = context;
          if (desiredOutputFormat !== undefined) existingPrompt.desiredOutputFormat = desiredOutputFormat;
          if (tone !== undefined) existingPrompt.tone = tone;
          if (targetAudience !== undefined) existingPrompt.targetAudience = targetAudience;
          if (creativityLevel !== undefined) existingPrompt.creativityLevel = creativityLevel;
          if (promptScores !== undefined) existingPrompt.promptScores = promptScores;
          if (variations !== undefined) existingPrompt.variations = variations;
          if (selectedPrompt !== undefined) existingPrompt.selectedPrompt = selectedPrompt;
          if (technique !== undefined) existingPrompt.technique = technique;
          if (responses !== undefined && Array.isArray(responses)) existingPrompt.responses = responses;
          if (responseScores !== undefined) existingPrompt.responseScores = responseScores;
          if (recommendedPrompt !== undefined) existingPrompt.recommendedPrompt = recommendedPrompt;
          if (calculatedFinalScore !== undefined) existingPrompt.finalScore = calculatedFinalScore;
          if (favorite !== undefined) existingPrompt.favorite = !!favorite;
          if (collectionId !== undefined) existingPrompt.collectionId = cleanCollectionId;
          if (tags !== undefined) existingPrompt.tags = tags;
          existingPrompt.updatedAt = new Date().toISOString();

          memoryStore.persist();
          return res.status(200).json({ success: true, prompt: existingPrompt, isUpdate: true });
        }
      }

      const newPrompt = {
        _id: 'p_' + Date.now(),
        userId: String(userId),
        title: title || (originalPrompt ? originalPrompt.substring(0, 30) : 'Untitled Prompt'),
        originalPrompt,
        task: task || '',
        context: context || '',
        desiredOutputFormat: desiredOutputFormat || '',
        tone: tone || 'Standard',
        targetAudience: targetAudience || 'General',
        creativityLevel: creativityLevel || 'Balanced',
        promptScores: promptScores || {},
        variations: variations || [],
        selectedPrompt: selectedPrompt || originalPrompt,
        technique: technique || 'Standard',
        responses: responses || [],
        responseScores: responseScores || {},
        recommendedPrompt: recommendedPrompt || {},
        finalScore: calculatedFinalScore,
        favorite: !!favorite,
        collectionId: cleanCollectionId,
        tags: tags || [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryStore.prompts.unshift(newPrompt);

      memoryStore.versions.push({
        _id: 'ver_' + Date.now(),
        promptId: newPrompt._id,
        versionNumber: 1,
        promptText: originalPrompt,
        technique: technique || 'Standard',
        promptScores: promptScores || {},
        changeSummary: 'Initial prompt creation',
        createdAt: new Date().toISOString(),
      });

      memoryStore.logActivity(userId, 'CREATE_PROMPT', `Created prompt "${newPrompt.title}"`);
      memoryStore.persist();

      return res.status(201).json({ success: true, prompt: newPrompt });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts (History / List)
const getPrompts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
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
      // Memory Store Fallback
      let filtered = memoryStore.prompts.filter(
        (p) => String(p.userId) === String(userId) || !p.userId
      );

      if (favorite === 'true') filtered = filtered.filter((p) => p.favorite);
      if (collectionId) {
        filtered = filtered.filter((p) => {
          const pColId = typeof p.collectionId === 'object' && p.collectionId !== null ? p.collectionId._id : p.collectionId;
          return String(pColId) === String(collectionId);
        });
      }
      if (technique) filtered = filtered.filter((p) => p.technique === technique);

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.originalPrompt && p.originalPrompt.toLowerCase().includes(s)) ||
            (p.title && p.title.toLowerCase().includes(s)) ||
            (p.technique && p.technique.toLowerCase().includes(s))
        );
      }

      // Populate collectionId info in memory mode
      const populated = filtered.map((p) => {
        let colObj = null;
        const pColId = typeof p.collectionId === 'object' && p.collectionId !== null ? p.collectionId._id : p.collectionId;
        if (pColId) {
          const found = memoryStore.collections.find((c) => String(c._id) === String(pColId));
          if (found) {
            colObj = { _id: found._id, name: found.name, color: found.color, icon: found.icon };
          }
        }
        return {
          ...p,
          collectionId: colObj || (pColId ? { _id: pColId, name: 'Collection', color: '#3b82f6' } : null),
        };
      });

      if (sortBy === 'oldest') {
        populated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === 'highest_score') {
        populated.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      } else if (sortBy === 'lowest_score') {
        populated.sort((a, b) => (a.finalScore || 0) - (b.finalScore || 0));
      } else {
        populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return res.json({ success: true, prompts: populated });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts/:id
const getPromptById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId }).populate('collectionId', 'name color icon');
      if (!prompt) {
        return res.status(404).json({ success: false, message: 'Prompt not found.' });
      }

      const versions = await PromptVersion.find({ promptId: id }).sort({ versionNumber: -1 });

      return res.json({ success: true, prompt, versions });
    } else {
      // Memory Store Fallback - strictly user scoped
      const prompt = memoryStore.prompts.find(
        (p) => String(p._id) === String(id) && String(p.userId) === String(userId)
      );
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });

      const versions = memoryStore.versions.filter((v) => String(v.promptId) === String(id));
      return res.json({ success: true, prompt, versions });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/prompts/:id (Update & Versioning)
const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId });
      if (!prompt) {
        return res.status(404).json({ success: false, message: 'Prompt not found.' });
      }

      const isContentChanged = req.body.originalPrompt && req.body.originalPrompt !== prompt.originalPrompt;
      const newVersionNumber = isContentChanged ? (prompt.version || 1) + 1 : prompt.version || 1;

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

      await Activity.create({
        userId,
        type: 'UPDATE_PROMPT',
        description: `Updated prompt "${prompt.title}"`,
      }).catch(() => {});

      return res.json({ success: true, prompt });
    } else {
      // Memory Store Fallback - strictly user scoped
      const prompt = memoryStore.prompts.find(
        (p) => String(p._id) === String(id) && String(p.userId) === String(userId)
      );
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });

      const isContentChanged = req.body.originalPrompt && req.body.originalPrompt !== prompt.originalPrompt;
      const newVersionNumber = isContentChanged ? (prompt.version || 1) + 1 : prompt.version || 1;

      Object.assign(prompt, req.body);
      prompt.updatedAt = new Date().toISOString();
      if (isContentChanged) {
        prompt.version = newVersionNumber;
        memoryStore.versions.push({
          _id: 'ver_' + Date.now(),
          promptId: prompt._id,
          versionNumber: newVersionNumber,
          promptText: prompt.originalPrompt,
          technique: prompt.technique || 'Standard',
          promptScores: prompt.promptScores || {},
          changeSummary: req.body.changeSummary || `Updated to version v${newVersionNumber}`,
          createdAt: new Date().toISOString(),
        });
      }

      memoryStore.logActivity(userId, 'UPDATE_PROMPT', `Updated prompt "${prompt.title}"`);
      memoryStore.persist();

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
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const deleted = await Prompt.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      await PromptVersion.deleteMany({ promptId: id });
      await Activity.create({
        userId,
        type: 'DELETE_PROMPT',
        description: `Deleted prompt "${deleted.title}"`,
      }).catch(() => {});
      return res.json({ success: true, message: 'Prompt deleted successfully.' });
    } else {
      // Memory Store Fallback - strictly user scoped
      const idx = memoryStore.prompts.findIndex(
        (p) => String(p._id) === String(id) && String(p.userId) === String(userId)
      );
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Prompt not found.' });
      }
      const deleted = memoryStore.prompts.splice(idx, 1)[0];
      memoryStore.versions = memoryStore.versions.filter((v) => String(v.promptId) !== String(id));
      memoryStore.logActivity(userId, 'DELETE_PROMPT', `Deleted prompt "${deleted.title}"`);
      memoryStore.persist();
      return res.json({ success: true, message: 'Prompt deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/prompts (Delete all prompts for authenticated user)
const deleteAllPrompts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const userPrompts = await Prompt.find({ userId }).select('_id');
      const promptIds = userPrompts.map((p) => p._id);
      const result = await Prompt.deleteMany({ userId });
      await PromptVersion.deleteMany({ promptId: { $in: promptIds } });
      await Activity.create({
        userId,
        type: 'DELETE_PROMPT',
        description: 'Cleared all prompt history',
      }).catch(() => {});
      return res.json({ success: true, message: 'All prompts deleted successfully.', count: result.deletedCount });
    } else {
      const count = memoryStore.prompts.filter((p) => String(p.userId) === String(userId)).length;
      memoryStore.prompts = memoryStore.prompts.filter((p) => String(p.userId) !== String(userId));
      memoryStore.logActivity(userId, 'DELETE_PROMPT', 'Cleared all prompt history');
      memoryStore.persist();
      return res.json({ success: true, message: 'All prompts deleted successfully.', count });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/prompts/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompt = await Prompt.findOne({ _id: id, userId });
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      prompt.favorite = !prompt.favorite;
      await prompt.save();

      await Activity.create({
        userId,
        type: 'TOGGLE_FAVORITE',
        description: `${prompt.favorite ? 'Starred' : 'Unstarred'} prompt "${prompt.title}"`,
      }).catch(() => {});

      return res.json({ success: true, favorite: prompt.favorite, prompt });
    } else {
      // Memory Store Fallback - strictly user scoped
      const prompt = memoryStore.prompts.find(
        (p) => String(p._id) === String(id) && String(p.userId) === String(userId)
      );
      if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });
      prompt.favorite = !prompt.favorite;
      prompt.updatedAt = new Date().toISOString();

      memoryStore.logActivity(
        userId,
        'TOGGLE_FAVORITE',
        `${prompt.favorite ? 'Starred' : 'Unstarred'} prompt "${prompt.title}"`
      );
      memoryStore.persist();

      return res.json({ success: true, favorite: prompt.favorite, prompt });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts/history (alias for getPrompts, newest first)
const getPromptsHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompts = await Prompt.find({ userId })
        .sort({ createdAt: -1 })
        .populate('collectionId', 'name color icon');
      return res.json({ success: true, prompts });
    } else {
      const userPrompts = memoryStore.prompts
        .filter((p) => String(p.userId) === String(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((p) => {
          let colObj = null;
          const pColId = typeof p.collectionId === 'object' && p.collectionId !== null ? p.collectionId._id : p.collectionId;
          if (pColId) {
            const found = memoryStore.collections.find((c) => String(c._id) === String(pColId));
            if (found) {
              colObj = { _id: found._id, name: found.name, color: found.color, icon: found.icon };
            }
          }
          return {
            ...p,
            collectionId: colObj || (pColId ? { _id: pColId, name: 'Collection', color: '#3b82f6' } : null),
          };
        });
      return res.json({ success: true, prompts: userPrompts });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/prompts/stats
const getPromptStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let prompts = [];

    if (getDBStatus()) {
      prompts = await Prompt.find({ userId });
    } else {
      prompts = memoryStore.prompts.filter((p) => String(p.userId) === String(userId));
    }

    const totalPrompts = prompts.length;
    const testedPrompts = prompts.filter((p) => p.responses && p.responses.length > 0).length;
    const favoriteCount = prompts.filter((p) => p.favorite).length;

    const pScores = prompts.map((p) => p.finalScore || p.promptScores?.overall || 0).filter((s) => s > 0);
    const avgPromptScore =
      pScores.length > 0 ? Math.round(pScores.reduce((a, b) => a + b, 0) / pScores.length) : 0;

    const rScores = prompts
      .flatMap((p) => (p.responses || []).map((r) => r.scores?.overall || 0))
      .filter((s) => s > 0);
    const avgResponseScore =
      rScores.length > 0 ? Math.round(rScores.reduce((a, b) => a + b, 0) / rScores.length) : 0;

    const techCounts = {};
    prompts.forEach((p) => {
      if (p.technique) techCounts[p.technique] = (techCounts[p.technique] || 0) + 1;
    });
    let mostUsedTechnique = totalPrompts > 0 ? 'Standard' : 'N/A';
    let maxCount = 0;
    Object.entries(techCounts).forEach(([t, count]) => {
      if (count > maxCount) { maxCount = count; mostUsedTechnique = t; }
    });

    return res.json({
      success: true,
      stats: { totalPrompts, testedPrompts, avgPromptScore, avgResponseScore, mostUsedTechnique, favoriteCount },
    });
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
  getPromptsHistory,
  getPromptStats,
  getPromptById,
  updatePrompt,
  deletePrompt,
  deleteAllPrompts,
  toggleFavorite,
};
