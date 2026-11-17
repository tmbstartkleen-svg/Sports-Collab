'use strict';
// A bounded two-model research/debate sequence. No wagering and no direct HTTP.
const { assertLiveAccess } = require('./live-access-policy');
const { validatePrompt, MAX_PROMPT } = require('./provider-request-builders');
function withinLimit(prefix, content) { return prefix + String(content).slice(0, MAX_PROMPT - prefix.length); }
const { generateProviderResponse } = require('./live-provider-transport');
function bounded(text) { return String(text).slice(0, 1800); }
async function runTwoModelCouncil(question) {
  const input = validatePrompt(question);
  // Fail closed before any provider invocation, even if transport behavior changes.
  assertLiveAccess();
  const research = withinLimit('Independently research this sports question. Separate facts from assumptions; do not invent live sources. Question: ', input);
  const [gpt, gemini] = await Promise.all([
    generateProviderResponse('gpt', research),
    generateProviderResponse('gemini', research)
  ]);
  const challenge = 'Challenge factual claims and unsupported confidence in the other model\'s analysis. Do not invent sources. Question: ' + input + '\nOther analysis: ';
  const [gptChallenge, geminiChallenge] = await Promise.all([
    generateProviderResponse('gpt', withinLimit(challenge, bounded(gemini))),
    generateProviderResponse('gemini', withinLimit(challenge, bounded(gpt)))
  ]);
  return {
    mode: 'two_model_live', wageringEnabled: false,
    research: { gpt, gemini },
    challenges: { gpt: gptChallenge, gemini: geminiChallenge },
    verified: false, providerCalls: 4
  };
}
module.exports = { runTwoModelCouncil };
