'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCouncilPlan, validateQuestion, normalizeResponses } = require('../lib/council-engine');
const handler = require('../api/council/run');

async function request(body, method = 'POST') {
  const result = { statusCode: 200, headers: {} };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    status(n) { result.statusCode = n; return this; },
    json(value) { result.body = value; return this; }
  };
  await handler({ method, body }, res);
  return result;
}

test('rejects empty and oversized questions', async () => {
  assert.equal(validateQuestion(' '), false);
  assert.equal(validateQuestion('x'.repeat(4001)), false);
  assert.equal((await request({ question: '' })).statusCode, 400);
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
test('API rejects live requests even with valid question', async () => {
  const result = await request({ question: 'NBA' });
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.providersCalled, 0);
});
test('API accepts explicit manual mode without network', async () => {
  const result = await request({ mode: 'manual', question: 'NBA', responses: { GPT: 'analysis' } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.providersCalled, 0);
  assert.equal(result.body.liveEnabled, false);
});
test('API rejects non-POST methods', async () => assert.equal((await request({}, 'GET')).statusCode, 405));

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
test('manual API rejects oversized input before provider calls', async () => {
  const result = await request({ mode: 'manual', question: 'x'.repeat(4001) });
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

test('manual council endpoint returns cross-examination when two responses are supplied', async () => {
  const result = await request({
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
test('manual council endpoint never accepts a claimed live mode', async () => {
  const result = await request({
    mode: 'live', question: 'Evaluate sports odds',
    responses: { GPT: 'fake', Gemini: 'fake' }
  });
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.error, 'live_ai_disabled');
  assert.equal(result.body.spendLimitUsd, 0);
});

const { coordinateCouncil } = require('../lib/council-coordinator');
test('coordinator assembles manual exchanges without calling providers', async () => {
  const result = await coordinateCouncil({
    question: 'Analyze a matchup', mode: 'manual',
    responses: { GPT: 'Injury uncertainty', Gemini: 'Odds need checking' }
  });
  assert.equal(result.readyForChallenge, true);
  assert.equal(result.providersCalled, 0);
  assert.equal(result.communication, 'manual_exchange_only');
  assert.deepEqual(result.providerIds, ['gpt', 'gemini', 'muse']);
});
test('coordinator refuses all live modes and spending', async () => {
  const result = await coordinateCouncil({ question: 'Analyze a matchup', mode: 'live' });
  assert.equal(result.allowed, false);
  assert.equal(result.error, 'live_ai_disabled');
  assert.equal(result.providersCalled, 0);
  assert.equal(result.spendLimitUsd, 0);
});

const { getEnvironmentVariableNames } = require('../lib/provider-config');
test('configuration publishes only variable names and never secret values', () => {
  const names = getEnvironmentVariableNames();
  assert.ok(names.includes('GEMINI_API_KEY'));
  assert.ok(names.includes('OPENAI_API_KEY'));
  assert.ok(names.includes('SAMBANOVA_API_KEY'));
  assert.ok(names.includes('SUPABASE_URL'));
  assert.ok(names.includes('SUPABASE_ANON_KEY'));
  assert.ok(names.every(name => /^[A-Z][A-Z0-9_]+$/.test(name)));
});
test('provider activation rejects mixed-case and alternative truthy flags', () => {
  for (const value of ['TRUE', 'Yes', 'ON', '1']) {
    const result = validateProviderConfiguration({ ENABLE_LIVE_AI: value });
    assert.equal(result.validForOfflineMode, false);
    assert.equal(result.liveEnabled, false);
    assert.equal(result.spendLimitUsd, 0);
  }
});

const { getProvisioningChecklist } = require('../lib/provider-provisioning');
test('provider provisioning checklist never exposes credentials or enables calls', () => {
  const result = getProvisioningChecklist();
  assert.equal(result.liveEnabled, false);
  assert.equal(result.credentialsMustBeRotated, true);
  assert.equal(result.spendLimitUsd, 0);
  assert.ok(result.providers.every(provider => !provider.enabled && !provider.verified));
  assert.equal(result.providers.find(provider => provider.id === 'muse').envName, null);
});

const provisioningHandler = require('../api/council/provisioning');
test('provisioning endpoint exposes safe checklist on GET only', () => {
  function call(method) {
    const result = { statusCode: 200, headers: {} };
    const res = {
      setHeader(k, v) { result.headers[k] = v; },
      status(n) { result.statusCode = n; return this; },
      json(value) { result.body = value; return this; }
    };
    provisioningHandler({ method }, res);
    return result;
  }
  const response = call('GET');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.liveEnabled, false);
  assert.equal(response.body.spendLimitUsd, 0);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(call('POST').statusCode, 405);
});

const { getAuthenticationReadiness, authenticateProvider } = require('../lib/provider-auth');
test('authentication readiness remains disabled for every supported adapter', () => {
  for (const id of ['gpt', 'gemini', 'muse']) {
    const result = getAuthenticationReadiness(id);
    assert.equal(result.authenticated, false);
    assert.equal(result.canConnect, false);
    assert.equal(result.providerCallsAllowed, 0);
    assert.equal(result.spendLimitUsd, 0);
  }
  assert.throws(() => getAuthenticationReadiness('unknown'), /unsupported_provider/);
});
test('provider authentication refuses requests without reading credentials', async () => {
  for (const id of ['gpt', 'gemini', 'muse']) {
    await assert.rejects(authenticateProvider(id), { code: 'PROVIDER_AUTH_DISABLED' });
  }
});

const { assessIndependentResponses } = require('../lib/council-coordinator');
test('coordinator refuses duplicated or prompt-only responses', async () => {
  const question = 'Best bets today';
  const prompt = buildCouncilPlan(question).independentPrompt;
  const duplicate = await coordinateCouncil({ question, responses: { GPT: 'same analysis', Gemini: 'same analysis' } });
  assert.equal(duplicate.readyForChallenge, false);
  assert.equal(duplicate.challengePrompt, null);
  assert.ok(duplicate.responseAssessment.issues.includes('duplicate_responses'));
  const copied = await coordinateCouncil({ question, responses: { GPT: prompt, Gemini: 'Independent analysis' } });
  assert.equal(copied.readyForChallenge, false);
  assert.ok(copied.responseAssessment.issues.includes('prompt_is_not_a_response'));
  assert.equal(assessIndependentResponses(question, { GPT: 'Only one' }).valid, false);
});

test('coordinator detects duplicated answers despite case and whitespace changes', async () => {
  const result = await coordinateCouncil({
    question: 'Best bets today',
    responses: { GPT: 'Same   ANALYSIS', Gemini: 'same analysis' }
  });
  assert.equal(result.readyForChallenge, false);
  assert.ok(result.responseAssessment.issues.includes('duplicate_responses'));
});

const { prepareCouncilExchange } = require('../lib/council-exchange');
test('exchange prepares attributed challenges without calling providers', () => {
  const result = prepareCouncilExchange({
    question: 'Best bets today', responses: { GPT: 'Evidence A', Gemini: 'Evidence B' }
  });
  assert.equal(result.ready, true);
  assert.equal(result.messages.length, 2);
  assert.equal(result.providersCalled, 0);
  assert.equal(result.spendLimitUsd, 0);
  assert.match(result.messages[0].text, /Other independent positions/);
});
test('exchange blocks unverified or invalid input and excessive rounds', () => {
  const result = prepareCouncilExchange({ question: 'Best bets today', responses: { GPT: 'Same', Gemini: 'same' } });
  assert.equal(result.ready, false);
  assert.equal(result.messages.length, 0);
  assert.throws(() => prepareCouncilExchange({ question: 'Test', round: 3 }), /invalid_round/);
});

const exchangeHandler = require('../api/council/exchange');
async function exchangeRequest(body, method = 'POST') {
  const result = { statusCode: 200, headers: {} };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    status(n) { result.statusCode = n; return this; },
    json(value) { result.body = value; return this; }
  };
  await exchangeHandler({ method, body }, res);
  return result;
}
test('exchange API allows only POST and manual mode', async () => {
  assert.equal((await exchangeRequest({}, 'GET')).statusCode, 405);
  assert.equal((await exchangeRequest({ mode: 'live', question: 'Test' })).statusCode, 400);
  assert.equal((await exchangeRequest(null)).statusCode, 400);
});
test('exchange API returns offline messages for independent answers', async () => {
  const result = await exchangeRequest({
    mode: 'manual', round: 1, question: 'Best bets today',
    responses: { GPT: 'Independent finding A', Gemini: 'Independent finding B' }
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ready, true);
  assert.equal(result.body.messages.length, 2);
  assert.equal(result.body.providersCalled, 0);
  assert.equal(result.body.spendLimitUsd, 0);
});
test('exchange API refuses invalid rounds and duplicated answers', async () => {
  const badRound = await exchangeRequest({ mode: 'manual', round: 3, question: 'Test' });
  assert.equal(badRound.statusCode, 400);
  const duplicate = await exchangeRequest({
    mode: 'manual', round: 1, question: 'Best bets today',
    responses: { GPT: 'Same answer', Gemini: 'same  answer' }
  });
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.body.ready, false);
  assert.equal(duplicate.body.messages.length, 0);
});

const { assessMuseIdentity } = require('../lib/muse-identity');
test('Muse does not accept Llama gateway credentials as official identity', () => {
  const result = assessMuseIdentity({ provider: 'sambanova', credentialName: 'LLAMA_API_KEY', officialApiVerified: true });
  assert.equal(result.identityVerified, false);
  assert.equal(result.canCall, false);
});
test('Even verified official Muse identity cannot enable calls without approval', () => {
  const result = assessMuseIdentity({ provider: 'meta', credentialName: 'META_API_KEY', officialApiVerified: true });
  assert.equal(result.identityVerified, true);
  assert.equal(result.enabled, false);
  assert.equal(result.canCall, false);
  assert.equal(result.spendLimitUsd, 0);
});

const museStatusHandler = require('../api/council/muse-status');
test('Muse status endpoint reveals no credentials and stays disabled', () => {
  const response = { code: 200, body: null, headers: {} };
  const res = {
    setHeader(k,v) { response.headers[k] = v; },
    status(n) { response.code = n; return this; },
    json(value) { response.body = value; return this; }
  };
  museStatusHandler({ method: 'GET' }, res);
  assert.equal(response.code, 200);
  assert.equal(response.body.identityVerified, false);
  assert.equal(response.body.canCall, false);
  assert.equal(response.body.spendLimitUsd, 0);
  assert.equal(JSON.stringify(response.body).includes('LLAMA_API_KEY'), false);
  museStatusHandler({ method: 'POST' }, res);
  assert.equal(response.code, 405);
});

const { getTransportReadiness, generateProviderResponse } = require('../lib/live-provider-transport');
test('GPT and Gemini transport remain disabled with no provider requests', async () => {
  for (const provider of ['gpt', 'gemini']) {
    const readiness = getTransportReadiness(provider);
    assert.equal(readiness.enabled, false);
    assert.equal(readiness.requestsAllowed, 0);
    assert.equal(readiness.spendLimitUsd, 0);
    await assert.rejects(generateProviderResponse(provider, 'Research NBA games'), { code: 'LIVE_AI_DISABLED' });
  }
  assert.throws(() => getTransportReadiness('muse'), /unsupported_provider/);
});
