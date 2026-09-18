const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Prompt = require('../models/Prompt');
const Collection = require('../models/Collection');
const PromptVersion = require('../models/PromptVersion');
const Activity = require('../models/Activity');

const seedDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_prompt_studio';
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(uri);

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Prompt.deleteMany({});
    await Collection.deleteMany({});
    await PromptVersion.deleteMany({});
    await Activity.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const adminUser = await User.create({
      name: 'Project Admin',
      email: 'admin@example.com',
      passwordHash: defaultPasswordHash,
      role: 'admin',
    });

    const demoUser = await User.create({
      name: 'Demo Student',
      email: 'demo@example.com',
      passwordHash: defaultPasswordHash,
      role: 'user',
    });

    console.log('[Seed] Creating default collections...');
    const colCoding = await Collection.create({
      name: 'Coding Prompts',
      description: 'Software development, algorithms, and refactoring prompts',
      userId: demoUser._id,
      color: '#3b82f6',
      icon: 'Code',
    });

    const colStudy = await Collection.create({
      name: 'Study & Learning',
      description: 'Educational summaries, quizzes, and course outlines',
      userId: demoUser._id,
      color: '#10b981',
      icon: 'BookOpen',
    });

    const colWriting = await Collection.create({
      name: 'Professional Writing',
      description: 'Emails, proposals, and communication templates',
      userId: demoUser._id,
      color: '#f59e0b',
      icon: 'PenTool',
    });

    console.log('[Seed] Creating sample prompts with evaluations...');

    const samplePrompts = [
      {
        title: 'Explain Machine Learning to Beginner',
        originalPrompt: 'Explain machine learning to a beginner.',
        task: 'Explain ML concepts simply',
        context: 'High school student background',
        desiredOutputFormat: 'Bulleted summary with real world analogy',
        tone: 'Encouraging',
        targetAudience: 'Beginner',
        creativityLevel: 'Balanced',
        collectionId: colStudy._id,
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
            optimizedPrompt: 'Explain machine learning in 4 clear steps:\n1. What is data training?\n2. How models recognize patterns.\n3. Making predictions.\n4. Real-world example (e.g. Netflix recommendations).',
            why: 'Organizes complex ML sub-topics into digestible sequence.',
            expectedUseCase: 'Structured learning guides.',
          },
        ],
        selectedPrompt: 'Act as a friendly computer science professor. Explain the core concept of machine learning to a high-school student using the analogy of learning to ride a bicycle.',
        responses: [
          {
            technique: 'Role-Based',
            promptText: 'Act as a friendly computer science professor...',
            responseText: `Imagine learning to ride a bicycle. At first, you wobble and fall. But every attempt teaches your brain how to balance. Machine learning works the exact same way!

Instead of writing explicit rules for every single situation, we feed a computer thousands of examples. The machine detects patterns and improves its accuracy over time.

Key Takeaways:
- Data is the practice reps.
- Training is learning from mistakes.
- Predictions are riding smoothly!`,
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
          rationale: ['Highest overall score', 'Strong persona alignment', 'Clear output structure'],
        },
        finalScore: 90.4,
      },
      {
        title: 'Python Array Sorting Function',
        originalPrompt: 'Write a Python function to sort an array.',
        task: 'Write array sorting function',
        context: 'Python 3.10 clean code standards',
        desiredOutputFormat: 'Code block with docstring and unit test',
        tone: 'Technical',
        targetAudience: 'Developers',
        collectionId: colCoding._id,
        favorite: true,
        technique: 'Structured',
        promptScores: { clarity: 18, specificity: 15, context: 14, completeness: 16, structure: 18, overall: 81 },
        variations: [
          {
            technique: 'Structured',
            optimizedPrompt: 'Write a Python 3 function named `custom_sort(arr)` that sorts a list of numbers in ascending order without using built-in `sort()`. Include type hints, a comprehensive docstring, and 2 unit test assertions.',
            why: 'Explicitly defines function name, edge cases, and unit test requirements.',
            expectedUseCase: 'Coding interview prep and production utility scripts.',
          },
        ],
        selectedPrompt: 'Write a Python 3 function named `custom_sort(arr)`...',
        responses: [
          {
            technique: 'Structured',
            promptText: 'Write a Python 3 function named custom_sort...',
            responseText: `\`\`\`python
from typing import List

def custom_sort(arr: List[float]) -> List[float]:
    """Sorts a list of numbers in ascending order using QuickSort algorithm.
    
    Args:
        arr: List of numerical values.
    Returns:
        New sorted list of numbers.
    """
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return custom_sort(left) + middle + custom_sort(right)

# Unit Tests
assert custom_sort([3, 1, 4, 1, 5, 9]) == [1, 1, 3, 4, 5, 9]
assert custom_sort([]) == []
print("All unit tests passed successfully!")
\`\`\``,
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
          rationale: ['Perfect code syntax and test assertions', 'Clear type annotations'],
        },
        finalScore: 94.0,
      },
      {
        title: 'SQL Learning Roadmap',
        originalPrompt: 'Create a study plan for learning SQL.',
        task: 'Develop 4-week SQL curriculum',
        context: 'Data analysis career path',
        desiredOutputFormat: 'Weekly schedule table',
        tone: 'Structured',
        targetAudience: 'Beginners',
        collectionId: colStudy._id,
        favorite: false,
        technique: 'Step-by-Step',
        promptScores: { clarity: 17, specificity: 16, context: 15, completeness: 17, structure: 17, overall: 82 },
        variations: [
          {
            technique: 'Step-by-Step',
            optimizedPrompt: 'Design a structured 4-week SQL study plan for an aspiring Data Analyst. Break down each week into specific topics (SELECT, JOINs, Aggregations, Window Functions), recommended practice exercises, and a weekend project.',
            why: 'Organizes learning into actionable weekly milestones.',
            expectedUseCase: 'Self-paced learning roadmaps.',
          },
        ],
        responses: [],
        responseScores: { relevance: 0, completeness: 0, clarity: 0, structure: 0, instructionFollowing: 0, overall: 0 },
        finalScore: 82,
      },
      {
        title: 'Professional Leave Request Email',
        originalPrompt: 'Write a professional email requesting leave.',
        task: 'Request 3-day personal leave',
        context: 'Corporate software engineering team',
        desiredOutputFormat: 'Email subject and body',
        tone: 'Professional & Polite',
        targetAudience: 'Engineering Manager',
        collectionId: colWriting._id,
        favorite: true,
        technique: 'Clear & Concise',
        promptScores: { clarity: 18, specificity: 17, context: 16, completeness: 18, structure: 18, overall: 87 },
        variations: [],
        responses: [],
        responseScores: { relevance: 0, completeness: 0, clarity: 0, structure: 0, instructionFollowing: 0, overall: 0 },
        finalScore: 87,
      },
    ];

    for (const pData of samplePrompts) {
      const p = await Prompt.create({ ...pData, userId: demoUser._id });
      await PromptVersion.create({
        promptId: p._id,
        versionNumber: 1,
        promptText: p.originalPrompt,
        technique: p.technique,
        promptScores: p.promptScores,
        changeSummary: 'Initial prompt creation',
      });
    }

    await Activity.create({
      userId: demoUser._id,
      type: 'SEED_DATA',
      description: 'Database initialized with demo prompts and sample collections',
    });

    console.log('[Seed] Database seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Test Credentials:');
    console.log('Admin User: admin@example.com / password123');
    console.log('Standard User: demo@example.com / password123');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDB();
