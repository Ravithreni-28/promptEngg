/**
 * Export Utility functions for AI Prompt Studio
 * Supports exporting Prompt, variations, AI responses, scores, and recommendations to TXT, JSON, CSV
 */

export const exportToTXT = (data) => {
  const content = `==================================================
AI PROMPT STUDIO - EXPORT REPORT
==================================================
Title: ${data.title || 'Untitled Prompt'}
Generated At: ${new Date().toLocaleString()}

--------------------------------------------------
ORIGINAL PROMPT
--------------------------------------------------
${data.originalPrompt || data.prompt || 'N/A'}

Prompt Parameters:
- Task/Goal: ${data.task || 'N/A'}
- Context: ${data.context || 'N/A'}
- Output Format: ${data.desiredOutputFormat || 'N/A'}
- Tone: ${data.tone || 'N/A'}
- Target Audience: ${data.targetAudience || 'N/A'}

--------------------------------------------------
HEURISTIC PROMPT QUALITY SCORES
--------------------------------------------------
Overall Score: ${data.promptScores?.overall || 'N/A'} / 100
- Clarity: ${data.promptScores?.clarity || 0}/20
- Specificity: ${data.promptScores?.specificity || 0}/20
- Context: ${data.promptScores?.context || 0}/20
- Completeness: ${data.promptScores?.completeness || 0}/20
- Structure: ${data.promptScores?.structure || 0}/20

--------------------------------------------------
OPTIMIZED VARIATIONS
--------------------------------------------------
${
  data.variations && data.variations.length > 0
    ? data.variations
        .map(
          (v, i) =>
            `[${i + 1}] TECHNIQUE: ${v.technique}\nPROMPT: ${v.optimizedPrompt}\nWHY: ${v.why}\nUSE-CASE: ${v.expectedUseCase}\n`
        )
        .join('\n')
    : 'No variations generated.'
}

--------------------------------------------------
AI GENERATED RESPONSE
--------------------------------------------------
${data.response || data.responseText || 'No response recorded.'}

--------------------------------------------------
RECOMMENDED BEST PROMPT
--------------------------------------------------
Technique: ${data.recommendedPrompt?.technique || 'N/A'}
Prompt Score: ${data.recommendedPrompt?.promptScore || 'N/A'}/100
Response Score: ${data.recommendedPrompt?.responseScore || 'N/A'}/100
Final Score: ${data.recommendedPrompt?.finalScore || 'N/A'}/100
Rationale: ${data.recommendedPrompt?.rationale ? data.recommendedPrompt.rationale.join('; ') : 'N/A'}

==================================================
Created with AI Prompt Studio
`;

  downloadFile(content, `${sanitizeFilename(data.title || 'prompt')}_export.txt`, 'text/plain');
};

export const exportToJSON = (data) => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, `${sanitizeFilename(data.title || 'prompt')}_export.json`, 'application/json');
};

export const exportToCSV = (data) => {
  const headers = ['Field', 'Value'];
  const rows = [
    ['Title', data.title || 'Untitled Prompt'],
    ['Original Prompt', escapeCSV(data.originalPrompt || data.prompt || '')],
    ['Overall Prompt Score', data.promptScores?.overall || 0],
    ['Clarity', data.promptScores?.clarity || 0],
    ['Specificity', data.promptScores?.specificity || 0],
    ['Context', data.promptScores?.context || 0],
    ['Completeness', data.promptScores?.completeness || 0],
    ['Structure', data.promptScores?.structure || 0],
    ['Selected Technique', data.technique || 'Standard'],
    ['Recommended Technique', data.recommendedPrompt?.technique || 'N/A'],
    ['Final Score', data.finalScore || data.recommendedPrompt?.finalScore || 0],
    ['AI Response', escapeCSV(data.response || data.responseText || '')],
  ];

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadFile(csvContent, `${sanitizeFilename(data.title || 'prompt')}_export.csv`, 'text/csv');
};

const sanitizeFilename = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]/gi, '_').substring(0, 30);
};

const escapeCSV = (str) => {
  if (!str) return '""';
  return `"${String(str).replace(/"/g, '""')}"`;
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
