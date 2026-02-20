const http = require('http');

async function testEndpoint(path, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Security Smoke Tests...');
  
  try {
    // Test 1: Missing Key (assuming GEMINI_API_KEY is not set in this shell env for the test)
    console.log('Test 1: Missing Key Handling...');
    const chatRes = await testEndpoint('/api/ai/chat', { message: 'Hello' });
    console.log('Result:', chatRes.ok === false && chatRes.code === 'UPSTREAM_MISSING_KEY' ? '✅ PASS' : '❌ FAIL', chatRes);

    // Test 2: Payload Size Limit
    console.log('Test 2: Payload Size Limit...');
    const largePayload = { message: 'a'.repeat(35000) };
    const largeRes = await testEndpoint('/api/ai/chat', largePayload);
    console.log('Result:', largeRes.ok === false && largeRes.code === 'PAYLOAD_TOO_LARGE' ? '✅ PASS' : '❌ FAIL', largeRes);

    // Test 3: Rank Schema Validation (Invalid Input)
    console.log('Test 3: Rank Input Validation...');
    const rankRes = await testEndpoint('/api/ai/rank', { query: '', itemsMini: [] });
    console.log('Result:', rankRes.ok === false ? '✅ PASS' : '❌ FAIL', rankRes);

  } catch (e) {
    console.error('Test Execution Failed (Is server running?):', e.message);
  }
}

runTests();
