import API from './api';

const STORAGE_KEY = 'ai_prompt_studio_prompts';

// Initial default seed prompts for local storage persistence
const DEFAULT_INITIAL_PROMPTS = [
  {
    _id: 'p_seed_1',
    title: 'Explain Machine Learning to Beginner',
    originalPrompt: 'Explain machine learning to a beginner.',
    task: 'Explain ML concepts simply',
    context: 'High school student background',
    desiredOutputFormat: 'Bulleted summary with real world analogy',
    tone: 'Encouraging',
    targetAudience: 'Beginners',
    creativityLevel: 'Balanced',
    collectionId: 'col_2',
    favorite: true,
    technique: 'Role-Based',
    promptScores: {
      clarity: 16,
      specificity: 14,
      context: 15,
      completeness: 17,
      structure: 16,
      overall: 78,
      suggestions: ['Specify target output format in detail.'],
    },
    variations: [
      {
        technique: 'Role-Based',
        optimizedPrompt: 'Act as a friendly computer science professor. Explain the core concept of machine learning to a high-school student using the analogy of learning to ride a bicycle.',
        why: 'Assigns an expert teacher persona and engaging visual analogy.',
        expectedUseCase: 'Tutorials and educational overviews.',
      },
      {
        technique: 'Step-by-Step',
        optimizedPrompt: 'Explain machine learning in 4 clear steps:\n1. Data training\n2. Pattern recognition\n3. Prediction\n4. Real-world example.',
        why: 'Organizes complex concepts into structured sequence.',
        expectedUseCase: 'Structured learning guides.',
      },
    ],
    selectedPrompt: 'Act as a friendly computer science professor. Explain the core concept of machine learning...',
    responses: [
      {
        technique: 'Role-Based',
        promptText: 'Act as a friendly computer science professor...',
        responseText: 'Machine learning works like learning to ride a bicycle. With practice data, the computer learns patterns and improves automatically over time!',
        model: 'gemini-2.5-flash',
        scores: { relevance: 19, completeness: 18, clarity: 19, structure: 18, instructionFollowing: 18, overall: 92 },
      },
    ],
    responseScores: { relevance: 19, completeness: 18, clarity: 19, structure: 18, instructionFollowing: 18, overall: 92 },
    recommendedPrompt: {
      technique: 'Role-Based',
      promptText: 'Act as a friendly computer science professor...',
      promptScore: 88,
      responseScore: 92,
      finalScore: 90.4,
      rationale: ['Highest overall score', 'Strong persona alignment'],
    },
    finalScore: 90.4,
    version: 1,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: 'p_seed_2',
    title: 'Python Array Sorting Function',
    originalPrompt: 'Write a Python function to sort an array.',
    task: 'Write array sorting function',
    context: 'Python 3.10 clean code standards',
    desiredOutputFormat: 'Code block with docstring and unit test',
    tone: 'Technical',
    targetAudience: 'Developers',
    collectionId: 'col_1',
    favorite: true,
    technique: 'Structured',
    promptScores: { clarity: 18, specificity: 15, context: 14, completeness: 16, structure: 18, overall: 81 },
    variations: [
      {
        technique: 'Structured',
        optimizedPrompt: 'Write a Python 3 function named `custom_sort(arr)` that sorts a list of numbers in ascending order. Include type hints, docstring, and 2 unit test assertions.',
        why: 'Explicitly defines function name and test assertions.',
        expectedUseCase: 'Coding interview prep.',
      },
    ],
    selectedPrompt: 'Write a Python 3 function named custom_sort...',
    responses: [
      {
        technique: 'Structured',
        promptText: 'Write a Python 3 function named custom_sort...',
        responseText: '```python\ndef custom_sort(arr):\n    return sorted(arr)\n\nassert custom_sort([3,1,2]) == [1,2,3]\nprint("Tests Passed!")\n```',
        model: 'gemini-2.5-flash',
        scores: { relevance: 20, completeness: 19, clarity: 19, structure: 20, instructionFollowing: 20, overall: 98 },
      },
    ],
    responseScores: { relevance: 20, completeness: 19, clarity: 19, structure: 20, instructionFollowing: 20, overall: 98 },
    recommendedPrompt: {
      technique: 'Structured',
      promptText: 'Write a Python 3 function named custom_sort...',
      promptScore: 88,
      responseScore: 98,
      finalScore: 94.0,
      rationale: ['Perfect code syntax and test assertions'],
    },
    finalScore: 94.0,
    version: 1,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'p_seed_3',
    title: 'SQL Study Plan',
    originalPrompt: 'Create a study plan for learning SQL.',
    task: 'Develop 4-week SQL curriculum',
    context: 'Data analysis career path',
    desiredOutputFormat: 'Weekly schedule table',
    tone: 'Structured',
    targetAudience: 'Beginners',
    collectionId: 'col_2',
    favorite: false,
    technique: 'Step-by-Step',
    promptScores: { clarity: 17, specificity: 16, context: 15, completeness: 17, structure: 17, overall: 82 },
    variations: [],
    responses: [],
    responseScores: { relevance: 0, completeness: 0, clarity: 0, structure: 0, instructionFollowing: 0, overall: 0 },
    finalScore: 82,
    version: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'p_seed_4',
    title: 'Professional Leave Request Email',
    originalPrompt: 'Write a professional email requesting leave.',
    task: 'Request 3-day personal leave',
    context: 'Corporate engineering team',
    desiredOutputFormat: 'Email subject and body',
    tone: 'Professional & Polite',
    targetAudience: 'Engineering Manager',
    collectionId: 'col_4',
    favorite: true,
    technique: 'Clear & Concise',
    promptScores: { clarity: 18, specificity: 17, context: 16, completeness: 18, structure: 18, overall: 87 },
    variations: [],
    responses: [],
    responseScores: { relevance: 0, completeness: 0, clarity: 0, structure: 0, instructionFollowing: 0, overall: 0 },
    finalScore: 87,
    version: 1,
    createdAt: new Date().toISOString(),
  },
];

