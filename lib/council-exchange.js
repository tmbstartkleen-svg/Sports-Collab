'use strict';
// Deterministic council conversation protocol. Produces instructions, never sends provider requests.
const { validateQuestion, normalizeResponses, PROVIDERS } = require('./council-engine');
const { assessIndependentResponses } = require('./council-coordinator');
const MAX_ROUNDS = 2;
function prepareCouncilExchange({ question, responses = {}, round = 1 } = {}) {
  if (!validateQuestion(question)) throw new TypeError('invalid_question');
  if (!Number.isInteger(round) || round < 1 || round > MAX_ROUNDS) throw new TypeError('invalid_round');
  const normalized = normalizeResponses(responses);
  const assessment = assessIndependentResponses(question, normalized);
  if (!assessment.valid) {
    return Object.freeze({ ready: false, round, issues: assessment.issues, messages: [], providersCalled: 0, spendLimitUsd: 0 });
  }
  const messages = PROVIDERS.filter(name => normalized[name].trim()).map(name => ({
    recipient: name,
    role: 'challenge',
    text: 'Council challenge round ' + round + '. Original question: ' + question.trim() +
      '\nYour previous position:\n' + normalized[name] +
      '\nOther independent positions:\n' +
      PROVIDERS.filter(other => other !== name && normalized[other].trim())
        .map(other => other + ':\n' + normalized[other]).join('\n\n') +
      '\nIdentify specific factual disagreements and cite evidence with timestamps. Verify rosters, injuries and observed market prices. Distinguish unknown facts from estimates. Do not claim consensus without evidence. Do not place wagers.'
  }));
  return Object.freeze({ ready: true, round, issues: [], messages, providersCalled: 0, spendLimitUsd: 0, communication: 'manual_exchange_only' });
}
module.exports = { MAX_ROUNDS, prepareCouncilExchange };
