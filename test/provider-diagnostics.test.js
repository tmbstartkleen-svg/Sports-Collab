'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/council/provider-diagnostics');
function response() {
  return { headers: {}, statusCode: 200, body: null,
    setHeader(k,v) { this.headers[k]=v; },
    status(n) { this.statusCode=n; return this; },
    json(data) { this.body=data; return this; } };
}
test('diagnostics deny unauthenticated access with zero provider calls', async () => {
  const previous = process.env.PROVIDER_DIAGNOSTICS_ENABLED;
  const previousToken = process.env.COUNCIL_DIAGNOSTIC_TOKEN;
  const oldFetch = global.fetch;
  let calls = 0;
  try {
    process.env.PROVIDER_DIAGNOSTICS_ENABLED='true';
    process.env.COUNCIL_DIAGNOSTIC_TOKEN='a'.repeat(40);
    global.fetch=async () => { calls++; throw new Error('unexpected network call'); };
    const res=response();
    await handler({ method:'GET', headers:{ 'x-council-diagnostic-token':'incorrect' } },res);
    assert.equal(res.statusCode,403);
    assert.equal(res.body.providerCalls,0);
    assert.equal(calls,0);
  } finally {
    global.fetch=oldFetch;
    if (previous===undefined) delete process.env.PROVIDER_DIAGNOSTICS_ENABLED;
    else process.env.PROVIDER_DIAGNOSTICS_ENABLED=previous;
    if (previousToken===undefined) delete process.env.COUNCIL_DIAGNOSTIC_TOKEN;
    else process.env.COUNCIL_DIAGNOSTIC_TOKEN=previousToken;
  }
});
test('mock credential probes use GET and do not expose keys', async () => {
  const previous=process.env.OPENAI_API_KEY;
  try {
    process.env.OPENAI_API_KEY='fake-test-only-key';
    const { checkProvider }=handler;
    let called=0;
    const result=await checkProvider('gpt', async (url, options) => {
      called++;
      assert.equal(options.method,'GET');
      assert.match(url,/\/models$/);
      return { ok:true, status:200 };
    });
    assert.equal(called,1);
    assert.equal(result.authenticated,true);
    assert.equal(JSON.stringify(result).includes('fake-test-only-key'),false);
  } finally {
    if (previous===undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY=previous;
  }
});

test('diagnostics reject unsupported methods before checking credentials', async () => {
  const res=response();
  await handler({ method:'POST', headers:{} },res);
  assert.equal(res.statusCode,405);
  assert.equal(res.body.error,'method_not_allowed');
});
test('Gemini diagnostic uses GET with API key header and redacts credentials', async () => {
  const previous=process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY='fake-gemini-test-key';
    let calls=0;
    const result=await handler.checkProvider('gemini',async (url,options) => {
      calls++;
      assert.equal(options.method,'GET');
      assert.match(url,/generativelanguage.googleapis.com\/v1beta\/models/);
      assert.equal(options.headers['x-goog-api-key'],'fake-gemini-test-key');
      return {ok:false,status:403};
    });
    assert.equal(calls,1);
    assert.equal(result.authenticated,false);
    assert.equal(result.result,'authentication_rejected');
    assert.equal(JSON.stringify(result).includes('fake-gemini-test-key'),false);
  } finally {
    if (previous===undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY=previous;
  }
});
