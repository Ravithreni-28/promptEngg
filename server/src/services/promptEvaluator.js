/**
 * Heuristic Prompt Evaluator
 * Evaluates prompt quality across 5 dimensions (0-20 points each, Total 0-100):
 * 1. Clarity: Directness, absence of vague filler words, sentence length.
 * 2. Specificity: Presence of specific details, numbers, constraints, and actionable directives.
 * 3. Context: Background information, domain environment, target use-case framing.
 * 4. Completeness: Inclusion of task, context, formatting requirements, and audience.
 * 5. Structure: Organization, paragraphs, lists, XML/markdown tags, bullet formatting.
 */

const analyzePrompt = (input = {}) => {
  const promptText = (typeof input === 'string' ? input : input.prompt || '').trim();
  const context = (input.context || '').trim();
  const desiredOutputFormat = (input.desiredOutputFormat || '').trim();
  const tone = (input.tone || '').trim();
  const targetAudience = (input.targetAudience || '').trim();
  const task = (input.task || '').trim();

  if (!promptText && !task) {
    return {
      clarity: 0,
      specificity: 0,
      context: 0,
      completeness: 0,
      structure: 0,
      overall: 0,
      suggestions: ['Please provide a non-empty prompt or task description to analyze.'],
    };
  }

  const fullText = `${promptText} ${task} ${context} ${desiredOutputFormat} ${tone} ${targetAudience}`.toLowerCase();
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;
  const sentenceCount = promptText.split(/[.!?]+/).filter(Boolean).length;

  const suggestions = [];

  // --- 1. CLARITY (0 - 20) ---
  let clarityScore = 10;
  if (wordCount >= 10 && wordCount <= 120) clarityScore += 4;
  else if (wordCount > 120) clarityScore += 2;
  else clarityScore += 1;

  const clearVerbs = ['explain', 'create', 'generate', 'write', 'summarize', 'convert', 'build', 'analyze', 'list', 'compare', 'refactor', 'draft'];
  const hasActionVerb = clearVerbs.some((v) => fullText.includes(v));
  if (hasActionVerb) clarityScore += 4;
  else suggestions.push('Use strong action verbs (e.g. "Explain", "Analyze", "Generate") at the start of your prompt.');

  const vagueWords = ['something', 'stuff', 'good', 'things', 'whatever', 'kind of', 'maybe', 'nice'];
  const vagueCount = vagueWords.filter((w) => fullText.includes(w)).length;
  clarityScore = Math.max(0, clarityScore - vagueCount * 2);
  if (vagueCount > 0) suggestions.push('Replace vague words (e.g., "stuff", "good", "things") with precise terms.');

  clarityScore = Math.min(20, Math.max(0, clarityScore));

  // --- 2. SPECIFICITY (0 - 20) ---
  let specificityScore = 6;
  const constraintKeywords = ['don\'t', 'do not', 'must', 'only', 'limit', 'exactly', 'at least', 'maximum', 'step-by-step', 'include', 'avoid'];
  const hasConstraint = constraintKeywords.some((k) => fullText.includes(k));
  if (hasConstraint) specificityScore += 5;
  else suggestions.push('Add specific guidelines or constraints (e.g., "Limit to 3 paragraphs", "Do not use technical jargon").');

  const numbersOrQuotes = /\b\d+\b|"[^"]+"/;
  if (numbersOrQuotes.test(promptText)) specificityScore += 4;

  if (wordCount > 25) specificityScore += 3;
  if (wordCount > 60) specificityScore += 2;

  specificityScore = Math.min(20, Math.max(0, specificityScore));

  // --- 3. CONTEXT (0 - 20) ---
  let contextScore = 4;
  if (context.length > 10) contextScore += 8;
  const contextKeywords = ['background', 'scenario', 'given', 'for example', 'assuming', 'in the context of', 'role', 'as a', 'act as'];
  const hasContextKw = contextKeywords.some((k) => fullText.includes(k));
  if (hasContextKw) contextScore += 5;
  if (fullText.includes('because') || fullText.includes('target') || fullText.includes('goal')) contextScore += 3;

  if (contextScore < 14) suggestions.push('Provide background context or define the role/persona for the AI (e.g., "Act as a Senior Developer").');
  contextScore = Math.min(20, Math.max(0, contextScore));

  // --- 4. COMPLETENESS (0 - 20) ---
  let completenessScore = 6;
  if (task.length > 5 || hasActionVerb) completenessScore += 4;
  if (desiredOutputFormat || fullText.includes('format') || fullText.includes('json') || fullText.includes('table') || fullText.includes('markdown') || fullText.includes('bullet')) completenessScore += 5;
  else suggestions.push('Specify the desired output format (e.g., Markdown table, bulleted list, JSON schema).');

  if (targetAudience || fullText.includes('for beginners') || fullText.includes('audience') || fullText.includes('experts') || fullText.includes('students')) completenessScore += 5;
  else suggestions.push('Define the target audience (e.g., "for beginners", "for C-level executives").');

  completenessScore = Math.min(20, Math.max(0, completenessScore));

  // --- 5. STRUCTURE (0 - 20) ---
  let structureScore = 8;
  if (promptText.includes('\n')) structureScore += 4;
  if (promptText.includes(':') || promptText.includes('-') || promptText.includes('1.')) structureScore += 4;
  if (promptText.includes('<') && promptText.includes('>')) structureScore += 4; // XML structural tags

  if (structureScore < 14 && sentenceCount > 3) suggestions.push('Structure long prompts using line breaks, bullet points, or numbered steps.');
  structureScore = Math.min(20, Math.max(0, structureScore));

  // Overall Heuristic Score (Sum of 5 categories)
  const overall = clarityScore + specificityScore + contextScore + completenessScore + structureScore;

  if (suggestions.length === 0 && overall >= 85) {
    suggestions.push('Great prompt! It is clear, specific, well-structured, and provides sufficient context.');
  }

  return {
    clarity: clarityScore,
    specificity: specificityScore,
    context: contextScore,
    completeness: completenessScore,
    structure: structureScore,
    overall,
    suggestions,
  };
};

module.exports = { analyzePrompt };
