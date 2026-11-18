'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { orchestrateCouncil, runTwoModelCouncil } = require('../lib/two-model-council');
test('two models independently research and challenge each other with zero network calls', async () => {
  const calls = [];
  const generate = async (provider, prompt) => {
    calls.push({ provider, prompt });
    return provider === 'gpt' ? 'GPT mock analysis: roster not verified.' : 'Gemini mock analysis: market timestamp missing.';
  };
  const result = await orchestrateCouncil('Evaluate a game', generate);
  assert.deepEqual(calls.map(c => c.provider), ['gpt','gemini','gpt','gemini','gpt','gemini','gpt','gemini']);
  assert.match(calls[2].prompt, /Gemini mock analysis/);
  assert.match(calls[3].prompt, /GPT mock analysis/);
  assert.ok(calls.every(c => c.prompt.length <= 4000));
  assert.match(calls[4].prompt, /Gemini mock analysis/);
  assert.match(calls[5].prompt, /GPT mock analysis/);
  assert.match(calls[6].prompt, /Gemini mock analysis/);
  assert.match(calls[7].prompt, /GPT mock analysis/);
  assert.ok(result.rebuttals.gpt);
  assert.ok(result.finalPositions.gemini);
  assert.equal(result.providerCalls, 8);
  assert.equal(result.verified, false);
  assert.equal(result.wageringEnabled, false);
});
test('public live entry point remains blocked before transport', async () => {
  await assert.rejects(runTwoModelCouncil('Evaluate a game'), { code: 'LIVE_AI_DISABLED' });
});

test('even configured credentials cannot trigger paid model requests while access is blocked', async () => {
  const { generateProviderResponse } = require('../lib/live-provider-transport');
  const previousFetch = global.fetch;
  const previousOpenAI = process.env.OPENAI_API_KEY;
  const previousGemini = process.env.GEMINI_API_KEY;
  let requests = 0;
  try {
    process.env.OPENAI_API_KEY = 'dummy-test-key';
    process.env.GEMINI_API_KEY = 'dummy-test-key';
    global.fetch = async () => { requests++; throw new Error('unexpected_network_request'); };
    for (const provider of ['gpt', 'gemini']) {
      await assert.rejects(generateProviderResponse(provider, 'Test prompt'), { code: 'LIVE_AI_DISABLED' });
    }
    assert.equal(requests, 0);
  } finally {
    global.fetch = previousFetch;
    if (previousOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAI;
    if (previousGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGemini;
  }
});
