const Prompt = require('../models/Prompt');
const { getDBStatus } = require('../config/db');
const memoryStore = require('../config/memoryStore');

// Helper to compute analytics metrics and charts from an array of prompts
const computeAnalytics = (prompts) => {
  if (!prompts || prompts.length === 0) {
    return {
      isEmpty: true,
      message: 'No prompts created yet. Analyze and test your first prompt in Prompt Studio.',
      metrics: {
        totalPrompts: 0,
        totalTested: 0,
        avgPromptScore: 0,
        avgResponseScore: 0,
        mostUsedTechnique: 'N/A',
        bestPerformingTechnique: 'N/A',
        favoriteCount: 0,
      },
      charts: {
        promptsOverTime: [],
        techniqueBreakdown: [],
      },
    };
  }

  const totalPrompts = prompts.length;
  const totalTested = prompts.filter((p) => p.responses && p.responses.length > 0).length;
  const favoriteCount = prompts.filter((p) => p.favorite).length;

  const promptScores = prompts
    .map((p) => p.promptScores?.overall || p.finalScore || 0)
    .filter((s) => s > 0);
  const avgPromptScore =
    promptScores.length > 0 ? Math.round(promptScores.reduce((a, b) => a + b, 0) / promptScores.length) : 0;

  const responseScores = prompts
    .flatMap((p) => (p.responses || []).map((r) => r.scores?.overall || 0))
    .filter((s) => s > 0);
  const avgResponseScore =
    responseScores.length > 0 ? Math.round(responseScores.reduce((a, b) => a + b, 0) / responseScores.length) : 0;

  // Technique breakdown
  const techCounts = {};
  const techScores = {};

  prompts.forEach((p) => {
    const tech = p.technique || 'Standard';
    techCounts[tech] = (techCounts[tech] || 0) + 1;
    if (!techScores[tech]) techScores[tech] = [];
    const score = p.finalScore || p.promptScores?.overall;
    if (score) techScores[tech].push(score);
  });

  let mostUsedTechnique = 'Standard';
  let maxCount = 0;
  Object.entries(techCounts).forEach(([t, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedTechnique = t;
    }
  });

  let bestPerformingTechnique = 'Role-Based';
  let bestAvg = 0;
  Object.entries(techScores).forEach(([t, scoresArr]) => {
    if (scoresArr.length > 0) {
      const avg = scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestPerformingTechnique = t;
      }
    }
  });

  // Chart: Prompts Over Time
  const timeMap = {};
  prompts.forEach((p) => {
    const d = new Date(p.createdAt || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!timeMap[dateStr]) {
      timeMap[dateStr] = { date: dateStr, count: 0, scores: [] };
    }
    timeMap[dateStr].count += 1;
    const score = p.finalScore || p.promptScores?.overall;
    if (score) timeMap[dateStr].scores.push(score);
  });

  const promptsOverTime = Object.values(timeMap).map((d) => ({
    date: d.date,
    count: d.count,
    avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 75,
  }));

  // Chart: Technique Breakdown
  const techniqueBreakdown = Object.entries(techCounts).map(([name, count]) => {
    const scores = techScores[name] || [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
    return { name, count, avgScore };
  });

  return {
    isEmpty: false,
    metrics: {
      totalPrompts,
      totalTested,
      avgPromptScore,
      avgResponseScore,
      mostUsedTechnique,
      bestPerformingTechnique,
      favoriteCount,
    },
    charts: {
      promptsOverTime,
      techniqueBreakdown,
    },
  };
};

// GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const prompts = await Prompt.find({ userId }).sort({ createdAt: 1 });
      const result = computeAnalytics(prompts);
      return res.json({ success: true, ...result });
    } else {
      // Memory Store Fallback - strictly user specific!
      const userPrompts = memoryStore.prompts
        .filter((p) => String(p.userId) === String(userId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const result = computeAnalytics(userPrompts);
      return res.json({ success: true, ...result });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics };
