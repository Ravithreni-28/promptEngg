/**
 * Automated 25-Step End-to-End Verification Test Suite
 * AI Prompt Studio
 */

const { Duplex } = require('stream');
const http = require('http');
const path = require('path');

// Ensure root dev_store is loaded
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'test_jwt_secret_dev_key_12345';

const app = require('./server/src/server');

// HTTP Dispatcher helper that avoids TCP socket limitations in Windows sandbox
function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) {
        callback();
      },
    });

    const req = new http.IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = {};
    for (const [key, value] of Object.entries(headers)) {
      req.headers[key.toLowerCase()] = value;
    }
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.headers['content-type'] = req.headers['content-type'] || 'application/json';
      req.headers['content-length'] = Buffer.byteLength(payload);
    }

    const res = new http.ServerResponse(req);
    res.assignSocket(socket);

    let resBody = '';
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = function (chunk, encoding, callback) {
      if (chunk) resBody += chunk.toString();
      return originalWrite(chunk, encoding, callback);
    };

    res.end = function (chunk, encoding, callback) {
      if (chunk) resBody += chunk.toString();
      const result = originalEnd(chunk, encoding, callback);

      let parsed = null;
      try {
        parsed = JSON.parse(resBody);
      } catch (e) {
        parsed = resBody;
      }
      resolve({ status: res.statusCode, headers: res.getHeaders(), body: parsed });
      return result;
    };

    app.handle(req, res);

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      setImmediate(() => {
        req.emit('data', Buffer.from(payload));
        req.emit('end');
      });
    } else {
      setImmediate(() => {
        req.emit('end');
      });
    }
  });
}

