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

const statusHandler = require('../api/council/status');
function statusRequest(method = 'GET') {
  const result = { statusCode: 200, headers: {} };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    status(n) { result.statusCode = n; return this; },
    json(value) { result.body = value; return this; }
  };
  statusHandler({ method }, res);
  return result;
}
test('status endpoint remains fail-closed and reveals no credentials', () => {
  const result = statusRequest();
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.liveEnabled, false);
  assert.equal(result.body.spendLimitUsd, 0);
  assert.ok(result.body.providers.every(provider => provider.available === false));
  assert.equal(JSON.stringify(result.body).includes('apiKey'), false);
});
test('status endpoint rejects non-GET methods', () => {
  assert.equal(statusRequest('POST').statusCode, 405);
});
test('manual API rejects oversized input before provider calls', () => {
  const result = request({ mode: 'manual', question: 'x'.repeat(4001) });
  assert.equal(result.statusCode, 400);
});

const { evaluateLiveAccess, assertLiveAccess } = require('../lib/live-access-policy');
test('live access policy refuses all providers and spending', () => {
  const policy = evaluateLiveAccess();
  assert.equal(policy.allowed, false);
  assert.equal(policy.spendLimitUsd, 0);
  assert.equal(policy.providerCallsAllowed, 0);
  assert.ok(policy.providers.every(p => p.enabled === false));
  assert.throws(assertLiveAccess, { code: 'LIVE_AI_DISABLED' });
});

const { getPublicProviderStatus } = require('../lib/provider-registry');
test('provider registry exposes only disabled public metadata', () => {
  const providers = getPublicProviderStatus();
  assert.deepEqual(providers.map(p => p.name), ['GPT', 'Gemini', 'Muse']);
  assert.ok(providers.every(p => !p.available && !p.authenticated && !p.liveEnabled && !p.freeTierVerified));
  assert.ok(providers.every(p => !Object.keys(p).some(k => /secret|token|key/i.test(k))));
});
test('status endpoint reflects provider registry', () => {
  assert.deepEqual(statusRequest().body.providers, getPublicProviderStatus());
});

const { validateProviderConfiguration } = require('../lib/provider-config');
test('provider config accepts offline mode without credentials', () => {
  const result = validateProviderConfiguration({});
  assert.equal(result.validForOfflineMode, true);
  assert.equal(result.liveEnabled, false);
  assert.equal(result.spendLimitUsd, 0);
});
test('provider config rejects live, paid fallback, and wagering flags', () => {
  const result = validateProviderConfiguration({
    ENABLE_LIVE_AI: 'true', ALLOW_PAID_FALLBACK: '1', ENABLE_AUTO_WAGER: 'true',
    OPENAI_API_KEY: 'sensitive-secret'
  });
  assert.equal(result.validForOfflineMode, false);
  assert.equal(result.errors.length, 3);
  assert.equal(JSON.stringify(result).includes('sensitive-secret'), false);
});

const { getAdapters, createDisabledAdapter } = require('../lib/provider-adapters');
test('provider adapters are disabled and use known IDs only', () => {
  const adapters = getAdapters();
  assert.deepEqual(Object.keys(adapters), ['gpt', 'gemini', 'muse']);
  assert.ok(Object.values(adapters).every(adapter => adapter.enabled === false));
  assert.throws(() => createDisabledAdapter('unknown'), /unsupported_provider/);
});
test('disabled provider adapter refuses generate before network access', async () => {
  await assert.rejects(getAdapters().gpt.generate('hello'), { code: 'LIVE_AI_DISABLED' });
});

test('all three adapters refuse requests even when called concurrently', async () => {
  const adapters = Object.values(getAdapters());
  const outcomes = await Promise.allSettled(adapters.map(adapter => adapter.generate('test')));
  assert.equal(outcomes.length, 3);
  assert.ok(outcomes.every(outcome => outcome.status === 'rejected' && outcome.reason.code === 'LIVE_AI_DISABLED'));
});
test('provider configuration never accepts live activation flags', () => {
  for (const flag of ['ENABLE_LIVE_AI', 'ALLOW_PAID_FALLBACK', 'ENABLE_AUTO_WAGER']) {
    const result = validateProviderConfiguration({ [flag]: 'true' });
    assert.equal(result.validForOfflineMode, false);
    assert.equal(result.liveEnabled, false);
  }
});

test('manual council endpoint returns cross-examination when two responses are supplied', () => {
  const result = request({
    mode: 'manual', question: 'Compare these NBA matchup assessments',
    responses: { GPT: 'Team A injury report needs verification', Gemini: 'Team B odds need a timestamp' }
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.readyForChallenge, true);
  assert.deepEqual(result.body.available, ['GPT', 'Gemini']);
  assert.match(result.body.challengePrompt, /Team A injury report/);
  assert.match(result.body.challengePrompt, /Team B odds/);
  assert.equal(result.body.verified, false);
  assert.equal(result.body.providersCalled, 0);
});
test('manual council endpoint never accepts a claimed live mode', () => {
  const result = request({
    mode: 'live', question: 'Evaluate sports odds',
    responses: { GPT: 'fake', Gemini: 'fake' }
  });
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.error, 'live_ai_disabled');
  assert.equal(result.body.spendLimitUsd, 0);
});
