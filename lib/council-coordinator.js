'use strict';
// Offline council coordination boundary. No network calls, credentials, or automatic wagering.
const { getAdapters } = require('./provider-adapters');
const { evaluateLiveAccess } = require('./live-access-policy');
const { validateQuestion, buildCouncilPlan, normalizeResponses } = require('./council-engine');

function assessIndependentResponses(question, responses) {
  const normalized = normalizeResponses(responses);
  const filled = Object.entries(normalized).filter(([, value]) => value.trim());
  const values = filled.map(([, value]) => value.trim().replace(/\s+/g, ' ').toLowerCase());
  const promptOnly = filled.filter(([, value]) =>
    /^(Research independently|Independently research this sports question)\b/i.test(value.trim()) ||
    value.trim() === buildCouncilPlan(question).independentPrompt);
  const issues = [];
  if (filled.length < 2) issues.push('at_least_two_responses_required');
  if (promptOnly.length) issues.push('prompt_is_not_a_response');
  if (new Set(values).size !== values.length) issues.push('duplicate_responses');
  return { valid: issues.length === 0, issues, responseCount: filled.length };
}
async function coordinateCouncil({ question, responses = {}, mode = 'manual' } = {}) {
  if (!validateQuestion(question)) throw new TypeError('invalid_question');
  const policy = evaluateLiveAccess();
  const providers = Object.keys(getAdapters());
  if (mode !== 'manual') {
    return Object.freeze({
      mode: 'offline_manual_only', allowed: false, error: 'live_ai_disabled',
      providersCalled: 0, spendLimitUsd: policy.spendLimitUsd, providerIds: providers
    });
  }
  const plan = buildCouncilPlan(question, normalizeResponses(responses));
  const assessment = assessIndependentResponses(question, responses);
  return {
    ...plan,
    readyForChallenge: assessment.valid,
    challengePrompt: assessment.valid ? plan.challengePrompt : null,
    responseAssessment: assessment,
    providerIds: providers,
    communication: 'manual_exchange_only'
  };
}
module.exports = { coordinateCouncil, assessIndependentResponses };
