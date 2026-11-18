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
  assert.deepEqual(calls.map(c => c.provider), ['gpt','gemini','gpt','gemini']);
  assert.match(calls[2].prompt, /Gemini mock analysis/);
  assert.match(calls[3].prompt, /GPT mock analysis/);
  assert.ok(calls.every(c => c.prompt.length <= 4000));
  assert.equal(result.providerCalls, 4);
  assert.equal(result.verified, false);
  assert.equal(result.wageringEnabled, false);
});
test('public live entry point remains blocked before transport', async () => {
  await assert.rejects(runTwoModelCouncil('Evaluate a game'), { code: 'LIVE_AI_DISABLED' });
});
