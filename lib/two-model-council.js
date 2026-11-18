'use strict';
// Pure research/debate orchestration. The public entry point remains gated.
const { assertLiveAccess } = require('./live-access-policy');
const { validatePrompt, MAX_PROMPT } = require('./provider-request-builders');
const { generateProviderResponse } = require('./live-provider-transport');
function withinLimit(prefix, content) {
  return prefix + String(content).slice(0, Math.max(0, MAX_PROMPT - prefix.length));
}
function bounded(text) { return String(text).slice(0, 1800); }
async function orchestrateCouncil(question, generate) {
  const input = validatePrompt(question);
  const research = withinLimit('Independently research this sports question. Separate facts from assumptions; do not invent live sources. Question: ', input);
  const [gpt, gemini] = await Promise.all([
    generate('gpt', research), generate('gemini', research)
  ]);
  const challenge = 'Challenge unsupported claims; do not invent sources. Question: ' + input.slice(0, 1500) + '\\nOther analysis: ';
  const [gptChallenge, geminiChallenge] = await Promise.all([
    generate('gpt', withinLimit(challenge, bounded(gemini))),
    generate('gemini', withinLimit(challenge, bounded(gpt)))
  ]);
  const rebuttalPrefix = 'Respond to the other model\'s criticism of your original analysis. Correct errors, identify unresolved disagreements, and state what evidence is missing. Question: ' + input.slice(0, 900) + '\\nCriticism: ';
  const [gptRebuttal, geminiRebuttal] = await Promise.all([
    generate('gpt', withinLimit(rebuttalPrefix, bounded(geminiChallenge))),
    generate('gemini', withinLimit(rebuttalPrefix, bounded(gptChallenge)))
  ]);
  const finalPrefix = 'Give your final independent position, noting remaining uncertainty and disagreement. Do not invent citations or claim consensus. Question: ' + input.slice(0, 900) + '\\nOther rebuttal: ';
  const [gptFinal, geminiFinal] = await Promise.all([
    generate('gpt', withinLimit(finalPrefix, bounded(geminiRebuttal))),
    generate('gemini', withinLimit(finalPrefix, bounded(gptRebuttal)))
  ]);
  return {
    mode: 'two_model_live', wageringEnabled: false,
    research: { gpt, gemini },
    challenges: { gpt: gptChallenge, gemini: geminiChallenge },
    rebuttals: { gpt: gptRebuttal, gemini: geminiRebuttal },
    finalPositions: { gpt: gptFinal, gemini: geminiFinal },
    verified: false, providerCalls: 8
  };
}
async function runTwoModelCouncil(question) {
  validatePrompt(question);
  assertLiveAccess(); // No external provider call before explicit approval.
  return orchestrateCouncil(question, generateProviderResponse);
}
module.exports = { runTwoModelCouncil, orchestrateCouncil };
