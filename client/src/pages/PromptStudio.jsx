import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Wand2,
  Sparkles,
  Play,
  RotateCcw,
  Save,
  Download,
  Star,
  CheckCircle2,
  FolderKanban,
  Zap,
  HelpCircle,
  Award,
} from 'lucide-react';
import ScoreCard from '../components/ScoreCard';
import VariationCard from '../components/VariationCard';
import ResponseCard from '../components/ResponseCard';
import ComparisonTable from '../components/ComparisonTable';
import ExportModal from '../components/ExportModal';

import {
  analyzePrompt as apiAnalyze,
  optimizePrompt as apiOptimize,
  generateResponse as apiGenerate,
  comparePrompts as apiCompare,
  savePrompt as apiSavePrompt,
} from '../services/promptService';
import { getCollections } from '../services/collectionService';
import { useToast } from '../context/ToastContext';

const PromptStudio = () => {
  const location = useLocation();
  const { showToast } = useToast();

  // Form State
  const [prompt, setPrompt] = useState('');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [desiredOutputFormat, setDesiredOutputFormat] = useState('');
  const [tone, setTone] = useState('Standard');
  const [targetAudience, setTargetAudience] = useState('General');
  const [creativityLevel, setCreativityLevel] = useState('Balanced');
  const [selectedCollection, setSelectedCollection] = useState('');

  // Collections & Saved ID State
  const [collections, setCollections] = useState([]);
  const [savedPromptId, setSavedPromptId] = useState(null);
  const savedPromptIdRef = useRef(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Results State
  const [promptScores, setPromptScores] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [testedResponses, setTestedResponses] = useState({});
  const [comparisonData, setComparisonData] = useState(null);

  // Loading States
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    fetchCollectionsList();
    if (location.state?.loadPrompt) {
      const p = location.state.loadPrompt;
      setPrompt(p.originalPrompt || '');
      setTask(p.task || '');
      setContext(p.context || '');
      setDesiredOutputFormat(p.desiredOutputFormat || '');
      setTone(p.tone || 'Standard');
      setTargetAudience(p.targetAudience || 'General');
      setCreativityLevel(p.creativityLevel || 'Balanced');
      if (p.promptScores) setPromptScores(p.promptScores);
      if (p.variations) setVariations(p.variations);
      if (p._id) {
        setSavedPromptId(p._id);
        savedPromptIdRef.current = p._id;
      }
      setIsFavorite(!!p.favorite);

      // Restore collection assignment
      if (p.collectionId) {
        const cId = typeof p.collectionId === 'object' ? p.collectionId._id : p.collectionId;
        setSelectedCollection(cId || '');
      }

      // Restore AI responses and tested responses map
      if (p.responses && p.responses.length > 0) {
        setAiResponse(p.responses[0]);
        const respMap = {};
        p.responses.forEach((r) => {
          if (r.technique) respMap[r.technique] = r;
        });
        setTestedResponses(respMap);
      }

      // Restore comparison data
      if (p.recommendedPrompt) {
        setComparisonData({
          recommendedPrompt: p.recommendedPrompt,
          items: p.responses || [],
        });
      }
    }
  }, [location.state]);

  const fetchCollectionsList = async () => {
    try {
      const res = await getCollections();
      if (res.success) setCollections(res.collections || []);
    } catch (err) {
      console.warn('[Collections Warning]:', err.message);
    }
  };

  // Quick Preset Presets
  const samplePresets = [
    {
      title: 'ML Explanation',
      prompt: 'Explain machine learning to a beginner.',
      task: 'Explain core concepts',
      context: 'High school background',
      format: 'Bulleted summary with analogy',
      tone: 'Encouraging',
      audience: 'Beginners',
    },
    {
      title: 'Python QuickSort',
      prompt: 'Write a Python function to sort an array.',
      task: 'Write array sorting function',
      context: 'Python 3.10 standards',
      format: 'Code block with type hints & assertions',
      tone: 'Technical',
      audience: 'Developers',
    },
    {
      title: 'SQL Study Plan',
      prompt: 'Create a study plan for learning SQL.',
      task: '4-week learning roadmap',
      context: 'Data analysis career path',
      format: 'Weekly schedule table',
      tone: 'Structured',
      audience: 'Students',
    },
    {
      title: 'Leave Request Email',
      prompt: 'Write a professional email requesting leave.',
      task: 'Request 3-day personal leave',
      context: 'Engineering team',
      format: 'Email subject and body',
      tone: 'Professional & Polite',
      audience: 'Engineering Manager',
    },
  ];

  const handleApplyPreset = (preset) => {
    setPrompt(preset.prompt);
    setTask(preset.task);
    setContext(preset.context);
    setDesiredOutputFormat(preset.format);
    setTone(preset.tone);
    setTargetAudience(preset.audience);
    showToast(`Applied preset: ${preset.title}`, 'info');
  };

  // 1. Analyze Prompt — auto-persists to history after scoring
  const handleAnalyze = async () => {
    if (!prompt.trim() && !task.trim()) {
      showToast('Please enter a prompt or task before analyzing.', 'error');
      return null;
    }

    setAnalyzing(true);
    try {
      const res = await apiAnalyze({
        prompt,
        task,
        context,
        desiredOutputFormat,
        tone,
        targetAudience,
      });
      if (res.success) {
        setPromptScores(res.scores);
        showToast('Prompt analysis complete!', 'success');

        // Auto-save (or update) in history so it appears immediately
        try {
          const currentId = savedPromptIdRef.current || savedPromptId;
          const savePayload = {
            ...(currentId ? { _id: currentId } : {}),
            title: task ? task.substring(0, 30) : prompt.substring(0, 30),
            originalPrompt: prompt.trim() || task.trim(),
            task,
            context,
            desiredOutputFormat,
            tone,
            targetAudience,
            creativityLevel,
            promptScores: res.scores,
            technique: 'Standard',
            finalScore: res.scores?.overall || 75,
            favorite: isFavorite,
            collectionId: selectedCollection || null,
          };
          const saveRes = await apiSavePrompt(savePayload);
          if (saveRes.success && saveRes.prompt?._id) {
            savedPromptIdRef.current = saveRes.prompt._id;
            setSavedPromptId(saveRes.prompt._id);
          }
        } catch (saveErr) {
          console.warn('[Auto-save after analyze failed]:', saveErr.message);
        }
        return res.scores;
      }
    } catch (err) {
      showToast('Failed to analyze prompt.', 'error');
    } finally {
      setAnalyzing(false);
    }
    return null;
  };

  // 2. Optimize Prompt (Generate 5 Variations via Gemini)
  const handleOptimize = async () => {
    if (!prompt.trim() && !task.trim()) {
      showToast('Please enter a prompt or task before optimizing.', 'error');
      return;
    }

    setOptimizing(true);
    try {
      // First run heuristic analysis (also auto-saves the base record)
      const scores = await handleAnalyze();

      const res = await apiOptimize({
        prompt,
        task,
        context,
        desiredOutputFormat,
        tone,
        targetAudience,
      });

      if (res.success && res.variations) {
        setVariations(res.variations);
        showToast('Generated 5 optimized prompt variations using Gemini!', 'success');

        // Update the saved record with the generated variations
        try {
          const currentScores = scores || promptScores;
          const currentId = savedPromptIdRef.current || savedPromptId;
          const savePayload = {
            ...(currentId ? { _id: currentId } : {}),
            title: task ? task.substring(0, 30) : prompt.substring(0, 30),
            originalPrompt: prompt.trim() || task.trim(),
            task,
            context,
            desiredOutputFormat,
            tone,
            targetAudience,
            creativityLevel,
            promptScores: currentScores || {},
            variations: res.variations,
            technique: res.variations[0]?.technique || 'Standard',
            finalScore: currentScores?.overall || 75,
            favorite: isFavorite,
            collectionId: selectedCollection || null,
          };
          const saveRes = await apiSavePrompt(savePayload);
          if (saveRes.success && saveRes.prompt?._id) {
            savedPromptIdRef.current = saveRes.prompt._id;
            setSavedPromptId(saveRes.prompt._id);
          }
        } catch (saveErr) {
          console.warn('[Auto-save after optimize failed]:', saveErr.message);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate variations.', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  // 3. Generate AI Response from Gemini
  const handleGenerateResponse = async (targetText, targetVariation = null) => {
    const activeVar = targetVariation || selectedVariation;
    const textToSend = targetText || (activeVar ? activeVar.optimizedPrompt : prompt);
    const technique = activeVar ? activeVar.technique : 'Original Prompt';

    if (!textToSend.trim()) {
      showToast('Please select or enter a prompt first.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await apiGenerate(textToSend);
      if (res.success && res.result) {
        const enrichedResult = {
          ...res.result,
          technique,
          promptText: textToSend,
        };
        setAiResponse(enrichedResult);

        const updatedTested = {
          ...testedResponses,
          [technique]: enrichedResult,
        };
        setTestedResponses(updatedTested);

        showToast(`AI response generated for "${technique}"!`, 'success');

        // Automatically trigger comparison evaluation
        runComparisonEvaluation(textToSend, enrichedResult, updatedTested);

        // Auto-save the newly generated response to history
        try {
          const currentId = savedPromptIdRef.current || savedPromptId;
          const allResponsesList = Object.values(updatedTested);
          const savePayload = {
            ...(currentId ? { _id: currentId } : {}),
            title: task ? task.substring(0, 30) : prompt.substring(0, 30),
            originalPrompt: prompt.trim() || task.trim(),
            task,
            context,
            desiredOutputFormat,
            tone,
            targetAudience,
            creativityLevel,
            promptScores,
            variations,
            selectedPrompt: activeVar ? activeVar.optimizedPrompt : prompt,
            technique,
            responses: allResponsesList,
            responseScores: enrichedResult.scores || {},
            favorite: isFavorite,
            collectionId: selectedCollection || null,
          };
          const saveRes = await apiSavePrompt(savePayload);
          if (saveRes.success && saveRes.prompt?._id) {
            savedPromptIdRef.current = saveRes.prompt._id;
            setSavedPromptId(saveRes.prompt._id);
          }
        } catch (saveErr) {
          console.warn('[Auto-save after response failed]:', saveErr.message);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to connect to Gemini.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 4. Run Comparison & Recommendation Engine
  const runComparisonEvaluation = async (activePromptText, activeResponse, currentTested = testedResponses) => {
    setComparing(true);
    try {
      const activeTech = selectedVariation ? selectedVariation.technique : 'Original Prompt';
      const itemsToCompare = [
        {
          technique: activeTech,
          promptText: activePromptText,
          responseText: activeResponse.responseText,
        },
      ];

      // Add all variations to comparative score check
      variations.forEach((v) => {
        if (v.optimizedPrompt !== activePromptText) {
          const varTested = currentTested[v.technique];
          itemsToCompare.push({
            technique: v.technique,
            promptText: v.optimizedPrompt,
            responseText: varTested ? varTested.responseText : activeResponse.responseText,
          });
        }
      });

      const compRes = await apiCompare(itemsToCompare);
      if (compRes.success && compRes.comparison) {
        setComparisonData(compRes.comparison);

        // Auto-save comparison recommendation and best prompt
        try {
          const currentId = savedPromptIdRef.current || savedPromptId;
          const savePayload = {
            ...(currentId ? { _id: currentId } : {}),
            recommendedPrompt: compRes.comparison.recommendedPrompt,
            finalScore: compRes.comparison.recommendedPrompt?.finalScore || promptScores?.overall || 75,
          };
          const saveRes = await apiSavePrompt(savePayload);
          if (saveRes.success && saveRes.prompt?._id) {
            savedPromptIdRef.current = saveRes.prompt._id;
            setSavedPromptId(saveRes.prompt._id);
          }
        } catch (saveErr) {
          console.warn('[Auto-save after compare failed]:', saveErr.message);
        }
      }
    } catch (err) {
      console.warn('[Comparison Error]:', err.message);
    } finally {
      setComparing(false);
    }
  };

  // Save Prompt to History/Database
  const handleSave = async () => {
    if (!prompt.trim()) {
      showToast('Please write a prompt before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const allResponsesList = Object.values(testedResponses);
      if (aiResponse && !allResponsesList.some((r) => r.responseText === aiResponse.responseText)) {
        allResponsesList.push(aiResponse);
      }

      const currentId = savedPromptIdRef.current || savedPromptId;
      const payload = {
        // Include _id if we already auto-saved this session — backend will upsert
        ...(currentId ? { _id: currentId } : {}),
        title: task ? task.substring(0, 30) : prompt.substring(0, 30),
        originalPrompt: prompt.trim() || task.trim(),
        task,
        context,
        desiredOutputFormat,
        tone,
        targetAudience,
        creativityLevel,
        promptScores,
        variations,
        selectedPrompt: selectedVariation ? selectedVariation.optimizedPrompt : prompt,
        technique: selectedVariation ? selectedVariation.technique : (variations[0]?.technique || 'Standard'),
        responses: allResponsesList.length > 0 ? allResponsesList : aiResponse ? [aiResponse] : [],
        responseScores: aiResponse?.scores || {},
        recommendedPrompt: comparisonData?.recommendedPrompt || {},
        finalScore: comparisonData?.recommendedPrompt?.finalScore || promptScores?.overall || 75,
        favorite: isFavorite,
        collectionId: selectedCollection || null,
      };

      const res = await apiSavePrompt(payload);
      if (res.success) {
        savedPromptIdRef.current = res.prompt._id;
        setSavedPromptId(res.prompt._id);
        showToast('Prompt saved to history and collection!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save prompt.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setTask('');
    setContext('');
    setDesiredOutputFormat('');
    setTone('Standard');
    setTargetAudience('General');
    setPromptScores(null);
    setVariations([]);
    setSelectedVariation(null);
    setAiResponse(null);
    setTestedResponses({});
    setComparisonData(null);
    setSavedPromptId(null);
    savedPromptIdRef.current = null;
    showToast('Workspace cleared.', 'info');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Wand2 className="w-7 h-7 text-indigo-400" />
            <span>Prompt Studio Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Craft, analyze, optimize variations with Gemini, generate responses, and rank best prompts.
          </p>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isFavorite ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !prompt}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!promptScores && !aiResponse}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button
            onClick={handleClear}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
            title="Clear Workspace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Starters Banner */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Example Presets (Click to load):</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-indigo-500/40 transition-colors font-medium"
            >
              + {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN INPUT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column: Textarea & Parameters (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>User Input Prompt *</span>
                <span className="text-slate-500 font-mono text-[10px]">{prompt.length} chars</span>
              </label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... (e.g. 'Explain machine learning to a beginner with practical examples.')"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono leading-relaxed transition-colors"
              ></textarea>
            </div>

            {/* Context & Task Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task / Goal</label>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g. Explain core concepts"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Background Context</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. For a high school student"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Formatting & Target Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Output Format</label>
                <select
                  value={desiredOutputFormat}
                  onChange={(e) => setDesiredOutputFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Default / Unspecified</option>
                  <option value="Bulleted list with summary">Bulleted List</option>
                  <option value="Markdown table">Markdown Table</option>
                  <option value="Code block with unit tests">Code Block</option>
                  <option value="Step-by-step tutorial">Step-by-Step Tutorial</option>
                  <option value="Executive summary">Executive Summary</option>
                  <option value="JSON Schema">JSON Schema</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Professional">Professional</option>
                  <option value="Technical">Technical / Academic</option>
                  <option value="Encouraging">Encouraging / Simple</option>
                  <option value="Creative">Creative / Engaging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="General">General Audience</option>
                  <option value="Beginners">Beginners / Students</option>
                  <option value="Developers">Software Developers</option>
                  <option value="Executives">C-Level Executives</option>
                  <option value="Researchers">Researchers</option>
                </select>
              </div>
            </div>

            {/* Collection Assign */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Save to Collection</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Collection (Default)</option>
                {collections.map((col) => (
                  <option key={col._id} value={col._id}>
                    📁 {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !prompt}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
              >
                {analyzing ? <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> : <Award className="w-4 h-4 text-indigo-400" />}
                <span>Analyze Quality</span>
              </button>

              <button
                onClick={handleOptimize}
                disabled={optimizing || !prompt}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {optimizing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4 text-cyan-300" />}
                <span>Optimize (5 Variations)</span>
              </button>

              <button
                onClick={() => handleGenerateResponse()}
                disabled={generating || !prompt}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {generating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />}
                <span>Generate AI Response</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Score Summary */}
        <div className="space-y-6">
          {promptScores ? (
            <ScoreCard scores={promptScores} />
          ) : (
            <div className="glass-panel p-8 text-center space-y-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-base">Prompt Evaluation Engine</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Click <strong>"Analyze Quality"</strong> to run our heuristic analysis across Clarity, Specificity, Context, Completeness, and Structure.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OPTIMIZED VARIATIONS GRID */}
      {variations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Optimized Gemini Prompt Variations</span>
              </h2>
              <p className="text-xs text-slate-400">5 engineered techniques generated by Gemini LLM</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {variations.map((variation, idx) => (
              <VariationCard
                key={idx}
                variation={variation}
                isSelected={selectedVariation?.technique === variation.technique}
                onSelectForTesting={(v) => {
                  setSelectedVariation(v);
                  handleGenerateResponse(v.optimizedPrompt, v);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI RESPONSE OUTPUT */}
      {aiResponse && (
        <div className="pt-4 border-t border-slate-800">
          <ResponseCard
            responseData={aiResponse}
            onRegenerate={() => handleGenerateResponse()}
            onExport={() => setIsExportOpen(true)}
          />
        </div>
      )}

      {/* COMPARISON & RECOMMENDATION ENGINE */}
      {comparisonData && (
        <div className="pt-4 border-t border-slate-800">
          <ComparisonTable
            comparisonData={comparisonData}
            onUsePrompt={(recommendedText) => {
              setPrompt(recommendedText);
              showToast('Recommended best prompt loaded into workspace!', 'success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={{
          title: task || prompt.substring(0, 30),
          originalPrompt: prompt,
          task,
          context,
          desiredOutputFormat,
          tone,
          targetAudience,
          promptScores,
          variations,
          responseText: aiResponse?.responseText,
          responseScores: aiResponse?.scores,
          recommendedPrompt: comparisonData?.recommendedPrompt,
          technique: selectedVariation ? selectedVariation.technique : 'Standard',
        }}
      />
    </div>
  );
};

export default PromptStudio;
