'use strict';
// Offline council coordination boundary. No network calls, credentials, or automatic wagering.
const { getAdapters } = require('./provider-adapters');
const { evaluateLiveAccess } = require('./live-access-policy');
const { validateQuestion, buildCouncilPlan, normalizeResponses } = require('./council-engine');

async function coordinateCouncil({ question, responses = {}, mode = 'manual' } = {}) {
  if (!validateQuestion(question)) throw new TypeError('invalid_question');
  const policy = evaluateLiveAccess();
  const adapters = getAdapters();
  const providers = Object.keys(adapters);
  if (mode !== 'manual') {
    return Object.freeze({
      mode: 'offline_manual_only',
      allowed: false,
      error: 'live_ai_disabled',
      providersCalled: 0,
      spendLimitUsd: policy.spendLimitUsd,
      providerIds: providers
    });
  }
  const plan = buildCouncilPlan(question, normalizeResponses(responses));
  return { ...plan, providerIds: providers, communication: 'manual_exchange_only' };
}
module.exports = { coordinateCouncil };
