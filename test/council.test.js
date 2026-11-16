'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCouncilPlan, validateQuestion, normalizeResponses } = require('../lib/council-engine');
const handler = require('../api/council/run');

function request(body, method = 'POST') {
  const result = { statusCode: 200, headers: {} };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    status(n) { result.statusCode = n; return this; },
    json(value) { result.body = value; return this; }
  };
  handler({ method, body }, res);
  return result;
}

test('rejects empty and oversized questions', () => {
  assert.equal(validateQuestion(' '), false);
  assert.equal(validateQuestion('x'.repeat(4001)), false);
  assert.equal(request({ question: '' }).statusCode, 400);
});
test('offline plan never calls a provider', () => {
  const plan = buildCouncilPlan('Analyze matchup');
  assert.equal(plan.providersCalled, 0);
  assert.equal(plan.spendLimitUsd, 0);
  assert.equal(plan.challengePrompt, null);
  assert.equal(plan.missing.length, 3);
});
test('challenge requires two pasted responses and preserves attribution', () => {
  const plan = buildCouncilPlan('Analyze matchup', { GPT: 'A', Gemini: 'B' });
  assert.equal(plan.readyForChallenge, true);
  assert.match(plan.challengePrompt, /GPT:/);
  assert.match(plan.challengePrompt, /Gemini:/);
  assert.deepEqual(plan.missing, ['Muse']);
});
test('unrecognized response keys ignored and inputs bounded', () => {
  const values = normalizeResponses({ GPT: 'x'.repeat(13000), Unknown: 'ignore' });
  assert.equal(values.GPT.length, 12000);
  assert.equal(Object.hasOwn(values, 'Unknown'), false);
});
test('API rejects live requests even with valid question', () => {
  const result = request({ question: 'NBA' });
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.providersCalled, 0);
});
test('API accepts explicit manual mode without network', () => {
  const result = request({ mode: 'manual', question: 'NBA', responses: { GPT: 'analysis' } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.providersCalled, 0);
  assert.equal(result.body.liveEnabled, false);
});
test('API rejects non-POST methods', () => assert.equal(request({}, 'GET').statusCode, 405));
