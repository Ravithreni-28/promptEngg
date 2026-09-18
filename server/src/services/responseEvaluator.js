/**
 * Heuristic Response Evaluator
 * Evaluates generated AI responses across 5 categories (0-20 each, Total 0-100):
 * 1. Relevance
 * 2. Completeness
 * 3. Clarity
 * 4. Structure
 * 5. Instruction Following
 */

const evaluateResponse = (responseText = '', promptText = '') => {
  if (!responseText || typeof responseText !== 'string') {
    return {
      relevance: 0,
      completeness: 0,
      clarity: 0,
      structure: 0,
      instructionFollowing: 0,
      overall: 0,
    };
  }

  const responseLower = responseText.toLowerCase();
  const promptLower = promptText.toLowerCase();

  const responseWords = responseText.split(/\s+/).filter(Boolean).length;
  const promptKeywords = promptLower
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 15);

  // --- 1. RELEVANCE (0 - 20) ---
  let relevance = 10;
  if (promptKeywords.length > 0) {
    const matchCount = promptKeywords.filter((kw) => responseLower.includes(kw)).length;
    const matchRatio = matchCount / promptKeywords.length;
    relevance += Math.round(matchRatio * 10);
  } else {
    relevance = 15;
  }
  relevance = Math.min(20, Math.max(0, relevance));

  // --- 2. COMPLETENESS (0 - 20) ---
  let completeness = 8;
  if (responseWords >= 80) completeness += 8;
  else if (responseWords >= 30) completeness += 5;
  else completeness += 2;

  if (responseLower.includes('conclusion') || responseLower.includes('summary') || responseLower.includes('example') || responseLower.includes('note')) {
    completeness += 4;
  }
  completeness = Math.min(20, Math.max(0, completeness));

  // --- 3. CLARITY (0 - 20) ---
  let clarity = 12;
  const avgWordLen = responseText.length / Math.max(1, responseWords);
  if (avgWordLen >= 4 && avgWordLen <= 7.5) clarity += 5;
  if (!responseLower.includes('error') && !responseLower.includes('invalid') && !responseLower.includes('sorry, i cannot')) {
    clarity += 3;
  }
  clarity = Math.min(20, Math.max(0, clarity));

  // --- 4. STRUCTURE (0 - 20) ---
  let structure = 8;
  if (responseText.includes('\n\n')) structure += 4;
  if (responseText.includes('#') || responseText.includes('**') || responseText.includes('- ') || responseText.includes('1.')) structure += 5;
  if (responseText.includes('```') || responseText.includes('|')) structure += 3;
  structure = Math.min(20, Math.max(0, structure));

  // --- 5. INSTRUCTION FOLLOWING (0 - 20) ---
  let instructionFollowing = 10;
  if (promptLower.includes('list') && (responseText.includes('-') || responseText.includes('1.'))) instructionFollowing += 4;
  if (promptLower.includes('code') && responseText.includes('```')) instructionFollowing += 5;
  if (promptLower.includes('table') && responseText.includes('|')) instructionFollowing += 5;
  if (promptLower.includes('short') && responseWords <= 100) instructionFollowing += 4;
  if (promptLower.includes('step') && (responseLower.includes('step') || responseText.includes('1.'))) instructionFollowing += 4;

  instructionFollowing = Math.min(20, Math.max(0, instructionFollowing));

  const overall = relevance + completeness + clarity + structure + instructionFollowing;

  return {
    relevance,
    completeness,
    clarity,
    structure,
    instructionFollowing,
    overall,
  };
};

/**
 * Compare prompt & response results and recommend the best prompt
 */
const comparePromptResults = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const evaluatedItems = items.map((item) => {
    const promptScore = item.promptScore || (item.promptScores ? item.promptScores.overall : 70);
    const responseScore = item.responseScore || (item.responseScores ? item.responseScores.overall : 70);

    // Transparent formula: Final Score = Prompt Score * 0.4 + Response Score * 0.6
    const finalScore = parseFloat((promptScore * 0.4 + responseScore * 0.6).toFixed(1));

    return {
      ...item,
      promptScore,
      responseScore,
      finalScore,
    };
  });

  // Sort descending by finalScore
  evaluatedItems.sort((a, b) => b.finalScore - a.finalScore);

  const best = evaluatedItems[0];
  const rationale = [
    `Highest combined heuristic score (${best.finalScore}/100).`,
    `Prompt Quality Score: ${best.promptScore}/100 (${best.technique || 'Selected Technique'}).`,
    `Response Quality Score: ${best.responseScore}/100.`,
    `Demonstrated superior instruction following and clarity in output formatting.`,
  ];

  return {
    items: evaluatedItems,
    recommendedPrompt: {
      technique: best.technique || 'Optimized',
      promptText: best.promptText || best.optimizedPrompt || best.originalPrompt,
      promptScore: best.promptScore,
      responseScore: best.responseScore,
      finalScore: best.finalScore,
      rationale,
    },
  };
};

module.exports = { evaluateResponse, comparePromptResults };