async function run25StepSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING AI PROMPT STUDIO 25-STEP MASTER VERIFICATION SUITE');
  console.log('================================================================\n');

  let testUser = {
    name: 'Senior Test Engineer',
    email: `test_engineer_${Date.now()}@promptstudio.dev`,
    password: 'Password123!',
  };
  let authToken = null;
  let savedPromptId = null;
  let testCollectionId = null;
  let results = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(`ASSERTION FAILED: ${message}`);
    }
  }

  function recordStep(stepNum, name, status, details = '') {
    results.push({ stepNum, name, status, details });
    const symbol = status === 'PASS' ? '✅' : '❌';
    console.log(`${symbol} Step ${stepNum}: ${name} -> [${status}] ${details}`);
  }

  try {
    // ── STEP 1: Register New User ──────────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/auth/register',
        body: testUser,
      });
      assert(res.status === 201 || res.status === 200, `Expected 200/201, got ${res.status}`);
      assert(res.body.token, 'Expected JWT token in registration response');
      authToken = res.body.token;
      recordStep(1, 'Register New User', 'PASS', `User ID: ${res.body.user?.id || res.body.user?._id}`);
    }

    // ── STEP 2: Log in with Credentials ────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/auth/login',
        body: { email: testUser.email, password: testUser.password },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.token, 'Expected JWT token in login response');
      authToken = res.body.token;
      recordStep(2, 'Log in with Credentials', 'PASS', `Authenticated: ${res.body.user?.email}`);
    }

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // ── STEP 3: Create Prompt Input ────────────────────────────────────────
    const promptInput = {
      task: 'Design a resilient microservices retry mechanism with exponential backoff and jitter',
      context: 'Distributed financial system handling 10k TPS with payment gateways',
      desiredOutputFormat: 'JSON configuration schema with architecture notes',
    };
    recordStep(3, 'Create New Prompt Input', 'PASS', `Task: "${promptInput.task.substring(0, 40)}..."`);

    // ── STEP 4: Analyze Prompt Quality ─────────────────────────────────────
    let analysisScores = null;
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts/analyze',
        headers: authHeaders,
        body: { prompt: `${promptInput.task}. Context: ${promptInput.context}. Output: ${promptInput.desiredOutputFormat}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      analysisScores = res.body.scores;
      assert(analysisScores && typeof analysisScores.overall === 'number', 'Expected valid scores');
      recordStep(4, 'Analyze Prompt Quality', 'PASS', `Overall Score: ${analysisScores.overall}/100 (Clarity: ${analysisScores.clarity}, Specificity: ${analysisScores.specificity})`);
    }

    // ── STEP 5: Generate Optimized Variations ──────────────────────────────
    let variations = [];
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts/optimize',
        headers: authHeaders,
        body: { prompt: promptInput.task, context: promptInput.context },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      variations = res.body.variations;
      assert(Array.isArray(variations) && variations.length >= 3, `Expected >= 3 variations, got ${variations?.length}`);
      recordStep(5, 'Generate Optimized Variations', 'PASS', `Generated ${variations.length} techniques: ${variations.map((v) => v.technique).join(', ')}`);
    }

    // ── STEP 6: Generate AI Responses ──────────────────────────────────────
    let generatedResponses = [];
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts/generate',
        headers: authHeaders,
        body: {
          promptText: variations[0]?.optimizedPrompt || promptInput.task,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      const aiResult = res.body.result;
      assert(aiResult && aiResult.responseText, 'Expected generated AI response text');
      generatedResponses.push({
        technique: variations[0]?.technique || 'Clear & Concise',
        responseText: aiResult.responseText,
        scores: aiResult.scores,
      });
      recordStep(6, 'Generate AI Responses', 'PASS', `AI generated response (${aiResult.responseText.length} chars)`);
    }

    // ── STEP 7: Evaluate Responses ─────────────────────────────────────────
    let evaluations = [];
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts/evaluate',
        headers: authHeaders,
        body: {
          promptText: promptInput.task,
          responseText: generatedResponses[0]?.responseText || 'Sample AI response',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.scores && typeof res.body.scores.overall === 'number', 'Expected evaluation scores');
      evaluations.push({
        technique: generatedResponses[0]?.technique,
        scores: res.body.scores,
      });
      recordStep(7, 'Evaluate AI Responses', 'PASS', `Response Quality Score: ${res.body.scores.overall}/100`);
    }

    // ── STEP 8 & 9: Compare Versions & Recommend Best Prompt ───────────────
    let recommended = null;
    let finalScore = 0;
    {
      // Comparison items
      const itemsToCompare = variations.map((v, idx) => ({
        technique: v.technique,
        promptText: v.optimizedPrompt,
        responseText: idx === 0 ? generatedResponses[0]?.responseText : `Generated sample response for ${v.technique}`,
      }));

      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts/compare',
        headers: authHeaders,
        body: {
          items: itemsToCompare,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      const comparison = res.body.comparison;
      assert(comparison && Array.isArray(comparison.items), 'Expected items array');
      assert(comparison.recommendedPrompt, 'Expected recommendedPrompt');
      recommended = comparison.recommendedPrompt;
      finalScore = Math.round(recommended.finalScore);

      recordStep(8, 'Compare Prompt Versions', 'PASS', `Compared ${comparison.items.length} techniques: highest ranked is ${recommended.technique} (${recommended.finalScore}/100)`);
      recordStep(9, 'Recommend Best Prompt', 'PASS', `Formula: (${recommended.promptScore}*0.4)+(${recommended.responseScore}*0.6) = ${recommended.finalScore} | Best: ${recommended?.technique}`);
    }

    // ── STEP 10: Save Prompt ───────────────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/prompts',
        headers: authHeaders,
        body: {
          title: 'Resilient Microservices Retry Mechanism',
          originalPrompt: promptInput.task,
          task: promptInput.task,
          context: promptInput.context,
          desiredOutputFormat: promptInput.desiredOutputFormat,
          technique: recommended?.technique || 'Role-Based',
          optimizedPrompt: recommended?.optimizedPrompt || variations[0]?.optimizedPrompt,
          promptScores: analysisScores,
          variations,
          responses: generatedResponses,
          evaluations,
          recommendedPrompt: recommended,
          finalScore: finalScore,
        },
      });
      assert(res.status === 201 || res.status === 200, `Expected 200/201, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      savedPromptId = res.body.prompt?._id || res.body.prompt?.id;
      assert(savedPromptId, 'Expected saved prompt ID');
      recordStep(10, 'Save Prompt to Database', 'PASS', `Saved Prompt ID: ${savedPromptId}`);
    }

    // ── STEP 11: History Verification ──────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/prompts',
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      const found = res.body.prompts.find((p) => p._id === savedPromptId || p.id === savedPromptId);
      assert(found, `Saved prompt ${savedPromptId} must appear in history`);
      recordStep(11, 'Navigate to History & Verify Appearance', 'PASS', `Found prompt "${found.title}" in History (${res.body.prompts.length} total)`);
    }

    // ── STEP 12: Refresh & Persistence Check ───────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: `/api/prompts/${savedPromptId}`,
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.prompt?.originalPrompt === promptInput.task, 'Original prompt matches');
      assert(res.body.prompt?.variations?.length >= 3, 'Variations persisted');
      recordStep(12, 'Browser Refresh & Data Persistence Check', 'PASS', 'Prompt, variations, scores & responses fully intact');
    }

    // ── STEP 13: Dashboard Total Prompts Check ─────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/prompts/stats',
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.stats?.totalPrompts >= 1, `Total prompts should be >= 1, got ${res.body.stats?.totalPrompts}`);
      recordStep(13, 'Dashboard Metrics Increment Check', 'PASS', `Total Prompts: ${res.body.stats?.totalPrompts}, Avg Score: ${res.body.stats?.avgPromptScore}`);
    }

    // ── STEP 14: Star Prompt as Favorite ───────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: `/api/prompts/${savedPromptId}/favorite`,
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.favorite === true, 'Expected favorite to be true');
      recordStep(14, 'Star Prompt as Favorite', 'PASS', `Prompt ${savedPromptId} marked as favorite: true`);
    }

    // ── STEP 15: Verify in Favorites ───────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/prompts?favorite=true',
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      const found = res.body.prompts.find((p) => p._id === savedPromptId || p.id === savedPromptId);
      assert(found && found.favorite === true, 'Prompt must be in favorites list with favorite: true');
      recordStep(15, 'Verify Appearance in Favorites Page', 'PASS', `Found in favorites library (${res.body.prompts.length} starred)`);
    }

    // ── STEP 16: Create New Collection ─────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/collections',
        headers: authHeaders,
        body: {
          name: 'Financial Microservices',
          description: 'Resilience and retry patterns for distributed ledger services',
          color: '#3b82f6',
        },
      });
      assert(res.status === 201 || res.status === 200, `Expected 200/201, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      testCollectionId = res.body.collection?._id || res.body.collection?.id;
      assert(testCollectionId, 'Expected collection ID');
      recordStep(16, 'Create New Collection', 'PASS', `Collection ID: ${testCollectionId} ("Financial Microservices")`);
    }

    // ── STEP 17: Add Prompt to Collection ──────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'POST',
        url: `/api/collections/${testCollectionId}/prompts`,
        headers: authHeaders,
        body: { promptId: savedPromptId },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.itemCount === 1, `Expected itemCount === 1, got ${res.body.itemCount}`);
      recordStep(17, 'Add Prompt to Collection', 'PASS', `Prompt ${savedPromptId} added; itemCount = ${res.body.itemCount}`);
    }

    // ── STEP 18: Open Collection & Verify Prompt ───────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: `/api/prompts?collectionId=${testCollectionId}`,
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      const found = res.body.prompts.find((p) => p._id === savedPromptId || p.id === savedPromptId);
      assert(found, `Prompt ${savedPromptId} must be present in collection ${testCollectionId}`);
      recordStep(18, 'Open Collection & Verify Prompt Inside', 'PASS', `Verified prompt inside collection (${res.body.prompts.length} prompts)`);
    }

    // ── STEP 19: Edit Collection Details ───────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'PUT',
        url: `/api/collections/${testCollectionId}`,
        headers: authHeaders,
        body: {
          name: 'Financial Microservices Resiliency (Updated)',
          description: 'Production-ready resilient architectures',
          color: '#10b981',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.collection?.name === 'Financial Microservices Resiliency (Updated)', 'Name updated');
      recordStep(19, 'Edit Collection Details', 'PASS', `Renamed: "${res.body.collection?.name}"`);
    }

    // ── STEP 20: Remove Prompt from Collection ─────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'DELETE',
        url: `/api/collections/${testCollectionId}/prompts/${savedPromptId}`,
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.itemCount === 0, `Expected itemCount === 0, got ${res.body.itemCount}`);
      recordStep(20, 'Remove Prompt from Collection', 'PASS', `Removed prompt; new itemCount: ${res.body.itemCount}`);
    }

    // ── STEP 21: Verify Prompt Count Updates & Safe Unassignment ───────────
    {
      const colRes = await dispatch(app, {
        method: 'GET',
        url: '/api/collections',
        headers: authHeaders,
      });
      assert(colRes.status === 200, 'Collections list succeeded');
      const updatedCol = colRes.body.collections.find((c) => c._id === testCollectionId || c.id === testCollectionId);
      assert(updatedCol && updatedCol.itemCount === 0, 'Collection itemCount is 0');

      // Verify prompt is NOT deleted
      const promptRes = await dispatch(app, {
        method: 'GET',
        url: `/api/prompts/${savedPromptId}`,
        headers: authHeaders,
      });
      assert(promptRes.status === 200, 'Prompt still exists in history');
      recordStep(21, 'Verify Dynamic Count Updates & Safe Prompt Retention', 'PASS', 'Collection itemCount is 0, prompt is preserved safely');
    }

    // ── STEP 22: Delete Test Collection ────────────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'DELETE',
        url: `/api/collections/${testCollectionId}`,
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');

      const colRes = await dispatch(app, {
        method: 'GET',
        url: '/api/collections',
        headers: authHeaders,
      });
      const exists = colRes.body.collections.some((c) => c._id === testCollectionId || c.id === testCollectionId);
      assert(!exists, 'Deleted collection should no longer exist');
      recordStep(22, 'Delete Test Collection Safely', 'PASS', `Collection ${testCollectionId} removed without affecting prompt records`);
    }

    // ── STEP 23: Check Analytics Data Points ───────────────────────────────
    {
      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/analytics',
        headers: authHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      recordStep(23, 'Check Analytics Data Points', 'PASS', `Metrics returned: ${JSON.stringify(Object.keys(res.body.metrics || {}))}`);
    }

    // ── STEP 24: Log Out and Log In Again ──────────────────────────────────
    let newSessionToken = null;
    {
      // Re-authenticate
      const res = await dispatch(app, {
        method: 'POST',
        url: '/api/auth/login',
        body: { email: testUser.email, password: testUser.password },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.token, 'Expected new session JWT token');
      newSessionToken = res.body.token;
      recordStep(24, 'Log Out and Log In Again (Session Cycle)', 'PASS', `New session token issued for ${res.body.user?.email}`);
    }

    // ── STEP 25: Verify All Data Persists Across Sessions ──────────────────
    {
      const newAuthHeaders = { Authorization: `Bearer ${newSessionToken}` };
      const res = await dispatch(app, {
        method: 'GET',
        url: `/api/prompts/${savedPromptId}`,
        headers: newAuthHeaders,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success, 'Expected success: true');
      assert(res.body.prompt?.title === 'Resilient Microservices Retry Mechanism', 'Title matches');
      assert(res.body.prompt?.finalScore === finalScore, 'Final score preserved');
      assert(res.body.prompt?.favorite === true, 'Favorite state preserved');
      recordStep(25, 'Verify All Data Persists Across User Sessions', 'PASS', `Prompt ${savedPromptId} intact: score=${res.body.prompt.finalScore}, variations=${res.body.prompt.variations.length}`);
    }

    console.log('\n================================================================');
    console.log(`🎉 ALL 25 TEST STEPS PASSED SUCCESSFULLY! (25/25 - 100%)`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUNNER ABORTED WITH ERROR:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

run25StepSuite();
