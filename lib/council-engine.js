'use strict';
// Deterministic council workflow. No provider SDKs, credentials, or network calls.
const PROVIDERS = Object.freeze(['GPT', 'Gemini', 'Muse']);
const MAX_QUESTION_LENGTH = 4000;
const MAX_RESPONSE_LENGTH = 12000;
function validateQuestion(question) {
  return typeof question === 'string' && question.trim().length > 0 &&
    question.length <= MAX_QUESTION_LENGTH;
}
function normalizeResponses(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(PROVIDERS.map(name => [
    name, typeof input[name] === 'string' ? input[name].slice(0, MAX_RESPONSE_LENGTH) : ''
  ]));
}
function buildCouncilPlan(question, responses = {}) {
  if (!validateQuestion(question)) throw new TypeError('invalid_question');
  const normalized = normalizeResponses(responses);
  const available = PROVIDERS.filter(name => normalized[name].trim());
  const missing = PROVIDERS.filter(name => !normalized[name].trim());
  const independentPrompt = 'Research independently. Cite source URLs and timestamps, verify rosters and injuries, distinguish observed odds from estimates, report uncertainty, and never invent facts. Question: ' + question.trim();
  const challengePrompt = available.length < 2 ? null :
    'CROSS-EXAMINATION: Review these attributed model responses. Identify conflicting facts, missing sources, stale odds, unsupported probabilities, and correlated picks. Do not fabricate consensus.\n' +
    available.map(name => name + ':\n' + normalized[name]).join('\n\n');
  return {
    mode: 'offline_manual_only',
    providersCalled: 0,
    liveEnabled: false,
    spendLimitUsd: 0,
    independentPrompt,
    challengePrompt,
    available,
    missing,
    readyForChallenge: available.length >= 2,
    verified: false,
    warning: 'A response mentioning a source is not independently verified.'
  };
}
module.exports = { PROVIDERS, MAX_QUESTION_LENGTH, MAX_RESPONSE_LENGTH, validateQuestion, normalizeResponses, buildCouncilPlan };
