const http = require('http');
const app = require('./src/server');

let server;
let port;
let baseUrl;

// Helper to make HTTP requests
const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AI PROMPT STUDIO TEST SUITE');
  console.log('====================================================\n');

  // Start test server on ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Listening on ${baseUrl}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Health Check
    // -------------------------------------------------------------------------
    console.log('\n[Module 1] System Health & Service Status');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Health check returns 200');
    assert(healthRes.body.status === 'online', 'Health status is online');
    assert(healthRes.body.service === 'AI Prompt Studio Backend', 'Service name is verified');

    // -------------------------------------------------------------------------
    // TEST 2: Authentication (Login, Register, RBAC, Profile, Password)
    // -------------------------------------------------------------------------
    console.log('\n[Module 2] Authentication & User Management (JWT + RBAC)');

    // 2.1 Demo User Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'demo@example.com',
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'Login with demo user succeeds');
    const userToken = loginRes.body.token;
    assert(loginRes.body.user.email === 'demo@example.com', 'Demo user email matches');

    // 2.2 Admin Login
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.token, 'Login with admin user succeeds');
    const adminToken = adminLoginRes.body.token;
    assert(adminLoginRes.body.user.role === 'admin', 'Admin user role is "admin"');

    // 2.3 Registration of a new user
    const testEmail = `student_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
    });
    assert(regRes.status === 201 && regRes.body.token, 'Register new user succeeds with token');
    const newStudentToken = regRes.body.token;

    // 2.4 Profile Read (`/api/auth/me`)
    const meRes = await request('GET', '/api/auth/me', null, newStudentToken);
    assert(meRes.status === 200 && meRes.body.user.email === testEmail, 'GET /api/auth/me returns current user');

    // 2.5 Profile Update (`/api/auth/profile`)
    const updateProfRes = await request(
      'PUT',
      '/api/auth/profile',
      { name: 'Updated Student Name' },
      newStudentToken
    );
    assert(updateProfRes.status === 200 && updateProfRes.body.user.name === 'Updated Student Name', 'PUT /api/auth/profile updates user name');

    // 2.6 Password Update (`/api/auth/password`)
    const updatePassRes = await request(
      'PUT',
      '/api/auth/password',
      { currentPassword: 'password123', newPassword: 'newSecretPassword456' },
      newStudentToken
    );
    assert(updatePassRes.status === 200 && updatePassRes.body.success, 'PUT /api/auth/password updates password');

    // 2.7 Verify login with updated password
    const reLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'newSecretPassword456',
    });
    assert(reLoginRes.status === 200, 'Login with new password succeeds');

    // -------------------------------------------------------------------------
    // TEST 3: Prompt Quality Heuristics (`/api/prompts/analyze`)
    // -------------------------------------------------------------------------
    console.log('\n[Module 3] Prompt Quality Heuristic Evaluator (5 Dimensions)');
    const analyzeRes = await request('POST', '/api/prompts/analyze', {
      prompt: 'Explain quantum computing in simple terms for high school students. Include 3 bullet points.',
      task: 'Explain quantum computing',
      context: 'High school physics students',
      desiredOutputFormat: 'Bulleted summary',
      tone: 'Encouraging',
      targetAudience: 'Beginners',
    });
    assert(analyzeRes.status === 200 && analyzeRes.body.success, 'Prompt analysis returns 200');
    const scores = analyzeRes.body.scores;
    assert(
      scores.clarity > 0 &&
        scores.specificity > 0 &&
        scores.context > 0 &&
        scores.completeness > 0 &&
        scores.structure > 0,
      'Evaluates all 5 dimensions (Clarity, Specificity, Context, Completeness, Structure)'
    );
    assert(scores.overall > 50, `Calculates overall heuristic score: ${scores.overall}/100`);
    assert(Array.isArray(scores.suggestions), 'Provides actionable improvement suggestions');

    // -------------------------------------------------------------------------
    // TEST 4: Prompt Optimization & Variations (`/api/prompts/optimize`)
    // -------------------------------------------------------------------------
    console.log('\n[Module 4] Prompt Optimization & 5 Techniques');
    const optRes = await request('POST', '/api/prompts/optimize', {
      prompt: 'Write a Python function to sort numbers',
      task: 'Array sorting function',
      context: 'Clean code',
      desiredOutputFormat: 'Code block',
      tone: 'Technical',
      targetAudience: 'Developers',
    });
    assert(optRes.status === 200 && optRes.body.success, 'Prompt optimization returns 200');
    assert(optRes.body.variations.length === 5, 'Generates exactly 5 prompt variations');
    const techniques = optRes.body.variations.map((v) => v.technique);
    assert(
      techniques.includes('Clear & Concise') &&
        techniques.includes('Detailed') &&
        techniques.includes('Role-Based') &&
        techniques.includes('Step-by-Step') &&
        techniques.includes('Structured'),
      'Contains all 5 engineered prompting techniques'
    );

    // -------------------------------------------------------------------------
    // TEST 5: AI Response Generation (`/api/prompts/generate`)
    // -------------------------------------------------------------------------
    console.log('\n[Module 5] AI Response Generation & Heuristic Evaluation');
    const genRes = await request('POST', '/api/prompts/generate', {
      promptText: 'Explain the difference between SQL and NoSQL in 2 short bullet points.',
    });
    assert(genRes.status === 200 && genRes.body.success, 'Generate AI response returns 200');
    assert(genRes.body.result.responseText.length > 10, 'Response text received');
    assert(genRes.body.result.scores && genRes.body.result.scores.overall > 0, 'Response evaluation scores computed');

    // -------------------------------------------------------------------------
    // TEST 6: Response Quality Evaluation (`/api/prompts/evaluate`)
    // -------------------------------------------------------------------------
    console.log('\n[Module 6] Response Evaluation Across 5 Categories');
    const evalRes = await request('POST', '/api/prompts/evaluate', {
      promptText: 'List 3 benefits of cloud computing.',
      responseText: '- Scalability: Adjust resources dynamically.\n- Cost-effectiveness: Pay for what you use.\n- High Availability: Redundancy across zones.',
    });
    assert(evalRes.status === 200, 'Evaluate response returns 200');
    const rScores = evalRes.body.scores;
    assert(
      rScores.relevance > 0 &&
        rScores.completeness > 0 &&
        rScores.clarity > 0 &&
        rScores.structure > 0 &&
        rScores.instructionFollowing > 0,
      'Evaluates all 5 response dimensions (Relevance, Completeness, Clarity, Structure, Instruction Following)'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Comparison & Best Prompt Recommendation (`/api/prompts/compare`)
    // -------------------------------------------------------------------------
    console.log('\n[Module 7] Comparison & Weighted Ranking Engine');
    const compareRes = await request('POST', '/api/prompts/compare', {
      items: [
        {
          technique: 'Clear & Concise',
          promptText: 'Explain recursion in Python succinctly.',
          responseText: 'Recursion is when a function calls itself until reaching a base condition.',
        },
        {
          technique: 'Role-Based',
          promptText: 'Act as a Senior Python Engineer. Explain recursion with a practical factorial code example.',
          responseText: 'As a Python Engineer: recursion solves problems by breaking them into smaller self-similar tasks.\n```python\ndef fact(n):\n    return 1 if n <= 1 else n * fact(n-1)\n```',
        },
      ],
    });
    assert(compareRes.status === 200 && compareRes.body.comparison, 'Prompt comparison returns 200');
    const rec = compareRes.body.comparison.recommendedPrompt;
    assert(rec && rec.technique && rec.finalScore > 0, `Recommends best prompt: "${rec.technique}" with score ${rec.finalScore}`);
    assert(Array.isArray(rec.rationale) && rec.rationale.length > 0, 'Includes transparent rationale statements');

    // -------------------------------------------------------------------------
    // TEST 8: Prompt CRUD, Favorites, Versioning & Search
    // -------------------------------------------------------------------------
    console.log('\n[Module 8] Prompt History, CRUD, Favorites & Versioning');

    // 8.1 Create & Save Prompt
    const createPromptRes = await request(
      'POST',
      '/api/prompts',
      {
        title: 'Quantum Physics Intro',
        originalPrompt: 'Explain quantum entanglement simply.',
        task: 'Physics explanation',
        context: 'High school level',
        technique: 'Role-Based',
        promptScores: { overall: 85, clarity: 18, specificity: 16, context: 17, completeness: 17, structure: 17 },
        finalScore: 88,
        favorite: true,
      },
      userToken
    );
    assert(createPromptRes.status === 201 && createPromptRes.body.prompt, 'Create prompt returns 201');
    const createdPromptId = createPromptRes.body.prompt._id;

    // 8.2 Get Prompts List (History)
    const listRes = await request('GET', '/api/prompts', null, userToken);
    assert(listRes.status === 200 && Array.isArray(listRes.body.prompts), 'Get prompts returns user prompts list');
    const foundCreated = listRes.body.prompts.find((p) => String(p._id) === String(createdPromptId));
    assert(!!foundCreated, 'Newly created prompt is present in user history');

    // 8.3 Search Prompts
    const searchRes = await request('GET', '/api/prompts?search=entanglement', null, userToken);
    assert(searchRes.status === 200 && searchRes.body.prompts.length > 0, 'Search prompt by keyword returns match');

    // 8.4 Toggle Favorite
    const favRes = await request('POST', `/api/prompts/${createdPromptId}/favorite`, null, userToken);
    assert(favRes.status === 200 && typeof favRes.body.favorite === 'boolean', 'Toggle favorite switches status');

    // 8.5 Update Prompt with Versioning
    const updateRes = await request(
      'PUT',
      `/api/prompts/${createdPromptId}`,
      { originalPrompt: 'Explain quantum entanglement in 3 detailed steps.', changeSummary: 'Refined prompt steps' },
      userToken
    );
    assert(updateRes.status === 200, 'Update prompt returns 200');
    assert(updateRes.body.prompt.version === 2, 'Increments prompt version to v2 on content edit');

    // 8.6 Get Prompt by ID with Versions
    const byIdRes = await request('GET', `/api/prompts/${createdPromptId}`, null, userToken);
    assert(byIdRes.status === 200 && byIdRes.body.prompt, 'Get prompt by ID returns prompt metadata');

    // 8.7 Delete Prompt
    const delRes = await request('DELETE', `/api/prompts/${createdPromptId}`, null, userToken);
    assert(delRes.status === 200 && delRes.body.success, 'Delete prompt removes record successfully');

    // -------------------------------------------------------------------------
    // TEST 9: Collections Management
    // -------------------------------------------------------------------------
    console.log('\n[Module 9] Collections Management (Create, List, Update, Delete)');

    // 9.1 Create Collection
    const createColRes = await request(
      'POST',
      '/api/collections',
      { name: 'Autonomous Agents', description: 'Prompts for agentic systems', color: '#06b6d4' },
      userToken
    );
    assert(createColRes.status === 201 && createColRes.body.collection, 'Create collection returns 201');
    const createdColId = createColRes.body.collection._id;

    // 9.2 Get Collections with counts
    const getColsRes = await request('GET', '/api/collections', null, userToken);
    assert(getColsRes.status === 200 && getColsRes.body.collections.length > 0, 'Get collections returns array');
    const foundCol = getColsRes.body.collections.find((c) => String(c._id) === String(createdColId));
    assert(foundCol && foundCol.name === 'Autonomous Agents', 'Created collection present in list');

    // 9.3 Update Collection
    const updateColRes = await request(
      'PUT',
      `/api/collections/${createdColId}`,
      { name: 'Autonomous AI Agents (Updated)', color: '#ec4899' },
      userToken
    );
    assert(
      updateColRes.status === 200 && updateColRes.body.collection.name === 'Autonomous AI Agents (Updated)',
      'Update collection updates name and color'
    );

    // 9.4 Delete Collection
    const delColRes = await request('DELETE', `/api/collections/${createdColId}`, null, userToken);
    assert(delColRes.status === 200 && delColRes.body.success, 'Delete collection succeeds');

    // -------------------------------------------------------------------------
    // TEST 10: Dynamic Analytics Engine
    // -------------------------------------------------------------------------
    console.log('\n[Module 10] Analytics Engine (Dynamic Metrics & Charts)');
    const analyticsRes = await request('GET', '/api/analytics', null, userToken);
    assert(analyticsRes.status === 200 && analyticsRes.body.success, 'GET /api/analytics returns 200');
    assert(analyticsRes.body.metrics.totalPrompts >= 0, `Total prompts computed dynamically: ${analyticsRes.body.metrics.totalPrompts}`);
    assert(Array.isArray(analyticsRes.body.charts.promptsOverTime), 'promptsOverTime chart dataset generated');
    assert(Array.isArray(analyticsRes.body.charts.techniqueBreakdown), 'techniqueBreakdown chart dataset generated');

    // -------------------------------------------------------------------------
    // TEST 11: Admin Control Panel & Role-Based Access Control
    // -------------------------------------------------------------------------
    console.log('\n[Module 11] Admin Control Panel & Role-Based Security');

    // 11.1 Unauthorized Non-Admin Access Check
    const forbiddenRes = await request('GET', '/api/admin/stats', null, userToken);
    assert(forbiddenRes.status === 403, 'Non-admin user receives 403 Forbidden on /api/admin/stats');

    // 11.2 Admin Stats
    const adminStatsRes = await request('GET', '/api/admin/stats', null, adminToken);
    assert(adminStatsRes.status === 200 && adminStatsRes.body.stats, 'Admin receives 200 and system stats');
    assert(adminStatsRes.body.stats.totalUsers > 0, `Admin stats totalUsers: ${adminStatsRes.body.stats.totalUsers}`);
    assert(Array.isArray(adminStatsRes.body.recentActivities), 'Admin receives recent audit activity logs');

    // 11.3 Admin User List
    const adminUsersRes = await request('GET', '/api/admin/users', null, adminToken);
    assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.body.users), 'Admin receives list of registered users');

    // 11.4 Admin Delete User (Delete the test student)
    const delUserTarget = adminUsersRes.body.users.find((u) => u.email === testEmail);
    if (delUserTarget) {
      const delUserRes = await request('DELETE', `/api/admin/users/${delUserTarget._id}`, null, adminToken);
      assert(delUserRes.status === 200 && delUserRes.body.success, 'Admin can delete non-admin user account');
    }

    // 11.5 Prevent Admin from Deleting Self
    const meAdminRes = await request('GET', '/api/auth/me', null, adminToken);
    const selfDelRes = await request('DELETE', `/api/admin/users/${meAdminRes.body.user.id || meAdminRes.body.user._id}`, null, adminToken);
    assert(selfDelRes.status === 400, 'Admin is prevented from deleting their own account');
  } catch (error) {
    console.error('Fatal test execution error:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();

