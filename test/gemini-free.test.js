'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readiness, runGeminiFreeDebate, FREE_MODEL } = require('../lib/gemini-free-debate');
test('Gemini free role debate fails closed with no provider calls by default', async () => {
  const a = process.env.GEMINI_FREE_DEBATE_ENABLED, b = process.env.GEMINI_FREE_MODEL_VERIFIED;
  try {
    delete process.env.GEMINI_FREE_DEBATE_ENABLED;
    delete process.env.GEMINI_FREE_MODEL_VERIFIED;
    let calls = 0;
    await assert.rejects(runGeminiFreeDebate('Research topic', async () => { calls++; }), {code:'FREE_DEBATE_DISABLED'});
    assert.equal(calls, 0);
    assert.equal(readiness().gptEnabled, false);
    assert.equal(readiness().museEnabled, false);
    assert.equal(readiness().model, FREE_MODEL);
  } finally {
    if (a === undefined) delete process.env.GEMINI_FREE_DEBATE_ENABLED;
    else process.env.GEMINI_FREE_DEBATE_ENABLED = a;
    if (b === undefined) delete process.env.GEMINI_FREE_MODEL_VERIFIED;
    else process.env.GEMINI_FREE_MODEL_VERIFIED = b;
  }
});
