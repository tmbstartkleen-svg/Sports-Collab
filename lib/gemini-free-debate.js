'use strict';
// Strictly opt-in Gemini-only role debate. Never calls OpenAI or Muse.
const { validatePrompt, buildGeminiRequest } = require('./provider-request-builders');
const FREE_MODEL = 'gemini-2.5-flash-lite';
const MAX_CALLS = 4;
function readiness() {
  const enabled = process.env.GEMINI_FREE_DEBATE_ENABLED === 'true';
  const verified = process.env.GEMINI_FREE_MODEL_VERIFIED === FREE_MODEL;
  return { enabled: enabled && verified, model: FREE_MODEL, provider: 'Gemini',
    gptEnabled: false, museEnabled: false, spendLimitUsd: 0,
    reason: enabled && verified ? 'free_tier_model_confirmed_by_operator' : 'free_model_verification_required' };
}
async function runGeminiFreeDebate(question, fetcher = fetch) {
  const input = validatePrompt(question);
  const status = readiness();
  if (!status.enabled) { const e = new Error(status.reason); e.code = 'FREE_DEBATE_DISABLED'; throw e; }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('gemini_key_missing');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + FREE_MODEL + ':generateContent';
  let calls = 0;
  async function ask(prompt) {
    if (++calls > MAX_CALLS) throw new Error('request_limit');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetcher(url, { method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiRequest(prompt.slice(0, 4000))),
        signal: controller.signal });
      if (!response.ok) throw new Error('gemini_unavailable_' + response.status);
      const data = await response.json();
      const answer = (data.candidates || []).flatMap(x => x.content?.parts || [])
        .map(x => x.text || '').join('\n').trim().slice(0, 5000);
      if (!answer) throw new Error('gemini_empty_response');
      return answer;
    } finally { clearTimeout(timeout); }
  }
  // These are two roles of ONE model, not independent AI systems.
  const researchA = await ask('Act as a cautious evidence analyst. No invented live data or sources. Topic: ' + input);
  const researchB = await ask('Act as a skeptical counter-analyst. Independently examine assumptions and risks. No invented live data. Topic: ' + input);
  const challenge = await ask('Critique these two analyses, identify disagreements and missing evidence. A: ' + researchA.slice(0, 1300) + '\nB: ' + researchB.slice(0, 1300));
  const conclusion = await ask('Synthesize the arguments without pretending independent verification. Topic: ' + input.slice(0, 500) + '\nCritique: ' + challenge.slice(0, 1600));
  return { mode: 'gemini_single_provider_role_debate', provider: 'Gemini', model: FREE_MODEL,
    independentProviders: 1, gptCalled: false, museCalled: false, wageringEnabled: false,
    verified: false, providerCalls: calls, spendLimitUsd: 0,
    research: { analyst: researchA, skeptic: researchB }, challenge, conclusion };
}
module.exports = { readiness, runGeminiFreeDebate, FREE_MODEL };