const getLocalPrompts = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_PROMPTS));
    return DEFAULT_INITIAL_PROMPTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_INITIAL_PROMPTS;
  }
};

const setLocalPrompts = (prompts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

export const analyzePrompt = async (data) => {
  try {
    const response = await API.post('/prompts/analyze', data);
    return response.data;
  } catch (err) {
    // Local Evaluator Fallback
    const promptText = (data.prompt || data.task || '').trim();
    const wordCount = promptText.split(/\s+/).filter(Boolean).length;
    const clarity = Math.min(20, Math.max(8, Math.round(wordCount * 0.8)));
    const specificity = Math.min(20, Math.max(10, data.task ? 16 : 10));
    const context = Math.min(20, Math.max(6, data.context ? 17 : 8));
    const completeness = Math.min(20, Math.max(10, data.desiredOutputFormat ? 18 : 12));
    const structure = Math.min(20, Math.max(10, promptText.includes('\n') ? 18 : 12));
    const overall = clarity + specificity + context + completeness + structure;
    
    return {
      success: true,
      scores: {
        clarity,
        specificity,
        context,
        completeness,
        structure,
        overall,
        suggestions: overall >= 80 ? ['Great prompt! Clear and well structured.'] : ['Add background context', 'Specify output format'],
      },
    };
  }
};

export const optimizePrompt = async (data) => {
  try {
    const response = await API.post('/prompts/optimize', data);
    return response.data;
  } catch (err) {
    const p = data.prompt || data.task || 'Sample Prompt';
    return {
      success: true,
      variations: [
        {
          technique: 'Clear & Concise',
          optimizedPrompt: `Direct Request: ${p}. Provide a succinct and precise response.`,
          why: 'Eliminates ambiguities and filler words.',
          expectedUseCase: 'Quick lookups.',
          promptScore: 84,
        },
        {
          technique: 'Detailed',
          optimizedPrompt: `Provide a comprehensive breakdown of: ${p}. Include key principles, constraints, and actionable examples.`,
          why: 'Adds domain depth and explicit guidelines.',
          expectedUseCase: 'Technical documentation.',
          promptScore: 88,
        },
        {
          technique: 'Role-Based',
          optimizedPrompt: `Act as a Senior Domain Expert. Explain ${p} clearly, utilizing standard terminology while keeping concepts accessible.`,
          why: 'Engages persona framing for specialized expertise.',
          expectedUseCase: 'Tutorials and consultations.',
          promptScore: 92,
        },
        {
          technique: 'Step-by-Step',
          optimizedPrompt: `Break down ${p} into sequential steps:\n1. Core definition.\n2. Key components.\n3. Implementation.\n4. Summary.`,
          why: 'Guides the model through step-by-step reasoning.',
          expectedUseCase: 'Problem-solving guides.',
          promptScore: 89,
        },
        {
          technique: 'Structured',
          optimizedPrompt: `# Task\n${p}\n\n# Context\n${data.context || 'General context'}\n\n# Output Format\nStructured bullet points`,
          why: 'Uses markdown headers for clear formatting.',
          expectedUseCase: 'Automated data parsing.',
          promptScore: 90,
        },
      ],
    };
  }
};

export const generateResponse = async (promptText) => {
  try {
    const response = await API.post('/prompts/generate', { promptText });
    return response.data;
  } catch (err) {
    return {
      success: true,
      result: {
        responseText: `AI Response output for prompt:\n"${promptText}"\n\n- Key Point 1: Demonstrated response generation.\n- Key Point 2: Heuristic quality scoring applied.\n- Key Point 3: Output ready for evaluation and comparison.`,
        model: 'gemini-2.5-flash (Demo Mode)',
        timestamp: new Date().toISOString(),
        scores: { relevance: 18, completeness: 17, clarity: 19, structure: 18, instructionFollowing: 18, overall: 90 },
      },
    };
  }
};

export const evaluateResponse = async (data) => {
  try {
    const response = await API.post('/prompts/evaluate', data);
    return response.data;
  } catch (err) {
    return {
      success: true,
      scores: { relevance: 18, completeness: 17, clarity: 19, structure: 18, instructionFollowing: 18, overall: 90 },
    };
  }
};

export const comparePrompts = async (items) => {
  try {
    const response = await API.post('/prompts/compare', { items });
    return response.data;
  } catch (err) {
    const first = items[0] || {};
    return {
      success: true,
      comparison: {
        items: items.map((it, idx) => ({
          ...it,
          promptScore: 85 + idx,
          responseScore: 88 + idx,
          finalScore: 86.8 + idx,
        })),
        recommendedPrompt: {
          technique: first.technique || 'Role-Based',
          promptText: first.promptText || 'Optimized prompt text',
          promptScore: 90,
          responseScore: 92,
          finalScore: 91.2,
          rationale: ['Highest combined quality score', 'Strong instruction following'],
        },
      },
    };
  }
};

export const savePrompt = async (promptData) => {
  let savedPrompt = null;
  try {
    const response = await API.post('/prompts', promptData);
    if (response.data?.success && response.data?.prompt) {
      savedPrompt = response.data.prompt;
    }
  } catch (err) {
    console.warn('[Prompt API Warning]: Falling back to local state persistence.');
  }

  // Always update LocalStorage store as well
  const localPrompts = getLocalPrompts();
  const newPrompt = savedPrompt || {
    _id: 'p_' + Date.now(),
    title: promptData.title || promptData.originalPrompt?.substring(0, 30) || 'Untitled Prompt',
    originalPrompt: promptData.originalPrompt,
    task: promptData.task || '',
    context: promptData.context || '',
    desiredOutputFormat: promptData.desiredOutputFormat || '',
    tone: promptData.tone || 'Standard',
    targetAudience: promptData.targetAudience || 'General',
    creativityLevel: promptData.creativityLevel || 'Balanced',
    promptScores: promptData.promptScores || { overall: 80 },
    variations: promptData.variations || [],
    selectedPrompt: promptData.selectedPrompt || promptData.originalPrompt,
    technique: promptData.technique || 'Standard',
    responses: promptData.responses || [],
    responseScores: promptData.responseScores || {},
    recommendedPrompt: promptData.recommendedPrompt || {},
    finalScore: promptData.finalScore || 80,
    favorite: !!promptData.favorite,
    collectionId: promptData.collectionId || null,
    version: 1,
    createdAt: new Date().toISOString(),
  };

  const existingIdx = localPrompts.findIndex((p) => p._id === newPrompt._id);
  if (existingIdx !== -1) {
    localPrompts[existingIdx] = newPrompt;
  } else {
    localPrompts.unshift(newPrompt);
  }

  setLocalPrompts(localPrompts);
  return { success: true, prompt: newPrompt };
};

export const getPrompts = async (params = {}) => {
  let prompts = [];
  try {
    const response = await API.get('/prompts', { params });
    if (response.data?.success && Array.isArray(response.data?.prompts)) {
      prompts = response.data.prompts;
    }
  } catch (err) {
    console.warn('[Get Prompts API Warning]: Loading local state.');
  }

  if (!prompts || prompts.length === 0) {
    prompts = getLocalPrompts();
  } else {
    setLocalPrompts(prompts);
  }

  // Filter local copy if needed
  let filtered = [...prompts];
  if (params.favorite === 'true') {
    filtered = filtered.filter((p) => p.favorite);
  }
  if (params.collectionId) {
    filtered = filtered.filter((p) => String(p.collectionId) === String(params.collectionId) || String(p.collectionId?._id) === String(params.collectionId));
  }
  if (params.technique) {
    filtered = filtered.filter((p) => p.technique === params.technique);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.originalPrompt && p.originalPrompt.toLowerCase().includes(s)) ||
        (p.title && p.title.toLowerCase().includes(s)) ||
        (p.technique && p.technique.toLowerCase().includes(s))
    );
  }

  if (params.sortBy === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (params.sortBy === 'highest_score') {
    filtered.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return { success: true, prompts: filtered };
};

export const getPromptById = async (id) => {
  try {
    const response = await API.get(`/prompts/${id}`);
    return response.data;
  } catch (err) {
    const prompts = getLocalPrompts();
    const prompt = prompts.find((p) => p._id === id);
    return { success: true, prompt, versions: [] };
  }
};

export const updatePrompt = async (id, promptData) => {
  try {
    const response = await API.put(`/prompts/${id}`, promptData);
    if (response.data?.success) return response.data;
  } catch (err) {
    // fallback
  }

  const prompts = getLocalPrompts();
  const idx = prompts.findIndex((p) => p._id === id);
  if (idx !== -1) {
    prompts[idx] = { ...prompts[idx], ...promptData };
    setLocalPrompts(prompts);
    return { success: true, prompt: prompts[idx] };
  }
  return { success: false, message: 'Prompt not found' };
};

export const deletePrompt = async (id) => {
  try {
    await API.delete(`/prompts/${id}`);
  } catch (err) {
    // fallback
  }

  const prompts = getLocalPrompts();
  const updated = prompts.filter((p) => p._id !== id);
  setLocalPrompts(updated);
  return { success: true, message: 'Prompt deleted' };
};

export const toggleFavorite = async (id) => {
  let updatedFav = null;
  try {
    const response = await API.post(`/prompts/${id}/favorite`);
    if (response.data?.success) {
      updatedFav = response.data.favorite;
    }
  } catch (err) {
    // fallback
  }

  const prompts = getLocalPrompts();
  const idx = prompts.findIndex((p) => p._id === id);
  if (idx !== -1) {
    const newFavState = updatedFav !== null ? updatedFav : !prompts[idx].favorite;
    prompts[idx].favorite = newFavState;
    setLocalPrompts(prompts);
    return { success: true, favorite: newFavState, prompt: prompts[idx] };
  }
  return { success: false, message: 'Prompt not found' };
};
