'use strict';
// A bounded two-model research/debate sequence. No wagering and no direct HTTP.
const { assertLiveAccess } = require('./live-access-policy');
const { validatePrompt } = require('./provider-request-builders');
const { generateProviderResponse } = require('./live-provider-transport');
function bounded(text) { return String(text).slice(0, 1800); }
async function runTwoModelCouncil(question) {
  const input = validatePrompt(question);
  // Fail closed before any provider invocation, even if transport behavior changes.
  assertLiveAccess();
  const research = 'Independently research the following sports question. Separate sourced facts from assumptions. Do not invent live injuries, odds or sources. Question: ' + input;
  const [gpt, gemini] = await Promise.all([
    generateProviderResponse('gpt', research),
    generateProviderResponse('gemini', research)
  ]);
  const challenge = 'Challenge factual claims and unsupported confidence in the other model\'s analysis. Do not invent sources. Question: ' + input + '\nOther analysis: ';
  const [gptChallenge, geminiChallenge] = await Promise.all([
    generateProviderResponse('gpt', challenge + bounded(gemini)),
    generateProviderResponse('gemini', challenge + bounded(gpt))
  ]);
  return {
    mode: 'two_model_live', wageringEnabled: false,
    research: { gpt, gemini },
    challenges: { gpt: gptChallenge, gemini: geminiChallenge },
    verified: false, providerCalls: 4
  };
}
module.exports = { runTwoModelCouncil };
