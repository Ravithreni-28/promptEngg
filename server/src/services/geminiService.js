const { GoogleGenAI } = require('@google/genai');

/**
 * Gemini Service using the official @google/genai SDK
 * API Key is strictly maintained in backend environment variables (.env).
 * Frontend never accesses or receives the API Key.
 */

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('[Gemini Client Init Error]:', error.message);
    return null;
  }
};

const getModelName = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Generate 5 Prompt Variations using Gemini
 * 1. Clear & Concise
 * 2. Detailed
 * 3. Role-Based
 * 4. Step-by-Step
 * 5. Structured
 */
const generatePromptVariations = async (prompt, options = {}) => {
  const ai = getGeminiClient();
  const modelName = getModelName();

  const { context = '', task = '', desiredOutputFormat = '', tone = '', targetAudience = '' } = options;

  if (!ai) {
    console.warn('[Gemini Service] GEMINI_API_KEY is not configured in server/.env. Using structured fallback variations.');
    return getFallbackVariations(prompt, options);
  }

  const systemInstruction = `You are an expert Prompt Engineer. Take the user's input prompt and optimize it into exactly 5 distinct prompting techniques:
1. Clear & Concise: Direct, minimal words, high clarity.
2. Detailed: Includes rich domain context, constraints, and edge cases.
3. Role-Based: Assigns a clear persona or expert domain role.
4. Step-by-Step: Orders tasks sequentially with explicit steps.
5. Structured: Uses markdown sections, key-value delimiters, or XML-like headers.

Return ONLY a valid JSON array of 5 objects. Each object MUST contain:
- "technique": String name of technique
- "optimizedPrompt": String of improved prompt
- "why": Brief explanation of why this version improves AI output
- "expectedUseCase": When to use this specific technique

JSON format ONLY. Do not include markdown code block ticks (\`\`\`json) or conversational text around the JSON array.`;

  const userContent = `Original Prompt: "${prompt}"
Context: ${context || 'None provided'}
Task: ${task || 'None provided'}
Desired Output Format: ${desiredOutputFormat || 'None specified'}
Tone: ${tone || 'Standard'}
Target Audience: ${targetAudience || 'General'}`;

  try {
    const fullPrompt = `${systemInstruction}\n\n${userContent}`;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const variations = JSON.parse(cleanJson);

    if (Array.isArray(variations) && variations.length > 0) {
      return variations;
    }
    return getFallbackVariations(prompt, options);
  } catch (err) {
    console.error('[Gemini API Error - Variations]:', err.message);
    return getFallbackVariations(prompt, options);
  }
};

/**
 * Send selected prompt to Gemini and get AI response
 */
const generateAIResponse = async (promptText) => {
  const ai = getGeminiClient();
  const modelName = getModelName();

  if (!ai) {
    return {
      responseText: `[Notice: GEMINI_API_KEY not configured in backend server/.env]\n\nYour prompt:\n"${promptText}"\n\nTo enable live responses from Google Gemini:\n1. Open file: server/.env\n2. Set GEMINI_API_KEY=your_key_here\n3. Restart the server.\n\nDemonstration AI response output:\nThe prompt was received and processed through the AI Prompt Studio pipeline. Heuristic response evaluation and weighted comparison scoring have been executed below.`,
      model: `${modelName} (Demo / Key Required)`,
      timestamp: new Date().toISOString(),
      isDemo: true,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText,
    });

    const text = response.text;

    return {
      responseText: text || 'No response text returned from Gemini.',
      model: modelName,
      timestamp: new Date().toISOString(),
      isDemo: false,
    };
  } catch (err) {
    console.error('[Gemini API Error - Generate]:', err.message);
    throw new Error(`Gemini API Error: ${err.message}`);
  }
};

/**
 * Generate intelligent improvement suggestions using Gemini when API key is available
 */
const generateGeminiSuggestions = async (prompt, currentScores = {}) => {
  const ai = getGeminiClient();
  const modelName = getModelName();

  if (!ai) return null;

  try {
    const promptReq = `You are a Senior Prompt Engineer. Review this user prompt:
"${prompt}"

Current heuristic scores:
- Clarity: ${currentScores.clarity || 'N/A'}/20
- Specificity: ${currentScores.specificity || 'N/A'}/20
- Context: ${currentScores.context || 'N/A'}/20
- Completeness: ${currentScores.completeness || 'N/A'}/20
- Structure: ${currentScores.structure || 'N/A'}/20
Overall: ${currentScores.overall || 'N/A'}/100

Provide exactly 3 concise, highly actionable suggestions to elevate the quality of this prompt.
Return ONLY a valid JSON array of 3 strings. Example: ["Specify the exact programming language version.", "Include positive and negative examples.", "Format the output as a Markdown table."]
No code fence ticks or surrounding text.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptReq,
    });

    const clean = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(clean);
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      return suggestions;
    }
    return null;
  } catch (err) {
    console.warn('[Gemini Suggestions Warning]:', err.message);
    return null;
  }
};

/**
 * Fallback prompt variations when API key is missing or call fails
 */
const getFallbackVariations = (prompt, options = {}) => {
  const p = prompt || options.task || 'Explain machine learning';
  const role = options.targetAudience ? `for ${options.targetAudience}` : '';

  return [
    {
      technique: 'Clear & Concise',
      optimizedPrompt: `Direct Request: ${p}. Provide a succinct and precise answer.`,
      why: 'Eliminates ambiguities and focuses strictly on the core directive.',
      expectedUseCase: 'Quick lookups, mobile queries, or token-constrained requests.',
    },
    {
      technique: 'Detailed',
      optimizedPrompt: `Provide an in-depth analysis of: ${p}. Include key concepts, practical real-world examples, potential challenges, and actionable insights ${role}.`,
      why: 'Adds comprehensive constraints and domain depth.',
      expectedUseCase: 'Technical documentation, deep learning, or research projects.',
    },
    {
      technique: 'Role-Based',
      optimizedPrompt: `Act as a Senior Domain Expert. Explain ${p} clearly ${role}, utilizing industry standard terminology while keeping concepts accessible.`,
      why: 'Engages persona framing for specialized expertise and appropriate tone.',
      expectedUseCase: 'Expert consultations, educational tutorials, or professional advisory.',
    },
    {
      technique: 'Step-by-Step',
      optimizedPrompt: `Break down ${p} into sequential steps:\nStep 1: Core definition and principles.\nStep 2: Key components and workflow.\nStep 3: Implementation or practical usage.\nStep 4: Summary of best practices.`,
      why: 'Guides the model through logical reasoning before providing answers.',
      expectedUseCase: 'Complex problem-solving, tutorials, or algorithm walkthroughs.',
    },
    {
      technique: 'Structured',
      optimizedPrompt: `# Task\n${p}\n\n# Context & Target\n${options.context || 'General domain context'} ${role}\n\n# Desired Output\nStructure as:\n- Overview\n- Key Takeaways\n- Examples`,
      why: 'Uses visual delimiters (headers & bullets) to enforce strict schema structure.',
      expectedUseCase: 'Executive summaries, reports, or automated data parsing.',
    },
  ];
};

module.exports = {
  generatePromptVariations,
  generateAIResponse,
  generateGeminiSuggestions,
};
