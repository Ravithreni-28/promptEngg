const Prompt = require('../models/Prompt');
const { getDBStatus } = require('../config/db');

// GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    if (getDBStatus()) {
      const totalPrompts = await Prompt.countDocuments({ userId });

      if (totalPrompts === 0) {
        return res.json({
          success: true,
          isEmpty: true,
          message: 'No analytics yet. Create and test your first prompt.',
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
            scoreDistribution: [],
            techniqueBreakdown: [],
          },
        });
      }

      const prompts = await Prompt.find({ userId }).sort({ createdAt: 1 });

      const totalTested = prompts.filter((p) => p.responses && p.responses.length > 0).length;
      const favoriteCount = prompts.filter((p) => p.favorite).length;

      const promptScores = prompts.map((p) => p.promptScores?.overall || 0).filter((s) => s > 0);
      const avgPromptScore = promptScores.length > 0 ? Math.round(promptScores.reduce((a, b) => a + b, 0) / promptScores.length) : 0;

      const responseScores = prompts.flatMap((p) => (p.responses || []).map((r) => r.scores?.overall || 0)).filter((s) => s > 0);
      const avgResponseScore = responseScores.length > 0 ? Math.round(responseScores.reduce((a, b) => a + b, 0) / responseScores.length) : 0;

      // Technique breakdown
      const techCounts = {};
      const techScores = {};

      prompts.forEach((p) => {
        const tech = p.technique || 'Standard';
        techCounts[tech] = (techCounts[tech] || 0) + 1;
        if (!techScores[tech]) techScores[tech] = [];
        if (p.finalScore) techScores[tech].push(p.finalScore);
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
        const dateStr = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!timeMap[dateStr]) {
          timeMap[dateStr] = { date: dateStr, created: 0, avgScore: 0, scores: [] };
        }
        timeMap[dateStr].created += 1;
        if (p.finalScore) timeMap[dateStr].scores.push(p.finalScore);
      });

      const promptsOverTime = Object.values(timeMap).map((d) => ({
        date: d.date,
        created: d.created,
        avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 75,
      }));

      // Technique breakdown array for Recharts
      const techniqueBreakdown = Object.entries(techCounts).map(([name, count]) => ({
        name,
        count,
        avgScore: techScores[name] && techScores[name].length > 0 ? Math.round(techScores[name].reduce((a, b) => a + b, 0) / techScores[name].length) : 75,
      }));

      return res.json({
        success: true,
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
      });
    } else {
      // Demo store analytics
      return res.json({
        success: true,
        isEmpty: false,
        metrics: {
          totalPrompts: 12,
          totalTested: 9,
          avgPromptScore: 84,
          avgResponseScore: 88,
          mostUsedTechnique: 'Role-Based',
          bestPerformingTechnique: 'Role-Based',
          favoriteCount: 4,
        },
        charts: {
          promptsOverTime: [
            { date: 'Sep 1', created: 2, avgScore: 78 },
            { date: 'Sep 2', created: 3, avgScore: 82 },
            { date: 'Sep 3', created: 4, avgScore: 86 },
            { date: 'Sep 4', created: 3, avgScore: 89 },
          ],
          techniqueBreakdown: [
            { name: 'Role-Based', count: 5, avgScore: 91 },
            { name: 'Step-by-Step', count: 3, avgScore: 87 },
            { name: 'Clear & Concise', count: 2, avgScore: 82 },
            { name: 'Structured', count: 2, avgScore: 88 },
          ],
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics };
