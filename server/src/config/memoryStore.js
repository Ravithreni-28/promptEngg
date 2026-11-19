const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Store dev data at workspace root so it has guaranteed write permissions and survives restarts
const STORE_FILE = path.resolve(__dirname, '../../../dev_store.json');

/**
 * Centralized in-memory data store for AI Prompt Studio
 * Used when local MongoDB instance is offline/unreachable, ensuring:
 * 1. Consistent state across auth, prompts, collections, analytics, and admin
 * 2. Real dynamic calculations instead of hardcoded mock numbers
 * 3. 100% data privacy per user
 * 4. Audit logging of all activities
 */

// Initial Seed Users (passwords hashed with bcrypt)
const hashPasswordSync = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

const initialUsers = [
  {
    _id: 'admin_demo_id',
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: hashPasswordSync('password123'),
    role: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    _id: 'user_demo_id',
    name: 'Demo Student',
    email: 'demo@example.com',
    passwordHash: hashPasswordSync('password123'),
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

const initialCollections = [
  {
    _id: 'col_1',
    userId: 'user_demo_id',
    name: 'Coding Prompts',
    description: 'Software development, algorithms, and refactoring prompts',
    color: '#3b82f6',
    icon: 'Code',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'col_2',
    userId: 'user_demo_id',
    name: 'Study & Learning',
    description: 'Educational summaries, quizzes, and course outlines',
    color: '#10b981',
    icon: 'BookOpen',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'col_3',
    userId: 'user_demo_id',
    name: 'Research Prompts',
    description: 'Academic analysis and paper summaries',
    color: '#8b5cf6',
    icon: 'Search',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    _id: 'col_4',
    userId: 'user_demo_id',
    name: 'Professional Writing',
    description: 'Emails, proposals, and communication templates',
    color: '#f59e0b',
    icon: 'PenTool',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const initialPrompts = [
  {
    _id: 'p_seed_1',
    userId: 'user_demo_id',
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
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
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
    tags: ['machine-learning', 'education'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: 'p_seed_2',
    userId: 'user_demo_id',
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
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    tags: ['python', 'algorithms'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'p_seed_3',
    userId: 'user_demo_id',
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
    tags: ['sql', 'database'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'p_seed_4',
    userId: 'user_demo_id',
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
    tags: ['email', 'workplace'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialActivities = [
  {
    _id: 'act_1',
    userId: 'user_demo_id',
    type: 'USER_REGISTER',
    description: 'User registered account (demo@example.com)',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    _id: 'act_2',
    userId: 'user_demo_id',
    type: 'CREATE_PROMPT',
    description: 'Created prompt "Explain Machine Learning to Beginner"',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: 'act_3',
    userId: 'user_demo_id',
    type: 'TEST_PROMPT',
    description: 'Generated Gemini response for "Python Array Sorting Function"',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.prompts) && Array.isArray(parsed.collections)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[MemoryStore Warning] Could not load dev_store.json, using defaults:', e.message);
  }
  return null;
}

const persisted = loadStore();

// Single shared state object with file-backed persistence
const memoryStore = {
  users: persisted?.users && persisted.users.length > 0 ? persisted.users : [...initialUsers],
  collections: persisted?.collections && persisted.collections.length > 0 ? persisted.collections : [...initialCollections],
  prompts: persisted?.prompts && persisted.prompts.length > 0 ? persisted.prompts : [...initialPrompts],
  versions: persisted?.versions || [],
  activities: persisted?.activities && persisted.activities.length > 0 ? persisted.activities : [...initialActivities],

  persist: function () {
    try {
      const data = {
        users: this.users,
        collections: this.collections,
        prompts: this.prompts,
        versions: this.versions,
        activities: this.activities,
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[MemoryStore Warning] Could not save dev_store.json:', e.message);
    }
  },

  // Helper method to log an activity
  logActivity: function (userId, type, description, metadata = {}) {
    const act = {
      _id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: String(userId),
      type,
      description,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.activities.unshift(act);
    this.persist();
    return act;
  },
};

// Initialize file if not already existing
if (!persisted) {
  memoryStore.persist();
}

module.exports = memoryStore;

